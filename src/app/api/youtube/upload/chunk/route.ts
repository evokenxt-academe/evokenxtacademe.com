import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * POST /api/youtube/upload/chunk
 *
 * Proxies a single chunk from the browser to the YouTube resumable upload URL.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const uploadUrl = request.headers.get("x-upload-url")
        if (!uploadUrl) {
            return NextResponse.json(
                { error: "Missing x-upload-url header." },
                { status: 400 }
            )
        }

        const contentRange = request.headers.get("content-range")
        const contentType = request.headers.get("x-content-type") || "video/*"
        const accessToken = request.headers.get("x-access-token")

        if (!contentRange) {
            return NextResponse.json(
                { error: "Missing content-range header." },
                { status: 400 }
            )
        }

        const chunkBuffer = await request.arrayBuffer()

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

        if (ytResponse.status === 308) {
            return NextResponse.json({ status: "continue" }, { status: 200 })
        }

        if (ytResponse.ok) {
            const data = await ytResponse.json()
            const videoId = data.id

            let durationSec = 0
            if (accessToken && videoId) {
                const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY

                // Retry up to 3 times with delay — freshly uploaded videos
                // may not have contentDetails immediately available
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        if (attempt > 0) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        }

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

                            // Successfully got a non-zero duration, break
                            if (durationSec > 0) break
                        }
                    } catch (err) {
                        console.error(`Duration fetch attempt ${attempt + 1} failed:`, err)
                    }
                }

                if (durationSec === 0) {
                    console.warn(`Could not fetch duration for video ${videoId} after retries — video may still be processing`)
                }
            }

            return NextResponse.json({
                status: "complete",
                videoId,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                durationSec,
            })
        }

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