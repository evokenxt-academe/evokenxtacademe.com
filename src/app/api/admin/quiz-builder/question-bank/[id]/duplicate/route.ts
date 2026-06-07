import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ id: string }> }

// ── POST: Duplicate question ──────────────────────────────────

export async function POST(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const { supabase } = auth

    // Fetch original bank question with options
    const { data: original, error: fetchError } = await supabase
        .from("bank_questions")
        .select("*, bank_question_options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !original) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 404 }
        )
    }

    // Create duplicate bank question
    const { data: duplicate, error: dupError } = await supabase
        .from("bank_questions")
        .insert({
            subject_id: original.subject_id,
            topic_id: original.topic_id,
            sub_topic_id: original.sub_topic_id,
            type: original.type,
            question_text: `${original.question_text} (copy)`,
            question_image_url: original.question_image_url,
            difficulty: original.difficulty,
            marks: original.marks,
            negative_marks: original.negative_marks,
            source_ref: original.source_ref,
            year: original.year,
            session: original.session,
            tags: original.tags,
            assertion_text: original.assertion_text,
            reason_text: original.reason_text,
            numerical_answer: original.numerical_answer,
            numerical_tolerance: original.numerical_tolerance,
            blank_answer: original.blank_answer,
            model_answer: original.model_answer,
            explanation: original.explanation,
            explanation_image_url: original.explanation_image_url,
            is_active: original.is_active,
            created_by: auth.userId,
        })
        .select()
        .single()

    if (dupError || !duplicate) {
        return NextResponse.json(
            { error: dupError?.message || "Failed to duplicate" },
            { status: 500 }
        )
    }

    // Duplicate options
    const originalOptions = (original.bank_question_options as Array<Record<string, unknown>>) ?? []
    let optionRows: Array<Record<string, unknown>> = []

    if (originalOptions.length > 0) {
        const { data: opts, error: oError } = await supabase
            .from("bank_question_options")
            .insert(
                originalOptions.map((opt) => ({
                    question_id: duplicate.id,
                    option_text: opt.option_text as string,
                    is_correct: opt.is_correct as boolean,
                    position: opt.position as number,
                    explanation: opt.explanation,
                }))
            )
            .select()

        if (!oError && opts) {
            optionRows = opts
        }
    }

    return NextResponse.json({
        question: {
            id: duplicate.id,
            question: duplicate.question_text,
            imageUrl: duplicate.question_image_url || null,
            type: duplicate.type,
            explanation: duplicate.explanation,
            explanationImageUrl: duplicate.explanation_image_url || null,
            difficulty: duplicate.difficulty,
            tags: duplicate.tags ?? [],
            marks: duplicate.marks,
            createdBy: duplicate.created_by,
            createdAt: duplicate.created_at,
            updatedAt: duplicate.updated_at,
            options: optionRows.map((opt) => ({
                id: opt.id,
                questionId: duplicate.id,
                text: opt.option_text,
                isCorrect: opt.is_correct,
                position: opt.position,
            })),
        },
    })
}
