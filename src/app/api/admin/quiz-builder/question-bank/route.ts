import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

// ── GET: List question bank with filters ──────────────────────

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase, userId } = auth
    const { searchParams } = request.nextUrl

    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const difficulty = searchParams.get("difficulty")
    const tagsRaw = searchParams.get("tags")
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
    if (type) {
        query = query.eq("type", type)
    }
    if (difficulty) {
        query = query.eq("difficulty", difficulty)
    }
    if (tagsRaw) {
        const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        if (tags.length > 0) {
            query = query.overlaps("tags", tags)
        }
    }

    const { data, error, count } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questions = (data ?? []).map((row) => ({
        id: row.id,
        question: row.question,
        imageUrl: row.image_url,
        type: row.type,
        explanation: row.explanation,
        explanationImageUrl: row.explanation_image_url,
        difficulty: row.difficulty,
        tags: row.tags ?? [],
        marks: row.marks,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        options: ((row.question_bank_options as Array<Record<string, unknown>>) ?? [])
            .sort((a, b) => (a.position as number) - (b.position as number))
            .map((opt) => ({
                id: opt.id as string,
                questionId: opt.question_id as string,
                text: opt.text as string,
                isCorrect: opt.is_correct as boolean,
                position: opt.position as number,
            })),
    }))

    return NextResponse.json({ questions, total: count ?? 0 })
}

// ── POST: Create question ─────────────────────────────────────

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase, userId } = auth
    const body = await request.json()

    const { question, imageUrl, type, explanation, explanationImageUrl, difficulty, tags, marks, options } = body

    if (!question?.trim()) {
        return NextResponse.json({ error: "Question text is required" }, { status: 400 })
    }

    // Insert question
    const { data: questionRow, error: qError } = await supabase
        .from("question_bank")
        .insert({
            question: question.trim(),
            image_url: imageUrl || null,
            type: type || "mcq",
            explanation: explanation || null,
            explanation_image_url: explanationImageUrl || null,
            difficulty: difficulty || "medium",
            tags: tags || [],
            marks: marks || 1,
            created_by: userId,
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
                options.map((opt: { text: string; isCorrect: boolean; position: number }, idx: number) => ({
                    question_id: questionRow.id,
                    text: opt.text,
                    is_correct: opt.isCorrect ?? false,
                    position: opt.position ?? idx,
                }))
            )
            .select()

        if (oError) {
            return NextResponse.json({ error: oError.message }, { status: 500 })
        }
        optionRows = opts ?? []
    }

    return NextResponse.json({
        question: {
            id: questionRow.id,
            question: questionRow.question,
            imageUrl: questionRow.image_url,
            type: questionRow.type,
            explanation: questionRow.explanation,
            explanationImageUrl: questionRow.explanation_image_url,
            difficulty: questionRow.difficulty,
            tags: questionRow.tags,
            marks: questionRow.marks,
            createdBy: questionRow.created_by,
            createdAt: questionRow.created_at,
            updatedAt: questionRow.updated_at,
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
