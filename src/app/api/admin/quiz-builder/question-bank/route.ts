import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

// ── Helper: Map a question row + options to API response shape ─

function mapQuestion(row: Record<string, unknown>, opts: Array<Record<string, unknown>>) {
    return {
        id: row.id as string,
        question: row.question as string,
        imageUrl: null,
        type: "mcq" as const,
        explanation: null,
        explanationImageUrl: null,
        difficulty: "medium" as const,
        tags: [] as string[],
        marks: row.marks as number,
        createdBy: null,
        createdAt: row.id as string, // no created_at column, use id as placeholder
        updatedAt: row.id as string,
        options: opts.map((opt, idx) => ({
            id: opt.id as string,
            questionId: row.id as string,
            text: opt.text as string,
            isCorrect: opt.is_correct as boolean,
            position: idx,
        })),
    }
}

// ── GET: List questions (optionally filtered by quiz) ─────────

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const { searchParams } = request.nextUrl

    const search = searchParams.get("search")
    const quizId = searchParams.get("quizId")
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")))
    const offset = (page - 1) * limit

    let query = supabase
        .from("questions")
        .select("*, options(*)", { count: "exact" })
        .order("position", { ascending: true })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike("question", `%${search}%`)
    }
    if (quizId) {
        query = query.eq("quiz_id", quizId)
    }

    const { data, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => {
        const opts = (row.options as Array<Record<string, unknown>>) ?? []
        return mapQuestion(row as Record<string, unknown>, opts)
    })

    return NextResponse.json({ questions, total: count ?? 0 })
}

// ── POST: Create question ─────────────────────────────────────

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const body = await request.json()

    const { question, marks, options, quizId } = body

    if (!question?.trim()) {
        return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    if (!quizId) {
        return NextResponse.json({ error: "quizId is required" }, { status: 400 })
    }

    // Get current max position in quiz
    const { data: maxRow } = await supabase
        .from("questions")
        .select("position")
        .eq("quiz_id", quizId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

    const nextPosition = (maxRow?.position ?? -1) + 1

    // Insert question
    const { data: questionRow, error: qError } = await supabase
        .from("questions")
        .insert({
            quiz_id: quizId,
            question: question.trim(),
            source: body.explanation || null,
            marks: marks || 1,
            position: nextPosition,
        })
        .select()
        .single()

    if (qError || !questionRow) {
        return NextResponse.json(
            { error: qError?.message || "Failed to create question" },
            { status: 500 }
        )
    }

    // Insert options if provided
    let optionRows: Array<Record<string, unknown>> = []
    if (options?.length > 0) {
        const { data: opts, error: oError } = await supabase
            .from("options")
            .insert(
                options.map((opt: { text: string; isCorrect: boolean }) => ({
                    question_id: questionRow.id,
                    text: opt.text,
                    is_correct: opt.isCorrect ?? false,
                }))
            )
            .select()

        if (oError) {
            return NextResponse.json({ error: oError.message }, { status: 500 })
        }
        optionRows = opts ?? []
    }

    // Recalculate total marks
    const { data: allQ } = await supabase
        .from("questions")
        .select("marks")
        .eq("quiz_id", quizId)

    const totalMarks = (allQ ?? []).reduce((sum, q) => sum + (q.marks ?? 1), 0)
    await supabase.from("quizzes").update({ total_marks: totalMarks }).eq("id", quizId)

    return NextResponse.json({
        question: mapQuestion(questionRow as Record<string, unknown>, optionRows),
    })
}
