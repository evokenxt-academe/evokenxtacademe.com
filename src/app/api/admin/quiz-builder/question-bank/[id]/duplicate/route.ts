import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ id: string }> }

// ── POST: Duplicate question ──────────────────────────────────

export async function POST(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { id } = await params
    const { supabase } = auth

    // Fetch original question with options
    const { data: original, error: fetchError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("id", id)
        .single()

    if (fetchError || !original) {
        return NextResponse.json(
            { error: fetchError?.message || "Question not found" },
            { status: 404 }
        )
    }

    // Get current max position in quiz
    const { data: maxRow } = await supabase
        .from("questions")
        .select("position")
        .eq("quiz_id", original.quiz_id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

    const nextPosition = (maxRow?.position ?? -1) + 1

    // Create duplicate
    const { data: duplicate, error: dupError } = await supabase
        .from("questions")
        .insert({
            quiz_id: original.quiz_id,
            question: `${original.question} (copy)`,
            source: original.source,
            marks: original.marks,
            position: nextPosition,
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
    const originalOptions = (original.options as Array<Record<string, unknown>>) ?? []
    let optionRows: Array<Record<string, unknown>> = []

    if (originalOptions.length > 0) {
        const { data: opts, error: oError } = await supabase
            .from("options")
            .insert(
                originalOptions.map((opt) => ({
                    question_id: duplicate.id,
                    text: opt.text as string,
                    is_correct: opt.is_correct as boolean,
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
            imageUrl: null,
            type: "mcq",
            explanation: duplicate.source,
            explanationImageUrl: null,
            difficulty: "medium",
            tags: [],
            marks: duplicate.marks,
            createdBy: null,
            createdAt: duplicate.id,
            updatedAt: duplicate.id,
            options: optionRows.map((opt, idx) => ({
                id: opt.id,
                questionId: duplicate.id,
                text: opt.text,
                isCorrect: opt.is_correct,
                position: idx,
            })),
        },
    })
}
