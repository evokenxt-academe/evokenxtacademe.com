import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"

export const runtime = "nodejs"

/**
 * POST /api/youtube/duration
 *
 * Fetches the duration of a YouTube video from a URL or video ID.
 * Supports retry/polling for freshly uploaded videos where YouTube
 * hasn't processed contentDetails yet.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(["admin", "instructor"])
        if ("error" in auth) {
            return auth.error
        }

        const body = await request.json()
        const { videoUrl, videoId: directVideoId } = body

        // Extract video ID from URL or use directly
        let videoId = directVideoId || ""
        if (!videoId && videoUrl) {
            videoId = extractVideoId(videoUrl)
        }

        if (!videoId) {
            return NextResponse.json(
                { error: "Invalid YouTube URL or video ID" },
                { status: 400 }
            )
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY
        if (!YOUTUBE_API_KEY) {
            try {
                // Scrape the YouTube page directly since we don't have an API key
                const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                })
                
                if (pageRes.ok) {
                    const html = await pageRes.text()
                    
                    const titleMatch = html.match(/<meta itemprop="name" content="([^"]+)">/)
                    const durationMatch = html.match(/<meta itemprop="duration" content="([^"]+)">/)
                    const descMatch = html.match(/<meta itemprop="description" content="([^"]+)">/)
                    
                    const title = titleMatch ? titleMatch[1] : "YouTube Video"
                    const description = descMatch ? descMatch[1] : ""
                    const durationSec = durationMatch ? parseIsoDuration(durationMatch[1]) : 0

                    return NextResponse.json({
                        success: true,
                        videoId,
                        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                        durationSec,
                        title,
                        description,
                        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        note: "Using scraped data due to missing YOUTUBE_API_KEY."
                    })
                }
            } catch (e) {
                console.error("Scraping fallback failed:", e)
            }

            return NextResponse.json({
                success: true,
                videoId,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                durationSec: 0,
                title: "YouTube Video (No API Key)",
                description: "",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                note: "Duration auto-detection requires a YouTube API Key. Please configure YOUTUBE_API_KEY in your .env file."
            })
        }

        // Try to fetch duration with retry (for freshly uploaded videos)
        const maxRetries = 3
        const retryDelay = 2000 // 2 seconds

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const detailsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
                )

                if (!detailsResponse.ok) {
                    const errorText = await detailsResponse.text()
                    console.error(`YouTube API error (attempt ${attempt + 1}):`, errorText)
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay))
                        continue
                    }
                    return NextResponse.json(
                        { error: "Failed to fetch video details from YouTube" },
                        { status: 500 }
                    )
                }

                const detailsData = await detailsResponse.json()

                if (!detailsData.items?.length) {
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay))
                        continue
                    }
                    return NextResponse.json(
                        { error: "Video not found on YouTube" },
                        { status: 404 }
                    )
                }

                const item = detailsData.items[0]
                const isoDuration = item.contentDetails?.duration || ""
                const durationSec = parseIsoDuration(isoDuration)

                // If duration is 0, the video may still be processing
                if (durationSec === 0 && attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                    continue
                }

                return NextResponse.json({
                    success: true,
                    videoId,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    durationSec,
                    title: item.snippet?.title || "",
                    description: item.snippet?.description || "",
                    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || "",
                })
            } catch (err) {
                console.error(`Duration fetch attempt ${attempt + 1} failed:`, err)
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                }
            }
        }

        return NextResponse.json(
            { error: "Failed to fetch video duration after retries" },
            { status: 500 }
        )
    } catch (err) {
        console.error("Duration fetch error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

function extractVideoId(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) return ""

    // Direct video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed
    }

    try {
        const url = new URL(trimmed)
        const host = url.hostname.replace(/^www\./, "")

        if (host === "youtu.be") {
            return url.pathname.split("/").filter(Boolean)[0] || ""
        }

        if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
            const searchId = url.searchParams.get("v")
            if (searchId) return searchId

            const segments = url.pathname.split("/").filter(Boolean)
            const knownPrefixes = ["embed", "shorts", "live"]
            if (segments.length >= 2 && knownPrefixes.includes(segments[0])) {
                return segments[1] || ""
            }
        }
    } catch {
        return ""
    }

    return ""
}

function parseIsoDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || "0", 10)
    const minutes = parseInt(match[2] || "0", 10)
    const seconds = parseInt(match[3] || "0", 10)

    return hours * 3600 + minutes * 60 + seconds
}
