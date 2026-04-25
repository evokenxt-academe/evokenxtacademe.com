import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/adminClient"

export const runtime = "nodejs"

/**
 * POST /api/youtube/upload/init
 *
 * Initiates a resumable upload session with YouTube and returns the upload URL.
 * The client sends the file chunks to /api/youtube/upload/chunk.
 *
 * Token resolution order:
 *  1. Client-supplied accessToken (from recent OAuth)
 *  2. session.provider_token (if still fresh)
 *  3. Refresh from youtube_tokens table (persistent DB storage — fixes the token bug)
 *  4. Refresh from user_metadata.youtube_refresh_token (legacy)
 *  5. Refresh from env YOUTUBE_REFRESH_TOKEN (global fallback)
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const supabase = await createClient()

        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
        }

        const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
        const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
        if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
            return NextResponse.json(
                { error: "YouTube API not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env" },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { title, description, fileSize, mimeType, accessToken: clientAccessToken } = body

        if (!fileSize) {
            return NextResponse.json({ error: "No file size provided." }, { status: 400 })
        }

        let accessToken = clientAccessToken || session.provider_token || ""

        // Helper to refresh using a given refresh_token
        async function refreshAccessToken(refreshToken: string): Promise<string | null> {
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: YOUTUBE_CLIENT_ID!,
                    client_secret: YOUTUBE_CLIENT_SECRET!,
                    refresh_token: refreshToken,
                    grant_type: "refresh_token",
                }),
            })

            const tokenData = await tokenResponse.json()
            if (!tokenData.access_token) {
                console.error("Token refresh failed:", tokenData)
                return null
            }

            // Update the cached access_token in DB
            try {
                const adminClient = createAdminClient()
                await adminClient
                    .from("youtube_tokens")
                    .upsert(
                        {
                            user_id: session!.user.id,
                            refresh_token: refreshToken,
                            access_token: tokenData.access_token,
                            expires_at: tokenData.expires_in
                                ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                                : null,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    )
            } catch {
                // Non-blocking
            }

            return tokenData.access_token
        }

        // Strategy 1: Try youtube_tokens table (most reliable)
        if (!accessToken) {
            try {
                const adminClient = createAdminClient()
                const { data: tokenRow } = await adminClient
                    .from("youtube_tokens")
                    .select("refresh_token, access_token, expires_at")
                    .eq("user_id", session.user.id)
                    .maybeSingle()

                if (tokenRow) {
                    // Check if cached access_token is still valid
                    if (tokenRow.access_token && tokenRow.expires_at) {
                        const expiresAt = new Date(tokenRow.expires_at)
                        if (expiresAt.getTime() > Date.now() + 60_000) {
                            accessToken = tokenRow.access_token
                        }
                    }

                    // If still no access_token, refresh using stored refresh_token
                    if (!accessToken && tokenRow.refresh_token) {
                        accessToken = (await refreshAccessToken(tokenRow.refresh_token)) ?? ""
                    }
                }
            } catch (err) {
                console.error("Error reading youtube_tokens:", err)
            }
        }

        // Strategy 2: Refresh from session.provider_refresh_token or user_metadata
        if (!accessToken) {
            const refreshToken = session.provider_refresh_token
                || session.user?.user_metadata?.youtube_refresh_token
            if (refreshToken) {
                accessToken = (await refreshAccessToken(refreshToken)) ?? ""
            }
        }

        // Strategy 3: Env-level fallback
        if (!accessToken) {
            const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN
            if (YOUTUBE_REFRESH_TOKEN) {
                accessToken = (await refreshAccessToken(YOUTUBE_REFRESH_TOKEN)) ?? ""
            }
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: "Connect Google with YouTube upload permission, or add GOOGLE_REFRESH_TOKEN to .env" },
                { status: 400 }
            )
        }

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
                        categoryId: "27",
                    },
                    status: {
                        privacyStatus: "unlisted",
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