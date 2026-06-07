import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ id: string }> }

// ── PUT: Update question ──────────────────────────────────────

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const { supabase } = auth
    const body = await request.json()

    const { question, marks, options } = body

    // Update bank question row
    const updateData: Record<string, unknown> = {}
    if (question !== undefined) updateData.question_text = question
    if (marks !== undefined) updateData.marks = marks
    if (body.explanation !== undefined) updateData.explanation = body.explanation
    if (body.type !== undefined) updateData.type = body.type
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.tags !== undefined) updateData.tags = body.tags

    if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
            .from("bank_questions")
            .update(updateData)
            .eq("id", id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Recalculate total_marks & passing_marks for quizzes containing this question if marks updated
        if (marks !== undefined) {
            const { data: linkedQuizzes } = await supabase
                .from("quiz_questions")
                .select("quiz_id")
                .eq("question_id", id)

            if (linkedQuizzes && linkedQuizzes.length > 0) {
                const quizIds = Array.from(new Set(linkedQuizzes.map((l) => l.quiz_id)))
                for (const qId of quizIds) {
                    const { data: allQ } = await supabase
                        .from("quiz_questions")
                        .select("question_bank(marks)")
                        .eq("quiz_id", qId)

                    const totalMarks = (allQ ?? []).reduce((sum, row) => {
                        const m = (row.question_bank as { marks?: number } | null)?.marks ?? 1
                        return sum + m
                    }, 0)
                    const passingMarks = Math.ceil(totalMarks * 0.5)
                    await supabase
                        .from("quizzes")
                        .update({ total_marks: totalMarks, passing_marks: passingMarks })
                        .eq("id", qId)
                }
            }
        }
    }

    // Replace options if provided
    if (options !== undefined) {
        // Delete existing options
        await supabase.from("bank_question_options").delete().eq("question_id", id)

        // Insert new options
        if (options.length > 0) {
            const { error: oError } = await supabase
                .from("bank_question_options")
                .insert(
                    options.map((opt: { text: string; isCorrect: boolean; position?: number }, index: number) => ({
                        question_id: id,
                        option_text: opt.text,
                        is_correct: opt.isCorrect ?? false,
                        position: opt.position ?? index,
                    }))
                )

            if (oError) {
                return NextResponse.json({ error: oError.message }, { status: 500 })
            }
        }
    }

    // Return updated question
    const { data: updated, error: fetchError } = await supabase
        .from("bank_questions")
        .select("*, bank_question_options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !updated) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 500 }
        )
    }

    const opts = (updated.bank_question_options as Array<Record<string, unknown>>) ?? []

    return NextResponse.json({
        question: {
            id: updated.id,
            question: updated.question_text,
            imageUrl: updated.question_image_url || null,
            type: updated.type,
            explanation: updated.explanation,
            explanationImageUrl: updated.explanation_image_url || null,
            difficulty: updated.difficulty,
            tags: updated.tags ?? [],
            marks: updated.marks,
            createdBy: updated.created_by,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
            options: opts.map((opt, idx) => ({
                id: opt.id,
                questionId: updated.id,
                text: opt.option_text,
                isCorrect: opt.is_correct,
                position: opt.position ?? idx,
            })),
        },
    })
}

// ── DELETE: Delete question ───────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const { supabase } = auth

    const { error } = await supabase
        .from("bank_questions")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
