import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

function toSafeNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.round(value));
    }

    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.round(parsed));
        }
    }

    return 0;
}

export async function POST(
    request: Request,
    context: { params: Promise<{ lectureId: string }> },
) {
    const { lectureId } = await context.params;
    if (!lectureId) {
        return NextResponse.json({ error: "Invalid lecture id" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
        watchedSeconds?: number;
        isCompleted?: boolean;
        resumeAtSeconds?: number;
    };

    const watchedSeconds = toSafeNumber(body.watchedSeconds);
    const resumeAtSeconds = toSafeNumber(body.resumeAtSeconds ?? body.watchedSeconds);
    const requestedCompletion = body.isCompleted === true;

    const { data: lectureData, error: lectureError } = await supabase
        .from("lectures")
        .select("id, is_preview, chapter_id, duration_sec")
        .eq("id", lectureId)
        .maybeSingle();

    if (lectureError || !lectureData) {
        return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const lecture = lectureData as {
        chapter_id: string;
        is_preview: boolean;
        duration_sec: number;
    };

    const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("course_id")
        .eq("id", lecture.chapter_id)
        .maybeSingle();

    const chapter = chapterData as { course_id?: string } | null;
    if (chapterError || !chapter?.course_id) {
        return NextResponse.json({ error: "Lecture chapter not found" }, { status: 404 });
    }

    const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", chapter.course_id)
        .eq("status", "active")
        .maybeSingle();

    if (!enrollmentData && !lecture.is_preview) {
        return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
    }

    const { data: existingProgressData, error: existingProgressError } = await supabase
        .from("lecture_progress")
        .select("watched_seconds, is_completed, watch_sessions")
        .eq("user_id", user.id)
        .eq("lecture_id", lectureId)
        .maybeSingle();

    if (existingProgressError) {
        return NextResponse.json(
            { error: existingProgressError.message },
            { status: 500 },
        );
    }

    const existingProgress = existingProgressData as {
        watched_seconds?: number | null;
        is_completed?: boolean | null;
        watch_sessions?: number | null;
    } | null;

    const previousWatched = toSafeNumber(existingProgress?.watched_seconds);
    const previousCompleted = existingProgress?.is_completed === true;
    const deltaSeconds = Math.max(0, watchedSeconds - previousWatched);

    const shouldMarkCompleted =
        requestedCompletion ||
        previousCompleted ||
        (lecture.duration_sec > 0 && watchedSeconds >= Math.floor(0.9 * lecture.duration_sec));

    const payload = {
        user_id: user.id,
        lecture_id: lectureId,
        watched_seconds: Math.max(previousWatched, watchedSeconds),
        resume_at_seconds: resumeAtSeconds,
        is_completed: shouldMarkCompleted,
        last_watched_at: new Date().toISOString(),
        completed_at: shouldMarkCompleted ? new Date().toISOString() : null,
    };

    const { createAdminClient } = await import("@/utils/supabase/adminClient");
    const adminSupabase = createAdminClient();

    const currentSessions = toSafeNumber(existingProgress?.watch_sessions);
    const watchSessions = currentSessions + 1;

    const { data, error } = await adminSupabase
        .from("lecture_progress")
        .upsert(
            { ...payload, watch_sessions: watchSessions },
            { onConflict: "user_id,lecture_id" },
        )
        .select("lecture_id, watched_seconds, resume_at_seconds, is_completed, last_watched_at")
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Upsert daily watch hours (incremental)
    if (deltaSeconds > 0) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const watchDate = `${yyyy}-${mm}-${dd}`;

        const { data: existingDaily } = await adminSupabase
            .from("watch_hours_daily")
            .select("seconds")
            .eq("user_id", user.id)
            .eq("course_id", chapter.course_id)
            .eq("watch_date", watchDate)
            .maybeSingle();

        const previous = toSafeNumber(existingDaily?.seconds);
        const nextSeconds = previous + deltaSeconds;

        await adminSupabase
            .from("watch_hours_daily")
            .upsert(
                {
                    user_id: user.id,
                    course_id: chapter.course_id,
                    watch_date: watchDate,
                    seconds: nextSeconds,
                },
                { onConflict: "user_id,course_id,watch_date" },
            );
    }

    return NextResponse.json({
        data,
        message: "Progress updated",
    });
}
