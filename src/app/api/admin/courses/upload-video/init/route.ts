import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const supabase = await createClient()

        // Verify auth
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
        const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
        const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN

        if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
            return NextResponse.json(
                { error: "YouTube API not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env" },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { title, description, fileSize, mimeType } = body

        if (!fileSize) {
            return NextResponse.json({ error: "No file size provided" }, { status: 400 })
        }

        // ── Step 1: Get fresh access token from refresh token ──
        let accessToken = session.provider_token || ""

        // Retrieve persistent user refresh token we stored upon oauth callback
        const userRefreshToken = session.user?.user_metadata?.youtube_refresh_token

        if (!accessToken && (session.provider_refresh_token || userRefreshToken)) {
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: YOUTUBE_CLIENT_ID,
                    client_secret: YOUTUBE_CLIENT_SECRET,
                    refresh_token: session.provider_refresh_token || userRefreshToken,
                    grant_type: "refresh_token",
                }),
            })

            const tokenData = await tokenResponse.json()
            if (!tokenData.access_token) {
                console.error("YouTube provider token refresh failed:", tokenData)
                return NextResponse.json(
                    { error: "Failed to authenticate with Google for YouTube upload" },
                    { status: 500 }
                )
            }

            accessToken = tokenData.access_token
        }

        if (!accessToken && YOUTUBE_REFRESH_TOKEN) {
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: YOUTUBE_CLIENT_ID,
                    client_secret: YOUTUBE_CLIENT_SECRET,
                    refresh_token: YOUTUBE_REFRESH_TOKEN,
                    grant_type: "refresh_token",
                }),
            })

            const tokenData = await tokenResponse.json()
            if (!tokenData.access_token) {
                console.error("YouTube env token refresh failed:", tokenData)
                return NextResponse.json(
                    { error: "Failed to authenticate with YouTube" },
                    { status: 500 }
                )
            }

            accessToken = tokenData.access_token
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: "Connect Google with YouTube upload permission, or add GOOGLE_REFRESH_TOKEN to .env" },
                { status: 400 }
            )
        }

        // ── Step 2: Initiate resumable upload ──────────────────
        const initResponse = await fetch(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Upload-Content-Length": String(fileSize),
                    "X-Upload-Content-Type": mimeType || "video/*",
                },
                body: JSON.stringify({
                    snippet: {
                        title: title || "Untitled Lecture",
                        description: description || "",
                        categoryId: "27", // Education
                    },
                    status: {
                        privacyStatus: "unlisted", // Unlisted by default for LMS
                        selfDeclaredMadeForKids: false,
                    },
                }),
            }
        )

        const uploadUrl = initResponse.headers.get("location")
        if (!uploadUrl) {
            const errorBody = await initResponse.text()
            console.error("YouTube upload init failed:", errorBody)
            return NextResponse.json(
                { error: "Failed to initialize YouTube upload" },
                { status: 500 }
            )
        }

        return NextResponse.json({ uploadUrl, accessToken })
    } catch (err) {
        console.error("Video init error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
