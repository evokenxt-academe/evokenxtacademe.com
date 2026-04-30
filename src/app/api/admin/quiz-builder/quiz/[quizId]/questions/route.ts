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
        .from("questions")
        .select("*, options(*)")
        .eq("quiz_id", quizId)
        .order("position", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => {
        const opts = (row.options as Array<Record<string, unknown>>) ?? []

        return {
            id: row.id,
            quizId: row.quiz_id,
            questionId: row.id, // for backwards compatibility with the UI
            position: row.position,
            marksOverride: null, // No longer supported in schema
            question: {
                id: row.id as string,
                question: row.question as string,
                type: "mcq", // Defaults
                explanation: row.source as string | null,
                difficulty: "medium",
                tags: [],
                marks: row.marks as number,
                createdBy: null,
                createdAt: row.id as string,
                updatedAt: row.id as string,
                options: opts
                    .sort((a, b) => (a.position as number) - (b.position as number))
                    .map((opt, idx) => ({
                        id: opt.id as string,
                        questionId: row.id as string,
                        text: opt.text as string,
                        isCorrect: opt.is_correct as boolean,
                        position: idx,
                    })),
            },
        }
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
        .from("questions")
        .select("position")
        .eq("quiz_id", quizId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

    let nextPosition = (maxRow?.position ?? -1) + 1

    // Fetch original questions with options
    const { data: originalQuestions, error: fetchError } = await supabase
        .from("questions")
        .select("*, options(*)")
        .in("id", questionIds)

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let addedCount = 0

    for (const original of originalQuestions ?? []) {
        // Create duplicate
        const { data: duplicate, error: dupError } = await supabase
            .from("questions")
            .insert({
                quiz_id: quizId,
                question: original.question,
                source: original.source,
                marks: original.marks,
                position: nextPosition++,
            })
            .select()
            .single()

        if (dupError || !duplicate) {
            continue
        }

        // Duplicate options
        const originalOptions = (original.options as Array<Record<string, unknown>>) ?? []

        if (originalOptions.length > 0) {
            await supabase
                .from("options")
                .insert(
                    originalOptions.map((opt) => ({
                        question_id: duplicate.id,
                        text: opt.text as string,
                        is_correct: opt.is_correct as boolean,
                    }))
                )
        }
        addedCount++
    }

    // Recalculate total marks
    const { data: allQ } = await supabase
        .from("questions")
        .select("marks")
        .eq("quiz_id", quizId)

    const totalMarks = (allQ ?? []).reduce((sum, q) => sum + (q.marks ?? 1), 0)

    await supabase
        .from("quizzes")
        .update({ total_marks: totalMarks })
        .eq("id", quizId)

    return NextResponse.json({ added: addedCount })
}
