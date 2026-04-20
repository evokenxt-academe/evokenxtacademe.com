import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/courses/upload-video
 * 
 * Uploads a video file to YouTube via the YouTube Data API v3.
 * Returns the YouTube video ID and auto-detected duration.
 * 
 * Expected: multipart/form-data with fields:
 *   - video: File
 *   - title: string
 *   - description: string (optional)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const videoFile = formData.get("video") as File | null
        const title = (formData.get("title") as string) || "Untitled Lecture"
        const description = (formData.get("description") as string) || ""

        if (!videoFile) {
            return NextResponse.json({ error: "No video file provided" }, { status: 400 })
        }

        // Validate file size (max 2GB)
        if (videoFile.size > 2 * 1024 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 2GB" }, { status: 400 })
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY
        const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN
        const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
        const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

        if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
            return NextResponse.json(
                { error: "YouTube API not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env" },
                { status: 500 }
            )
        }

        if (!YOUTUBE_REFRESH_TOKEN) {
             return NextResponse.json(
                { error: "Missing GOOGLE_REFRESH_TOKEN. You must generate an OAuth2 Refresh Token (e.g., via Google OAuth Playground) with the YouTube Data API v3 scope and add it to your .env file." },
                { status: 500 }
            )
        }

        // ── Step 1: Get fresh access token from refresh token ──
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
            console.error("YouTube token refresh failed:", tokenData)
            return NextResponse.json(
                { error: "Failed to authenticate with YouTube" },
                { status: 500 }
            )
        }

        const accessToken = tokenData.access_token

        // ── Step 2: Upload video to YouTube ──────────────────
        const videoBytes = await videoFile.arrayBuffer()
        const videoBuffer = Buffer.from(videoBytes)

        // Initiate resumable upload
        const initResponse = await fetch(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Upload-Content-Length": videoBuffer.length.toString(),
                    "X-Upload-Content-Type": videoFile.type,
                },
                body: JSON.stringify({
                    snippet: {
                        title,
                        description,
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

        // Upload the actual video bytes
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": videoFile.type,
                "Content-Length": videoBuffer.length.toString(),
            },
            body: videoBuffer,
        })

        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text()
            console.error("YouTube upload failed:", errorBody)
            return NextResponse.json(
                { error: "YouTube upload failed" },
                { status: 500 }
            )
        }

        const uploadResult = await uploadResponse.json()
        const videoId = uploadResult.id

        // ── Step 3: Get video duration ───────────────────────
        let durationSec = 0

        try {
            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY || accessToken}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            )
            const detailsData = await detailsResponse.json()

            if (detailsData.items?.[0]?.contentDetails?.duration) {
                const isoDuration = detailsData.items[0].contentDetails.duration
                // Parse ISO 8601 duration (PT1H2M3S)
                const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
                if (match) {
                    const hours = parseInt(match[1] || "0", 10)
                    const minutes = parseInt(match[2] || "0", 10)
                    const seconds = parseInt(match[3] || "0", 10)
                    durationSec = hours * 3600 + minutes * 60 + seconds
                }
            }
        } catch (err) {
            console.error("Failed to fetch video duration:", err)
            // Duration will be 0 — not a fatal error
        }

        return NextResponse.json({
            success: true,
            videoId,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            durationSec,
        })
    } catch (err) {
        console.error("Video upload error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

