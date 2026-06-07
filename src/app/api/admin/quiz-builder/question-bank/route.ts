import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { QuestionType } from "@/types/database.types"

// ── Helper: Map a question row + options to API response shape ─

function mapQuestion(row: Record<string, unknown>, opts: Array<Record<string, unknown>>) {
    return {
        id: row.id as string,
        question: row.question_text as string,
        imageUrl: (row.question_image_url as string | null) ?? null,
        type: row.type as QuestionType,
        explanation: (row.explanation as string | null) ?? null,
        explanationImageUrl: (row.explanation_image_url as string | null) ?? null,
        difficulty: (row.difficulty as "easy" | "medium" | "hard") ?? "medium",
        tags: (row.tags as string[]) ?? [],
        marks: row.marks as number,
        createdBy: (row.created_by as string | null) ?? null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        options: opts.map((opt, idx) => ({
            id: opt.id as string,
            questionId: row.id as string,
            text: opt.option_text as string,
            isCorrect: opt.is_correct as boolean,
            position: opt.position ?? idx,
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
        .from("bank_questions")
        .select("*, bank_question_options(*)", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike("question_text", `%${search}%`)
    }
    const { data, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => {
        const opts = (row.bank_question_options as Array<Record<string, unknown>>) ?? []
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

    const { question, marks, options, quizId, subjectId, topicId, subTopicId } = body

    if (!question?.trim()) {
        return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    if (!subjectId) {
        return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    if (!topicId) {
        return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    // Insert bank question row
    const { data: questionRow, error: qError } = await supabase
        .from("bank_questions")
        .insert({
            question_text: question.trim(),
            type: body.type || "mcq",
            explanation: body.explanation || null,
            difficulty: body.difficulty || "medium",
            tags: Array.isArray(body.tags) ? body.tags : [],
            marks: marks || 1,
            subject_id: subjectId,
            topic_id: topicId,
            sub_topic_id: subTopicId || null,
            is_active: true,
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
            .from("bank_question_options")
            .insert(
                options.map((opt: { text: string; isCorrect: boolean; position?: number }, index: number) => ({
                    question_id: questionRow.id,
                    option_text: opt.text,
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
            .from("questions")
            .select("position")
            .eq("quiz_id", quizId)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle()

        const nextPosition = (maxRow?.position ?? -1) + 1
        const { data: quizQuestion } = await supabase
            .from("questions")
            .insert({
                quiz_id: quizId,
                question_text: question.trim(),
                type: body.type || "mcq",
                explanation: body.explanation || null,
                difficulty: body.difficulty || "medium",
                marks: marks || 1,
                position: nextPosition,
            })
            .select()
            .single()

        if (quizQuestion) {
            // Link the quiz question to the bank question
            await supabase.from("quiz_bank_links").insert({
                quiz_id: quizId,
                quiz_question_id: quizQuestion.id,
                bank_question_id: questionRow.id,
                is_synced: true,
            }).select()
        }

        const { data: quizRows } = await supabase
            .from("questions")
            .select("marks")
            .eq("quiz_id", quizId)
        const totalMarks = (quizRows ?? []).reduce((sum, row) => {
            return sum + ((row.marks as number) ?? 1)
        }, 0)
        const passingMarks = Math.ceil(totalMarks * 0.5)
        await supabase
            .from("quizzes")
            .update({ 
                total_marks: totalMarks,
                passing_marks: passingMarks
            })
            .eq("id", quizId)
    }

    return NextResponse.json({
        question: mapQuestion(questionRow as Record<string, unknown>, optionRows),
    })
}
