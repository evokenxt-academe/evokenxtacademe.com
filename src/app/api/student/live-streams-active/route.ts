import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { LiveStreamSummary } from "@/features/live-stream/types";

/**
 * GET /api/student/live-streams-active
 *
 * Fetches all currently live streams that the user is enrolled in.
 * Returns streams with status='live' only.
 */
export async function GET() {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all currently live streams
    const { data: liveStreams, error: streamsError } = await (supabase as any)
        .from("live_streams")
        .select(
            `
      id,
      title,
      course_id,
      yt_video_id,
      status,
      started_at,
      ended_at,
      courses:course_id(name)
    `
        )
        .eq("status", "live")
        .order("started_at", { ascending: false });

    if (streamsError) {
        console.error("Error fetching live streams:", streamsError);
        return NextResponse.json(
            { error: "Failed to fetch live streams" },
            { status: 500 }
        );
    }

    if (!liveStreams || liveStreams.length === 0) {
        return NextResponse.json({ streams: [] });
    }

    // Filter for enrolled courses only
    const courseIds = (liveStreams as any[]).map((s) => s.course_id);

    const { data: enrollments } = await (supabase as any)
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("course_id", courseIds);

    const enrolledCourseIds = new Set(
        (enrollments ?? []).map((e: any) => e.course_id)
    );

    // Map to LiveStreamSummary format
    const streams: LiveStreamSummary[] = (liveStreams as any[])
        .filter((stream) => enrolledCourseIds.has(stream.course_id))
        .map((stream) => ({
            id: stream.id,
            title: stream.title,
            courseId: stream.course_id,
            courseName: stream.courses?.name ?? "Unknown Course",
            ytVideoId: stream.yt_video_id,
            status: "live" as const,
            startedAt: stream.started_at,
            endedAt: stream.ended_at,
        }));

    return NextResponse.json({ streams });
}
