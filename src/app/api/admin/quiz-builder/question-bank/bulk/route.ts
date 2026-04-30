import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { CreateQuestionPayload, QuestionBankItem } from "@/features/admin/quiz-builder/types"

function toQuestionItem(
    row: Record<string, unknown>,
    optionRows: Array<Record<string, unknown>>
): QuestionBankItem {
    return {
        id: row.id as string,
        question: row.question as string,
        type: row.type as QuestionBankItem["type"],
        explanation: (row.explanation as string | null) ?? undefined,
        difficulty: row.difficulty as QuestionBankItem["difficulty"],
        tags: (row.tags as string[]) ?? [],
        marks: row.marks as number,
        createdBy: row.created_by as string | null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        options: optionRows
            .sort((a, b) => (a.position as number) - (b.position as number))
            .map((opt) => ({
                id: opt.id as string,
                text: opt.text as string,
                isCorrect: opt.is_correct as boolean,
                position: opt.position as number,
            })),
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase, userId } = auth
    const body = (await request.json()) as { questions?: CreateQuestionPayload[] }
    const questions = Array.isArray(body.questions) ? body.questions : []

    if (questions.length === 0) {
        return NextResponse.json({ error: "questions are required" }, { status: 400 })
    }

    const createdQuestions: QuestionBankItem[] = []

    for (const [index, payload] of questions.entries()) {
        if (!payload?.question?.trim()) {
            return NextResponse.json(
                { error: `Question ${index + 1} is missing question text` },
                { status: 400 }
            )
        }

        const { data: questionRow, error: questionError } = await supabase
            .from("question_bank")
            .insert({
                question: payload.question.trim(),
                type: payload.type,
                explanation: payload.explanation ?? null,
                difficulty: payload.difficulty,
                tags: payload.tags ?? [],
                marks: payload.marks ?? 1,
                created_by: userId,
            })
            .select()
            .single()

        if (questionError || !questionRow) {
            return NextResponse.json(
                {
                    error: questionError?.message || `Failed to create question ${index + 1}`,
                },
                { status: 500 }
            )
        }

        let optionRows: Array<Record<string, unknown>> = []
        if (payload.options?.length) {
            const { data: insertedOptions, error: optionError } = await supabase
                .from("question_bank_options")
                .insert(
                    payload.options.map((option, optionIndex) => ({
                        question_id: questionRow.id,
                        text: option.text,
                        is_correct: option.isCorrect ?? false,
                        position: option.position ?? optionIndex,
                    }))
                )
                .select()

            if (optionError) {
                return NextResponse.json(
                    {
                        error: optionError.message || `Failed to create options for question ${index + 1}`,
                    },
                    { status: 500 }
                )
            }

            optionRows = insertedOptions ?? []
        }

        createdQuestions.push(toQuestionItem(questionRow as Record<string, unknown>, optionRows))
    }

    return NextResponse.json({ questions: createdQuestions, created: createdQuestions.length })
}
