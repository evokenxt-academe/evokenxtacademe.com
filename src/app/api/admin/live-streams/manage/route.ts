import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"

import { extractYoutubeVideoId } from "@/features/live-stream/lib"
import { requireAdmin } from "@/features/admin/lib/admin-route"
import {
    notifyLiveStream,
    resolveLiveStreamContext,
} from "@/lib/notifications/server"
import { cleanupStreamEngagement } from "@/lib/live-stream/cleanup-engagement"

export const runtime = "nodejs"

/**
 * POST /api/admin/live-streams/manage
 *
 * Create, start, end, update, or delete a live stream.
 * Body: { action: "create" | "start" | "end" | "update-status" | "delete", ...payload }
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase, userId } = auth

    try {
        const body = await request.json()
        const { action } = body

        if (action === "create") {
            const { title, courseId, ytVideoId, videoSource, enableEmbed } = body

            if (!title || !courseId) {
                return NextResponse.json(
                    { error: "Title and course are required." },
                    { status: 400 }
                )
            }

            const resolvedVideoId =
                typeof ytVideoId === "string" && ytVideoId.trim()
                    ? extractYoutubeVideoId(ytVideoId) || ytVideoId.trim()
                    : typeof videoSource === "string"
                        ? extractYoutubeVideoId(videoSource)
                        : ""

            const { data, error } = await supabase
                .from("live_streams")
                .insert({
                    title,
                    course_id: courseId,
                    instructor_id: userId,
                    yt_video_id: resolvedVideoId || null,
                    status: "live",
                    started_at: new Date().toISOString(),
                    ended_at: null,
                    enable_embed: enableEmbed !== false,
                })
                .select("id")
                .single()

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            after(async () => {
                const stream = await resolveLiveStreamContext(data.id)
                if (!stream) return
                await notifyLiveStream({
                    streamId: stream.id,
                    title: stream.title,
                    ytVideoId: stream.yt_video_id,
                })
            })

            return NextResponse.json({ success: true, streamId: data.id })
        }

        if (action === "start" || action === "update-status") {
            const { streamId, ytVideoId } = body

            if (!streamId) {
                return NextResponse.json(
                    { error: "Stream ID is required." },
                    { status: 400 }
                )
            }

            const updateData: Record<string, unknown> = {
                status: "live",
                started_at: new Date().toISOString(),
            }

            if (typeof ytVideoId === "string" && ytVideoId.trim()) {
                updateData.yt_video_id =
                    extractYoutubeVideoId(ytVideoId) || ytVideoId.trim()
            }

            const { error } = await supabase
                .from("live_streams")
                .update(updateData)
                .eq("id", streamId)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            after(async () => {
                const stream = await resolveLiveStreamContext(streamId)
                if (!stream) return
                await notifyLiveStream({
                    streamId: stream.id,
                    title: stream.title,
                    ytVideoId:
                        (typeof ytVideoId === "string" && ytVideoId.trim()
                            ? ytVideoId.trim()
                            : stream.yt_video_id) ?? null,
                })
            })

            return NextResponse.json({ success: true })
        }

        if (action === "end") {
            const { streamId } = body

            if (!streamId) {
                return NextResponse.json(
                    { error: "Stream ID is required." },
                    { status: 400 }
                )
            }

            const { error } = await supabase
                .from("live_streams")
                .update({
                    status: "ended",
                    ended_at: new Date().toISOString(),
                })
                .eq("id", streamId)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            after(async () => {
                try {
                    await cleanupStreamEngagement(streamId)
                } catch (cleanupError) {
                    console.error("Stream engagement cleanup failed:", cleanupError)
                }
            })

            return NextResponse.json({ success: true })
        }

        if (action === "delete") {
            const { streamId } = body

            if (!streamId) {
                return NextResponse.json(
                    { error: "Stream ID is required." },
                    { status: 400 }
                )
            }

            // Delete associated chat messages first
            await supabase
                .from("chat_messages")
                .delete()
                .eq("live_stream_id", streamId)

            const { error } = await supabase
                .from("live_streams")
                .delete()
                .eq("id", streamId)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid action." }, { status: 400 })
    } catch (err) {
        console.error("Live stream manage error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
