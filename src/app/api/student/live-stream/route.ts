import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import type { LiveChatMessage, LiveStreamSummary } from "@/features/live-stream/types"

export const runtime = "nodejs"

/**
 * GET /api/student/live-stream?courseId=xxx
 *
 * Returns the live stream for a course, or the most recent ended stream
 * if no live broadcast is active, along with its chat messages.
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseParam = request.nextUrl.searchParams.get("courseId")
    if (!courseParam) {
        return NextResponse.json(
            { error: "courseId is required" },
            { status: 400 }
        )
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const courseResult = uuidPattern.test(courseParam)
        ? await supabase.from("courses").select("id, title, slug").eq("id", courseParam).maybeSingle()
        : await supabase.from("courses").select("id, title, slug").eq("slug", courseParam).maybeSingle()

    const course = courseResult.data

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const courseId = course.id

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle()

    if (!enrollment) {
        return NextResponse.json(
            { error: "You are not enrolled in this course." },
            { status: 403 }
        )
    }

    const [liveStreamResult, endedStreamResult] = await Promise.all([
        supabase
            .from("live_streams")
            .select("id, title, course_id, yt_video_id, status, started_at, ended_at")
            .eq("course_id", courseId)
            .eq("status", "live")
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from("live_streams")
            .select("id, title, course_id, yt_video_id, status, started_at, ended_at")
            .eq("course_id", courseId)
            .eq("status", "ended")
            .order("ended_at", { ascending: false })
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
    ])

    const stream = liveStreamResult.data ?? endedStreamResult.data ?? null

    if (!stream) {
        return NextResponse.json({ currentStream: null, messages: [] })
    }

    // Get chat messages for this stream
    const { data: messages } = await supabase
        .from("chat_messages")
        .select(`
            id,
            live_stream_id,
            message,
            created_at,
            user_id,
            users:user_id ( name, avatar )
        `)
        .eq("live_stream_id", stream.id)
        .order("created_at", { ascending: true })
        .limit(200)

    const currentStream: LiveStreamSummary = {
        id: stream.id,
        title: stream.title,
        courseId: stream.course_id,
        courseName: course.name,
        ytVideoId: stream.yt_video_id,
        status: stream.status === "live" ? "live" : "ended",
        startedAt: stream.started_at,
        endedAt: stream.ended_at,
    }

    return NextResponse.json({
        currentStream,
        messages: (messages ?? []).map((msg: Record<string, unknown>) => ({
            id: String(msg.id ?? ""),
            liveStreamId: String(msg.live_stream_id ?? stream.id),
            message: String(msg.message ?? ""),
            createdAt: String(msg.created_at ?? ""),
            userId: String(msg.user_id ?? ""),
            userName: (msg.users as Record<string, unknown> | null)?.name ?? "Anonymous",
            userAvatar: (msg.users as Record<string, unknown> | null)?.avatar ?? null,
        })) as LiveChatMessage[],
    })
}

/**
 * POST /api/student/live-stream
 *
 * Send a chat message to a live stream.
 * Body: { streamId, message }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { streamId, message } = body

    if (!streamId || !message?.trim()) {
        return NextResponse.json(
            { error: "Stream ID and message are required." },
            { status: 400 }
        )
    }

    // Verify the stream exists and is live
    const { data: stream } = await supabase
        .from("live_streams")
        .select("id, course_id, status")
        .eq("id", streamId)
        .maybeSingle()

    if (!stream || stream.status !== "live") {
        return NextResponse.json(
            { error: "Stream is not currently live." },
            { status: 400 }
        )
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", stream.course_id)
        .eq("status", "active")
        .maybeSingle()

    if (!enrollment) {
        return NextResponse.json(
            { error: "You are not enrolled in this course." },
            { status: 403 }
        )
    }

    const { data: chatMsg, error: insertError } = await supabase
        .from("chat_messages")
        .insert({
            live_stream_id: streamId,
            user_id: user.id,
            message: message.trim(),
        })
        .select("id, message, created_at")
        .single()

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
        )
    }

    // Get user profile for response
    const { data: profile } = await supabase
        .from("users")
        .select("name, avatar")
        .eq("id", user.id)
        .maybeSingle()

    return NextResponse.json({
        success: true,
        chatMessage: {
            id: chatMsg.id,
            liveStreamId: streamId,
            message: chatMsg.message,
            createdAt: chatMsg.created_at,
            userId: user.id,
            userName: profile?.name ?? "Anonymous",
            userAvatar: profile?.avatar ?? null,
        },
    })
}
