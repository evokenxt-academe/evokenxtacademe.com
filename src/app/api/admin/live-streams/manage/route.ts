import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"

export const runtime = "nodejs"

/**
 * POST /api/admin/live-streams/manage
 *
 * Create, update status, or delete a live stream.
 * Body: { action: "create" | "update-status" | "delete", ...payload }
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth

    try {
        const body = await request.json()
        const { action } = body

        if (action === "create") {
            const { title, courseId, ytVideoId, scheduledAt } = body

            if (!title || !courseId) {
                return NextResponse.json(
                    { error: "Title and course are required." },
                    { status: 400 }
                )
            }

            const { data, error } = await supabase
                .from("live_streams")
                .insert({
                    title,
                    course_id: courseId,
                    yt_video_id: ytVideoId || null,
                    status: "scheduled",
                    scheduled_at: scheduledAt || new Date().toISOString(),
                })
                .select("id")
                .single()

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, streamId: data.id })
        }

        if (action === "update-status") {
            const { streamId, status, ytVideoId } = body

            if (!streamId || !status) {
                return NextResponse.json(
                    { error: "Stream ID and status are required." },
                    { status: 400 }
                )
            }

            const updateData: Record<string, unknown> = { status }

            if (status === "live") {
                updateData.started_at = new Date().toISOString()
            }
            if (status === "ended") {
                updateData.ended_at = new Date().toISOString()
            }
            if (ytVideoId !== undefined) {
                updateData.yt_video_id = ytVideoId
            }

            const { error } = await supabase
                .from("live_streams")
                .update(updateData)
                .eq("id", streamId)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

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
