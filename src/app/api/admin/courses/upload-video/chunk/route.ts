import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"

export const maxDuration = 300 // 5 min timeout for chunks

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const uploadUrl = request.headers.get("x-upload-url")
        if (!uploadUrl) {
            return NextResponse.json({ error: "Missing x-upload-url header" }, { status: 400 })
        }

        const contentRange = request.headers.get("content-range")
        const contentType = request.headers.get("x-content-type") || "video/*"
        const accessToken = request.headers.get("x-access-token")

        if (!contentRange) {
            return NextResponse.json({ error: "Missing content-range header" }, { status: 400 })
        }

        // Read chunk
        const chunkBuffer = await request.arrayBuffer()

        // Forward chunk to YouTube
        const ytHeaders: Record<string, string> = {
            "Content-Range": contentRange,
            "Content-Type": contentType,
            "Content-Length": String(chunkBuffer.byteLength),
        }

        const ytResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: ytHeaders,
            body: chunkBuffer,
        })

        // 308 resume incomplete
        if (ytResponse.status === 308) {
            return NextResponse.json({ status: "continue" })
        }

        // 200/201 upload complete
        if (ytResponse.ok) {
            const data = await ytResponse.json()
            const videoId = data.id

            // Step 3: Get video duration
            let durationSec = 0
            if (accessToken && videoId) {
                try {
                    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY
                    const detailsResponse = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY || accessToken}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    )
                    const detailsData = await detailsResponse.json()

                    if (detailsData.items?.[0]?.contentDetails?.duration) {
                        const isoDuration = detailsData.items[0].contentDetails.duration
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
                }
            }

            return NextResponse.json({
                status: "complete",
                videoId,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                durationSec,
            })
        }

        // Error catching
        const errText = await ytResponse.text()
        return NextResponse.json(
            { error: `YouTube upload chunk error (${ytResponse.status}): ${errText}` },
            { status: ytResponse.status }
        )
    } catch (err) {
        console.error("Video chunk error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
