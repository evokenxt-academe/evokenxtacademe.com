import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import {
    notifyNewQuiz,
    resolveQuizCourseContext,
} from "@/lib/notifications/server"

// ── GET: Get or auto-create quiz for a section ────────────────

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const sectionId = request.nextUrl.searchParams.get("sectionId")

    if (!sectionId) {
        return NextResponse.json({ error: "sectionId is required" }, { status: 400 })
    }

    // Try to find existing quiz
    const { data, error: findError } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(id)")
        .eq("section_id", sectionId)
        .limit(1)

    const existing = data?.[0]

    if (findError) {
        return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (existing) {
        return NextResponse.json({
            quiz: {
                id: existing.id,
                sectionId: existing.section_id,
                title: existing.title,
                description: existing.description,
                type: existing.type,
                totalMarks: existing.total_marks,
                passingMarks: existing.passing_marks,
                timeLimitSec: existing.time_limit_sec,
                isPublished: existing.is_published,
                createdAt: existing.created_at,
                questionCount: ((existing.quiz_questions as unknown[]) ?? []).length,
            },
        })
    }

    // Auto-create quiz for the section
    // First, get section title
    const { data: section } = await supabase
        .from("sections")
        .select("title")
        .eq("id", sectionId)
        .single()

    const title = section?.title ? `${section.title} — Quiz` : "Section Quiz"

    const { data: newQuiz, error: createError } = await supabase
        .from("quizzes")
        .insert({
            section_id: sectionId,
            title,
            type: "practice",
            total_marks: 0,
            passing_marks: 0,
        })
        .select()
        .single()

    if (createError || !newQuiz) {
        return NextResponse.json(
            { error: createError?.message || "Failed to create quiz" },
            { status: 500 }
        )
    }

    if (newQuiz.is_published) {
        after(async () => {
            const ctx = await resolveQuizCourseContext(newQuiz.id)
            await notifyNewQuiz({
                quizId: newQuiz.id,
                title: newQuiz.title,
                courseName: ctx?.course?.name,
            })
        })
    }

    return NextResponse.json({
        quiz: {
            id: newQuiz.id,
            sectionId: newQuiz.section_id,
            title: newQuiz.title,
            description: newQuiz.description,
            type: newQuiz.type,
            totalMarks: newQuiz.total_marks,
            passingMarks: newQuiz.passing_marks,
            timeLimitSec: newQuiz.time_limit_sec,
            isPublished: newQuiz.is_published,
            createdAt: newQuiz.created_at,
            questionCount: 0,
        },
    })
}

// ── POST: Create quiz explicitly ──────────────────────────────

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const body = await request.json()

    const { sectionId, title, description, type, totalMarks, passingMarks, timeLimitSec } = body

    if (!sectionId || !title?.trim()) {
        return NextResponse.json(
            { error: "sectionId and title are required" },
            { status: 400 }
        )
    }

    const { data: quiz, error } = await supabase
        .from("quizzes")
        .insert({
            section_id: sectionId,
            title: title.trim(),
            description: description || null,
            type: type || "practice",
            total_marks: totalMarks || 0,
            passing_marks: passingMarks || 0,
            time_limit_sec: timeLimitSec ?? null,
        })
        .select()
        .single()

    if (error || !quiz) {
        return NextResponse.json(
            { error: error?.message || "Failed to create quiz" },
            { status: 500 }
        )
    }

    if (quiz.is_published) {
        after(async () => {
            const ctx = await resolveQuizCourseContext(quiz.id)
            await notifyNewQuiz({
                quizId: quiz.id,
                title: quiz.title,
                courseName: ctx?.course?.name,
            })
        })
    }

    return NextResponse.json({
        quiz: {
            id: quiz.id,
            sectionId: quiz.section_id,
            title: quiz.title,
            description: quiz.description,
            type: quiz.type,
            totalMarks: quiz.total_marks,
            passingMarks: quiz.passing_marks,
            timeLimitSec: quiz.time_limit_sec,
            isPublished: quiz.is_published,
            createdAt: quiz.created_at,
            questionCount: 0,
        },
    })
}
