import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ quizId: string }> }

// ── GET: Fetch quiz questions with hydrated question data ─────

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId } = await params
    const { supabase } = auth

    const { data, error } = await supabase
        .from("quiz_questions")
        .select(`
            id, quiz_id, question_id, position, marks_override,
            question_bank(
                id, question, type, explanation, difficulty, tags, marks, created_by, created_at, updated_at,
                question_bank_options(id, question_id, text, is_correct, position)
            )
        `)
        .eq("quiz_id", quizId)
        .order("position", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => {
        const q = row.question_bank as unknown as Record<string, unknown> | null
        const opts = (q?.question_bank_options as Array<Record<string, unknown>> | undefined) ?? []

        return {
            id: row.id,
            quizId: row.quiz_id,
            questionId: row.question_id,
            position: row.position,
            marksOverride: row.marks_override,
            question: q
                ? {
                    id: q.id as string,
                    question: q.question as string,
                    type: q.type as string,
                    explanation: q.explanation as string | null,
                    difficulty: q.difficulty as string,
                    tags: (q.tags as string[]) ?? [],
                    marks: q.marks as number,
                    createdBy: q.created_by as string | null,
                    createdAt: q.created_at as string,
                    updatedAt: q.updated_at as string,
                    options: opts
                        .sort((a, b) => (a.position as number) - (b.position as number))
                        .map((opt) => ({
                            id: opt.id as string,
                            questionId: opt.question_id as string,
                            text: opt.text as string,
                            isCorrect: opt.is_correct as boolean,
                            position: opt.position as number,
                        })),
                }
                : null,
        }
    })

    return NextResponse.json({ questions })
}

// ── POST: Bulk add questions to quiz ──────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId } = await params
    const { supabase } = auth
    const body = await request.json()

    const { questionIds } = body as { questionIds: string[] }

    if (!questionIds?.length) {
        return NextResponse.json({ error: "questionIds is required" }, { status: 400 })
    }

    // Get current max position
    const { data: maxRow } = await supabase
        .from("quiz_questions")
        .select("position")
        .eq("quiz_id", quizId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

    let nextPosition = (maxRow?.position ?? -1) + 1

    // Get existing question IDs to avoid duplicates
    const { data: existingRows } = await supabase
        .from("quiz_questions")
        .select("question_id")
        .eq("quiz_id", quizId)

    const existingSet = new Set(
        (existingRows ?? []).map((r) => r.question_id)
    )

    const newEntries = questionIds
        .filter((qid) => !existingSet.has(qid))
        .map((qid) => ({
            quiz_id: quizId,
            question_id: qid,
            position: nextPosition++,
        }))

    if (newEntries.length === 0) {
        return NextResponse.json({ added: 0 })
    }

    const { error } = await supabase
        .from("quiz_questions")
        .insert(newEntries)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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

    return NextResponse.json({ added: newEntries.length })
}
