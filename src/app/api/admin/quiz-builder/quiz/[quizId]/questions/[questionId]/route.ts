import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ quizId: string; questionId: string }> }

// ── DELETE: Remove a question from quiz ───────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId, questionId } = await params
    const { supabase } = auth

    const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId)
        .eq("quiz_id", quizId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Re-normalize positions
    const { data: remaining } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("quiz_id", quizId)
        .order("position", { ascending: true })

    if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
            await supabase
                .from("quiz_questions")
                .update({ position: i })
                .eq("id", remaining[i].id)
        }
    }

    // Recalculate total marks
    const { data: allQQ } = await supabase
        .from("quiz_questions")
        .select("marks_override, question_bank(marks)")
        .eq("quiz_id", quizId)

    const totalMarks = (allQQ ?? []).reduce((sum, qq) => {
        const qb = qq.question_bank as unknown as { marks: number } | null
        const marks = qq.marks_override ?? qb?.marks ?? 1
        return sum + marks
    }, 0)

    await supabase
        .from("quizzes")
        .update({ total_marks: totalMarks })
        .eq("id", quizId)

    return NextResponse.json({ success: true })
}
