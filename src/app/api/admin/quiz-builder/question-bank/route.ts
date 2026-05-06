import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { QuestionType } from "@/types/database.types"

// ── Helper: Map a question row + options to API response shape ─

function mapQuestion(row: Record<string, unknown>, opts: Array<Record<string, unknown>>) {
    return {
        id: row.id as string,
        question: row.question as string,
        imageUrl: null,
        type: row.type as QuestionType,
        explanation: (row.explanation as string | null) ?? null,
        explanationImageUrl: null,
        difficulty: (row.difficulty as "easy" | "medium" | "hard") ?? "medium",
        tags: (row.tags as string[]) ?? [],
        marks: row.marks as number,
        createdBy: (row.created_by as string | null) ?? null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
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
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")))
    const offset = (page - 1) * limit

    let query = supabase
        .from("question_bank")
        .select("*, question_bank_options(*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike("question", `%${search}%`)
    }
    const { data, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => {
        const opts = (row.question_bank_options as Array<Record<string, unknown>>) ?? []
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

    // Insert question bank row
    const { data: questionRow, error: qError } = await supabase
        .from("question_bank")
        .insert({
            question: question.trim(),
            type: body.type || "mcq",
            explanation: body.explanation || null,
            difficulty: body.difficulty || "medium",
            tags: Array.isArray(body.tags) ? body.tags : [],
            marks: marks || 1,
            created_by: auth.userId,
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
            .from("question_bank_options")
            .insert(
                options.map((opt: { text: string; isCorrect: boolean; position?: number }, index: number) => ({
                    question_id: questionRow.id,
                    text: opt.text,
                    is_correct: opt.isCorrect ?? false,
                    position: opt.position ?? index,
                }))
            )
            .select()

        if (oError) {
            return NextResponse.json({ error: oError.message }, { status: 500 })
        }
        optionRows = opts ?? []
    }

    if (quizId) {
        const { data: maxRow } = await supabase
            .from("quiz_questions")
            .select("position")
            .eq("quiz_id", quizId)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle()

        const nextPosition = (maxRow?.position ?? -1) + 1
        await supabase.from("quiz_questions").insert({
            quiz_id: quizId,
            question_id: questionRow.id,
            position: nextPosition,
        })

        const { data: quizRows } = await supabase
            .from("quiz_questions")
            .select("question_bank(marks)")
            .eq("quiz_id", quizId)
        const totalMarks = (quizRows ?? []).reduce((sum, row) => {
            const marksValue = (row.question_bank as { marks?: number } | null)?.marks ?? 1
            return sum + marksValue
        }, 0)
        await supabase.from("quizzes").update({ total_marks: totalMarks }).eq("id", quizId)
    }

    return NextResponse.json({
        question: mapQuestion(questionRow as Record<string, unknown>, optionRows),
    })
}
