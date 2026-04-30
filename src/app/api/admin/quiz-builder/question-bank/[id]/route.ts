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

    // Update main question (only columns that exist in schema)
    const updateData: Record<string, unknown> = {}
    if (question !== undefined) updateData.question = question
    if (marks !== undefined) updateData.marks = marks
    if (body.explanation !== undefined) updateData.source = body.explanation

    if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
            .from("questions")
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
            .from("options")
            .delete()
            .eq("question_id", id)

        // Insert new options
        if (options.length > 0) {
            const { error: oError } = await supabase
                .from("options")
                .insert(
                    options.map((opt: { text: string; isCorrect: boolean }) => ({
                        question_id: id,
                        text: opt.text,
                        is_correct: opt.isCorrect ?? false,
                    }))
                )

            if (oError) {
                return NextResponse.json({ error: oError.message }, { status: 500 })
            }
        }
    }

    // Return updated question
    const { data: updated, error: fetchError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !updated) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 500 }
        )
    }

    const opts = (updated.options as Array<Record<string, unknown>>) ?? []

    return NextResponse.json({
        question: {
            id: updated.id,
            question: updated.question,
            imageUrl: null,
            type: "mcq",
            explanation: updated.source,
            explanationImageUrl: null,
            difficulty: "medium",
            tags: [],
            marks: updated.marks,
            createdBy: null,
            createdAt: updated.id,
            updatedAt: updated.id,
            options: opts.map((opt, idx) => ({
                id: opt.id,
                questionId: updated.id,
                text: opt.text,
                isCorrect: opt.is_correct,
                position: idx,
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

    // Get quiz_id before deleting so we can recalculate marks
    const { data: question } = await supabase
        .from("questions")
        .select("quiz_id")
        .eq("id", id)
        .single()

    const quizId = question?.quiz_id

    const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate total marks for the quiz
    if (quizId) {
        const { data: allQ } = await supabase
            .from("questions")
            .select("marks")
            .eq("quiz_id", quizId)

        const totalMarks = (allQ ?? []).reduce((sum, q) => sum + (q.marks ?? 1), 0)
        await supabase.from("quizzes").update({ total_marks: totalMarks }).eq("id", quizId)
    }

    return NextResponse.json({ success: true })
}
