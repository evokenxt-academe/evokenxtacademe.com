import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/features/admin/lib/admin-route"
import type { CreateQuestionPayload } from "@/features/admin/quiz-builder/types"

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(["admin", "instructor"])
    if ("error" in auth) return auth.error

    const { supabase } = auth
    const body = (await request.json()) as {
        questions?: CreateQuestionPayload[]
        quizId?: string
        subjectId?: string
        topicId?: string
    }
    const questions = Array.isArray(body.questions) ? body.questions : []
    const quizId = body.quizId
    const subjectId = body.subjectId
    const topicId = body.topicId

    if (questions.length === 0) {
        return NextResponse.json({ error: "questions are required" }, { status: 400 })
    }

    if (!subjectId || !topicId) {
        return NextResponse.json({ error: "subjectId and topicId are required" }, { status: 400 })
    }

    const createdQuestions: Array<Record<string, unknown>> = []

    for (const [index, payload] of questions.entries()) {
        if (!payload?.question?.trim()) {
            return NextResponse.json(
                { error: `Question ${index + 1} is missing question text` },
                { status: 400 }
            )
        }

        const { data: bankQuestion, error: bankError } = await supabase
            .from("bank_questions")
            .insert({
                subject_id: subjectId,
                topic_id: topicId,
                sub_topic_id: (payload as any).subTopicId ?? null,
                type: payload.type ?? "mcq",
                question_text: payload.question.trim(),
                explanation: payload.explanation ?? null,
                difficulty: payload.difficulty ?? "medium",
                marks: payload.marks ?? 1,
                tags: Array.isArray(payload.tags) ? payload.tags : [],
                is_active: true,
                created_by: auth.userId,
            })
            .select()
            .single()

        if (bankError || !bankQuestion) {
            return NextResponse.json(
                { error: bankError?.message || `Failed to create question ${index + 1}` },
                { status: 500 }
            )
        }

        let optionRows: Array<Record<string, unknown>> = []
        if (payload.options?.length) {
            const { data: insertedOptions, error: optionError } = await supabase
                .from("bank_question_options")
                .insert(
                    payload.options.map((option, idx) => ({
                        question_id: bankQuestion.id,
                        option_text: option.text,
                        is_correct: option.isCorrect ?? false,
                        position: option.position ?? idx,
                    }))
                )
                .select()

            if (optionError) {
                return NextResponse.json(
                    { error: optionError.message || `Failed to create options for question ${index + 1}` },
                    { status: 500 }
                )
            }

            optionRows = insertedOptions ?? []
        }

        // If a quizId is provided, also add to quiz
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
                    question_text: bankQuestion.question_text,
                    type: bankQuestion.type,
                    difficulty: bankQuestion.difficulty,
                    marks: bankQuestion.marks,
                    explanation: bankQuestion.explanation,
                    position: nextPosition,
                })
                .select()
                .single()

            if (quizQuestion) {
                await supabase.from("quiz_bank_links").insert({
                    quiz_id: quizId,
                    quiz_question_id: quizQuestion.id,
                    bank_question_id: bankQuestion.id,
                    is_synced: true,
                }).select()
            }
        }

        createdQuestions.push({
            id: bankQuestion.id,
            question: bankQuestion.question_text,
            imageUrl: bankQuestion.question_image_url || null,
            type: bankQuestion.type,
            explanation: bankQuestion.explanation,
            explanationImageUrl: bankQuestion.explanation_image_url || null,
            difficulty: bankQuestion.difficulty,
            tags: bankQuestion.tags ?? [],
            marks: bankQuestion.marks,
            createdBy: bankQuestion.created_by,
            createdAt: bankQuestion.created_at,
            updatedAt: bankQuestion.updated_at,
            options: optionRows.map((opt) => ({
                id: opt.id,
                questionId: bankQuestion.id,
                text: opt.option_text,
                isCorrect: opt.is_correct,
                position: opt.position,
            })),
        })
    }

    if (quizId) {
        // Recalculate total marks for the quiz
        const { data: allQ } = await supabase
            .from("questions")
            .select("marks")
            .eq("quiz_id", quizId)

        const totalMarks = (allQ ?? []).reduce((sum, q) => sum + (q.marks ?? 1), 0)
        const passingMarks = Math.ceil(totalMarks * 0.5)
        await supabase
            .from("quizzes")
            .update({ 
                total_marks: totalMarks,
                passing_marks: passingMarks
            })
            .eq("id", quizId)
    }

    return NextResponse.json({ questions: createdQuestions, created: createdQuestions.length })
}
