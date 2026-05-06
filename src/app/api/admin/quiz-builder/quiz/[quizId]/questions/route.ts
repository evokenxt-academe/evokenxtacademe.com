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
        .select("id, quiz_id, question_id, position, marks_override")
        .eq("quiz_id", quizId)
        .order("position", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questionIds = (data ?? []).map((row) => row.question_id)
    const { data: bankRows, error: bankError } = await supabase
        .from("question_bank")
        .select("*, question_bank_options(*)")
        .in("id", questionIds)

    if (bankError) {
        return NextResponse.json({ error: bankError.message }, { status: 500 })
    }

    const bankMap = new Map((bankRows ?? []).map((row) => [row.id, row]))

    const questions = (data ?? []).flatMap((row) => {
        const bank = bankMap.get(row.question_id)
        if (!bank) return []

        const opts = ((bank as Record<string, unknown>).question_bank_options as Array<Record<string, unknown>> | undefined) ?? []

        return [{
            id: row.id,
            quizId: row.quiz_id,
            questionId: row.question_id,
            position: row.position,
            marksOverride: row.marks_override,
            question: {
                id: bank.id,
                question: bank.question,
                type: bank.type,
                explanation: bank.explanation,
                difficulty: bank.difficulty,
                tags: bank.tags ?? [],
                marks: bank.marks,
                createdBy: bank.created_by,
                createdAt: bank.created_at,
                updatedAt: bank.updated_at,
                options: opts
                    .sort((a, b) => (a.position as number) - (b.position as number))
                    .map((opt) => ({
                        id: opt.id as string,
                        questionId: bank.id,
                        text: opt.text as string,
                        isCorrect: opt.is_correct as boolean,
                        position: opt.position as number,
                    })),
            },
        }]
    })

    return NextResponse.json({ questions })
}

// ── POST: Bulk add questions to quiz (duplicate from bank) ────

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

    const existingQuestionRows = await supabase
        .from("quiz_questions")
        .select("question_id")
        .eq("quiz_id", quizId)
        .in("question_id", questionIds)

    if (existingQuestionRows.error) {
        return NextResponse.json({ error: existingQuestionRows.error.message }, { status: 500 })
    }

    const existingSet = new Set((existingQuestionRows.data ?? []).map((row) => row.question_id))
    const toInsert = questionIds.filter((id) => !existingSet.has(id))
    if (toInsert.length === 0) {
        return NextResponse.json({ added: 0 })
    }

    const { error: insertError } = await supabase
        .from("quiz_questions")
        .insert(
            toInsert.map((questionId) => ({
                quiz_id: quizId,
                question_id: questionId,
                position: nextPosition++,
            }))
        )

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { data: allQ, error: marksError } = await supabase
        .from("quiz_questions")
        .select("question_bank(marks)")
        .eq("quiz_id", quizId)
    if (marksError) {
        return NextResponse.json({ error: marksError.message }, { status: 500 })
    }
    const totalMarks = (allQ ?? []).reduce((sum, row) => {
        const marks = (row.question_bank as { marks?: number } | null)?.marks ?? 1
        return sum + marks
    }, 0)

    await supabase
        .from("quizzes")
        .update({ total_marks: totalMarks })
        .eq("id", quizId)

    return NextResponse.json({ added: toInsert.length })
}
