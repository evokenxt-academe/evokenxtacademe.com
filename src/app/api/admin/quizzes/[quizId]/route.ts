import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { notifyNewQuiz, resolveQuizCourseContext } from "@/lib/notifications/server";

type RouteParams = { params: Promise<{ quizId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) return auth.error;

    const { quizId } = await params;
    const { supabase } = auth;
    const body = await request.json();

    // 1. Get current quiz state to check if is_published status changes
    const { data: currentQuiz } = await supabase
        .from("quizzes")
        .select("is_published")
        .eq("id", quizId)
        .maybeSingle();

    // 2. Perform the update
    const { data: updatedQuiz, error } = await supabase
        .from("quizzes")
        .update(body)
        .eq("id", quizId)
        .select()
        .single();

    if (error || !updatedQuiz) {
        return NextResponse.json({ error: error?.message || "Quiz not found" }, { status: 500 });
    }

    // 3. Trigger notification if is_published transitions from false to true
    const wasPublished = currentQuiz?.is_published;
    const isPublishedNow = updatedQuiz?.is_published;

    if (isPublishedNow && !wasPublished) {
        after(async () => {
            const ctx = await resolveQuizCourseContext(quizId);
            if (!ctx?.quiz) return;
            await notifyNewQuiz({
                quizId,
                title: ctx.quiz.title,
                courseName: ctx.course?.name,
            });
        });
    }

    return NextResponse.json({ success: true, quiz: updatedQuiz });
}
