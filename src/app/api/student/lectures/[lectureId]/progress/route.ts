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
    };

    const watchedSeconds = toSafeNumber(body.watchedSeconds);
    const requestedCompletion = body.isCompleted === true;

    const { data: lectureData, error: lectureError } = await supabase
        .from("lectures")
        .select("id, is_preview, section_id")
        .eq("id", lectureId)
        .maybeSingle();

    if (lectureError || !lectureData) {
        return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const { data: sectionData, error: sectionError } = await supabase
        .from("sections")
        .select("course_id")
        .eq("id", lectureData.section_id)
        .maybeSingle();

    if (sectionError || !sectionData?.course_id) {
        return NextResponse.json({ error: "Lecture section not found" }, { status: 404 });
    }

    const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", sectionData.course_id)
        .eq("status", "active")
        .maybeSingle();

    if (!enrollmentData && !lectureData.is_preview) {
        return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
    }

    const { data: existingProgressData, error: existingProgressError } = await supabase
        .from("lecture_progress")
        .select("watched_seconds, is_completed")
        .eq("user_id", user.id)
        .eq("lecture_id", lectureId)
        .maybeSingle();

    if (existingProgressError) {
        return NextResponse.json(
            { error: existingProgressError.message },
            { status: 500 },
        );
    }

    const previousWatched = toSafeNumber(existingProgressData?.watched_seconds);
    const previousCompleted = existingProgressData?.is_completed === true;

    const payload = {
        user_id: user.id,
        lecture_id: lectureId,
        watched_seconds: Math.max(previousWatched, watchedSeconds),
        is_completed: requestedCompletion || previousCompleted,
        last_watched_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("lecture_progress")
        .upsert(payload, { onConflict: "user_id,lecture_id" })
        .select("lecture_id, watched_seconds, is_completed, last_watched_at")
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        data,
        message: "Progress updated",
    });
}
