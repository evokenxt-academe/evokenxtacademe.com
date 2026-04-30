import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { CreateQuestionPayload } from "@/features/admin/quiz-builder/types"

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const body = (await request.json()) as { questions?: CreateQuestionPayload[]; quizId?: string }
    const questions = Array.isArray(body.questions) ? body.questions : []
    const quizId = body.quizId

    if (questions.length === 0) {
        return NextResponse.json({ error: "questions are required" }, { status: 400 })
    }

    if (!quizId) {
        return NextResponse.json({ error: "quizId is required" }, { status: 400 })
    }

    // Get current max position
    const { data: maxRow } = await supabase
        .from("questions")
        .select("position")
        .eq("quiz_id", quizId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

    let nextPosition = (maxRow?.position ?? -1) + 1

    const createdQuestions: Array<Record<string, unknown>> = []

    for (const [index, payload] of questions.entries()) {
        if (!payload?.question?.trim()) {
            return NextResponse.json(
                { error: `Question ${index + 1} is missing question text` },
                { status: 400 }
            )
        }

        const { data: questionRow, error: questionError } = await supabase
            .from("questions")
            .insert({
                quiz_id: quizId,
                question: payload.question.trim(),
                source: payload.explanation ?? null,
                marks: payload.marks ?? 1,
                position: nextPosition++,
            })
            .select()
            .single()

        if (questionError || !questionRow) {
            return NextResponse.json(
                { error: questionError?.message || `Failed to create question ${index + 1}` },
                { status: 500 }
            )
        }

        let optionRows: Array<Record<string, unknown>> = []
        if (payload.options?.length) {
            const { data: insertedOptions, error: optionError } = await supabase
                .from("options")
                .insert(
                    payload.options.map((option) => ({
                        question_id: questionRow.id,
                        text: option.text,
                        is_correct: option.isCorrect ?? false,
                    }))
                )
                .select()

            if (optionError) {
                return NextResponse.json(
                    { error: optionError.message || `Failed to create options for question ${index + 1}` },
                    { status: 500 }
                )
            }

            optionRows = insertedOptions ?? []
        }

        createdQuestions.push({
            id: questionRow.id,
            question: questionRow.question,
            imageUrl: null,
            type: "mcq",
            explanation: questionRow.source,
            explanationImageUrl: null,
            difficulty: "medium",
            tags: [],
            marks: questionRow.marks,
            createdBy: null,
            createdAt: questionRow.id,
            updatedAt: questionRow.id,
            options: optionRows.map((opt, idx) => ({
                id: opt.id,
                questionId: questionRow.id,
                text: opt.text,
                isCorrect: opt.is_correct,
                position: idx,
            })),
        })
    }

    // Recalculate total marks
    const { data: allQ } = await supabase
        .from("questions")
        .select("marks")
        .eq("quiz_id", quizId)

    const totalMarks = (allQ ?? []).reduce((sum, q) => sum + (q.marks ?? 1), 0)
    await supabase.from("quizzes").update({ total_marks: totalMarks }).eq("id", quizId)

    return NextResponse.json({ questions: createdQuestions, created: createdQuestions.length })
}
