import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ id: string }> }

// ── POST: Duplicate question ──────────────────────────────────

export async function POST(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const { supabase, userId } = auth

    // Fetch original question with options
    const { data: original, error: fetchError } = await supabase
        .from("question_bank")
        .select("*, question_bank_options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !original) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 404 }
        )
    }

    // Create duplicate
    const { data: duplicate, error: dupError } = await supabase
        .from("question_bank")
        .insert({
            question: `${original.question} (copy)`,
            type: original.type,
            explanation: original.explanation,
            difficulty: original.difficulty,
            tags: original.tags,
            marks: original.marks,
            created_by: userId,
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
    const originalOptions = (original.question_bank_options as Array<Record<string, unknown>>) ?? []
    let optionRows: Array<Record<string, unknown>> = []

    if (originalOptions.length > 0) {
        const { data: opts, error: oError } = await supabase
            .from("question_bank_options")
            .insert(
                originalOptions.map((opt) => ({
                    question_id: duplicate.id,
                    text: opt.text as string,
                    is_correct: opt.is_correct as boolean,
                    position: opt.position as number,
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
            question: duplicate.question,
            type: duplicate.type,
            explanation: duplicate.explanation,
            difficulty: duplicate.difficulty,
            tags: duplicate.tags,
            marks: duplicate.marks,
            createdBy: duplicate.created_by,
            createdAt: duplicate.created_at,
            updatedAt: duplicate.updated_at,
            options: optionRows.map((opt) => ({
                id: opt.id,
                questionId: opt.question_id,
                text: opt.text,
                isCorrect: opt.is_correct,
                position: opt.position,
            })),
        },
    })
}
