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

    const { question, imageUrl, type, explanation, explanationImageUrl, difficulty, tags, marks, options } = body

    // Update main question
    const updateData: Record<string, unknown> = {}
    if (question !== undefined) updateData.question = question
    if (imageUrl !== undefined) updateData.image_url = imageUrl
    if (type !== undefined) updateData.type = type
    if (explanation !== undefined) updateData.explanation = explanation
    if (explanationImageUrl !== undefined) updateData.explanation_image_url = explanationImageUrl
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (tags !== undefined) updateData.tags = tags
    if (marks !== undefined) updateData.marks = marks

    if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
            .from("question_bank")
            .update(updateData)
            .eq("id", id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    // Replace options if provided
    if (options !== undefined) {
        // Delete existing options
        await supabase
            .from("question_bank_options")
            .delete()
            .eq("question_id", id)

        // Insert new options
        if (options.length > 0) {
            const { error: oError } = await supabase
                .from("question_bank_options")
                .insert(
                    options.map((opt: { text: string; isCorrect: boolean; position: number }, idx: number) => ({
                        question_id: id,
                        text: opt.text,
                        is_correct: opt.isCorrect ?? false,
                        position: opt.position ?? idx,
                    }))
                )

            if (oError) {
                return NextResponse.json({ error: oError.message }, { status: 500 })
            }
        }
    }

    // Return updated question
    const { data: updated, error: fetchError } = await supabase
        .from("question_bank")
        .select("*, question_bank_options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !updated) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 500 }
        )
    }

    return NextResponse.json({
        question: {
            id: updated.id,
            question: updated.question,
            imageUrl: updated.image_url,
            type: updated.type,
            explanation: updated.explanation,
            explanationImageUrl: updated.explanation_image_url,
            difficulty: updated.difficulty,
            tags: updated.tags,
            marks: updated.marks,
            createdBy: updated.created_by,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
            options: ((updated.question_bank_options as Array<Record<string, unknown>>) ?? [])
                .sort((a, b) => (a.position as number) - (b.position as number))
                .map((opt) => ({
                    id: opt.id,
                    questionId: opt.question_id,
                    text: opt.text,
                    isCorrect: opt.is_correct,
                    position: opt.position,
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
        .from("question_bank")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
