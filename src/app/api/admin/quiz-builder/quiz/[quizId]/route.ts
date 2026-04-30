import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"

type RouteParams = { params: Promise<{ quizId: string }> }

// ── PUT: Update quiz metadata ─────────────────────────────────

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { quizId } = await params
    const { supabase } = auth
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.totalMarks !== undefined) updateData.total_marks = body.totalMarks
    if (body.passingMarks !== undefined) updateData.passing_marks = body.passingMarks
    if (body.timeLimitSec !== undefined) updateData.time_limit_sec = body.timeLimitSec

    const { data, error } = await supabase
        .from("quizzes")
        .update(updateData)
        .eq("id", quizId)
        .select("*, quiz_questions(id)")
        .single()

    if (error || !data) {
        return NextResponse.json(
            { error: error?.message || "Quiz not found" },
            { status: 500 }
        )
    }

    return NextResponse.json({
        quiz: {
            id: data.id,
            sectionId: data.section_id,
            title: data.title,
            description: data.description,
            type: data.type,
            totalMarks: data.total_marks,
            passingMarks: data.passing_marks,
            timeLimitSec: data.time_limit_sec,
            isPublished: data.is_published,
            createdAt: data.created_at,
            questionCount: ((data.quiz_questions as unknown[]) ?? []).length,
        },
    })
}
