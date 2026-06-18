import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/features/admin/lib/admin-route"
import { resolveChatAuthorName } from "@/features/live-stream/lib"
import type { LiveChatMessage, LiveStreamSummary } from "@/features/live-stream/types"

export const runtime = "nodejs"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ streamId: string }> }
) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { streamId } = await params
    const { supabase } = auth

    const { data: stream, error: streamError } = await supabase
        .from("live_streams")
        .select("id, title, course_id, yt_video_id, status, started_at, ended_at, courses(name:title)")
        .eq("id", streamId)
        .maybeSingle()

    if (streamError || !stream) {
        return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    const { data: messages } = await supabase
        .from("chat_messages")
        .select(`
            id,
            live_stream_id,
            message,
            created_at,
            user_id,
            author_name,
            author_avatar,
            users:user_id ( name, avatar )
        `)
        .eq("live_stream_id", stream.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(500)

    const courseName = Array.isArray(stream.courses)
        ? stream.courses[0]?.name
        : (stream.courses as any)?.name ?? "Unknown Course"

    const currentStream: LiveStreamSummary = {
        id: stream.id,
        title: stream.title,
        courseId: stream.course_id,
        courseName,
        ytVideoId: stream.yt_video_id,
        status: stream.status === "live" ? "live" : "ended",
        startedAt: stream.started_at,
        endedAt: stream.ended_at,
    }

    return NextResponse.json({
        currentStream,
        messages: (messages ?? []).map((msg: Record<string, unknown>) => {
            const users = msg.users as Record<string, unknown> | null
            const userId = msg.user_id ? String(msg.user_id) : null

            return {
                id: String(msg.id ?? ""),
                liveStreamId: String(msg.live_stream_id ?? stream.id),
                message: String(msg.message ?? ""),
                createdAt: String(msg.created_at ?? ""),
                userId,
                userName: resolveChatAuthorName({
                    authorName: msg.author_name as string | null,
                    profileName: users?.name as string | null,
                }),
                userAvatar:
                    (msg.author_avatar as string | null) ??
                    (users?.avatar as string | null) ??
                    null,
            }
        }) as LiveChatMessage[],
    })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ streamId: string }> }
) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { streamId } = await params
    const { supabase, userId } = auth

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
        return NextResponse.json(
            { error: "Message is required." },
            { status: 400 }
        )
    }

    const { data: stream } = await supabase
        .from("live_streams")
        .select("id, status")
        .eq("id", streamId)
        .maybeSingle()

    if (!stream || stream.status !== "live") {
        return NextResponse.json(
            { error: "Stream is not currently live." },
            { status: 400 }
        )
    }

    const { data: profile } = await supabase
        .from("users")
        .select("name, avatar, email")
        .eq("id", userId)
        .maybeSingle()

    const authorName = resolveChatAuthorName({
        authorName: null,
        profileName: profile?.name,
        userEmail: profile?.email,
    })

    const { data: chatMsg, error: insertError } = await supabase
        .from("chat_messages")
        .insert({
            live_stream_id: streamId,
            user_id: userId,
            message: message.trim(),
            author_name: authorName,
            author_avatar: profile?.avatar ?? null,
            is_approved: true,
            is_deleted: false,
        })
        .select("id, message, created_at")
        .single()

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        chatMessage: {
            id: chatMsg.id,
            liveStreamId: streamId,
            message: chatMsg.message,
            createdAt: chatMsg.created_at,
            userId,
            userName: authorName,
            userAvatar: profile?.avatar ?? null,
        },
    })
}
