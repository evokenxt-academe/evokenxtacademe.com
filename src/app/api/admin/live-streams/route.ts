import { NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { LiveStreamAdminItem } from "@/features/live-stream/types"

export async function GET() {
    const auth = await requireAdmin()
    if ("error" in auth) {
        return auth.error
    }

    const { supabase } = auth

    const [streamsResult, coursesResult] = await Promise.all([
        supabase
            .from("live_streams")
            .select("id, title, course_id, yt_video_id, status, started_at, ended_at")
            .order("started_at", { ascending: false }),
        supabase.from("courses").select("id, name, slug").order("created_at", { ascending: false }),
    ]);

    const errors = [streamsResult.error, coursesResult.error].filter(Boolean)
    if (errors.length) {
        const message = (errors[0] as { message?: string }).message || "Failed to load streams"
        return NextResponse.json({ error: message }, { status: 500 })
    }

    const courseMap = new Map(
        (coursesResult.data ?? []).map((course) => [course.id, course]),
    )

    const liveStreams: LiveStreamAdminItem[] = (streamsResult.data ?? [])
        .map((stream) => {
            const course = courseMap.get(stream.course_id)

            return {
                id: stream.id,
                title: stream.title,
                courseId: stream.course_id,
                courseName: course?.name ?? "Unknown course",
                courseSlug: course?.slug ?? null,
                ytVideoId: stream.yt_video_id,
                status: stream.status === "live" ? "live" : "ended",
                startedAt: stream.started_at,
                endedAt: stream.ended_at,
            }
        })
        .sort((left, right) => {
            if (left.status !== right.status) {
                return left.status === "live" ? -1 : 1
            }

            const leftTime = new Date(left.startedAt ?? left.endedAt ?? 0).getTime()
            const rightTime = new Date(right.startedAt ?? right.endedAt ?? 0).getTime()
            return rightTime - leftTime
        })

    return NextResponse.json({ liveStreams })
}