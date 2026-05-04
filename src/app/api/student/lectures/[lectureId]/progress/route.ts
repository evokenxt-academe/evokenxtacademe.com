import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { 
    updateLectureProgress, 
    updateDailyWatchHours,
    getLectureProgress 
} from "@/lib/supabase/queries";

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

export async function GET(
    request: Request,
    context: { params: Promise<{ lectureId: string }> },
) {
    const { lectureId } = await context.params;
    if (!lectureId) {
        return NextResponse.json({ error: "Invalid lecture id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getLectureProgress(supabase, user.id, lectureId);

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ progress: data });
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
        watchedSeconds?: number;
        resumeAtSeconds?: number;
        isCompleted?: boolean;
    };

    const watchedSeconds = toSafeNumber(body.watchedSeconds);
    const resumeAtSeconds = toSafeNumber(body.resumeAtSeconds);
    const requestedCompletion = body.isCompleted === true;

    // Verify lecture exists and get chapter info (for course_id)
    const { data: lectureData, error: lectureError } = await supabase
        .from("lectures")
        .select("id, is_preview, chapter_id, chapter:chapters!chapter_id(course_id)")
        .eq("id", lectureId)
        .maybeSingle();

    if (lectureError || !lectureData) {
        return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const courseId = (lectureData.chapter as { course_id: string })?.course_id;
    if (!courseId) {
        return NextResponse.json({ error: "Lecture chapter not found" }, { status: 404 });
    }

    // Check enrollment (unless preview lecture)
    if (!lectureData.is_preview) {
        const { data: enrollmentData } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .eq("status", "active")
            .maybeSingle();

        if (!enrollmentData) {
            return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
        }
    }

    // Update lecture progress using the query layer
    const { data, error } = await updateLectureProgress(supabase, user.id, lectureId, {
        watched_seconds: watchedSeconds,
        resume_at_seconds: resumeAtSeconds,
        is_completed: requestedCompletion,
    });

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    // Update daily watch hours aggregation
    if (watchedSeconds > 0) {
        await updateDailyWatchHours(supabase, user.id, courseId, watchedSeconds);
    }

    return NextResponse.json({
        data,
        message: "Progress updated",
    });
}
