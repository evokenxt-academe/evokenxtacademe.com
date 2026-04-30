// ─────────────────────────────────────────────────────────────
// Quiz Builder Types
// ─────────────────────────────────────────────────────────────

import type { QuestionType, DifficultyLevel, QuizType } from "@/types/database.types"

export type { QuestionType, DifficultyLevel }

// ── Question Bank ─────────────────────────────────────────────

export interface QuestionBankOption {
    id: string
    questionId: string
    text: string
    isCorrect: boolean
    position: number
}

export interface QuestionBankItem {
    id: string
    question: string
    imageUrl?: string | null
    type: QuestionType
    explanation: string | null
    explanationImageUrl?: string | null
    difficulty: DifficultyLevel
    tags: string[]
    marks: number
    createdBy: string | null
    createdAt: string
    updatedAt: string
    options: QuestionBankOption[]
}

// ── Quiz ──────────────────────────────────────────────────────

export interface QuizSummary {
    id: string
    sectionId: string
    title: string
    description: string | null
    type: QuizType
    totalMarks: number
    passingMarks: number
    timeLimitSec: number | null
    isPublished: boolean
    createdAt: string
    questionCount: number
}

// ── Quiz Question (junction table with hydrated question data) ──

export interface QuizQuestion {
    id: string
    quizId: string
    questionId: string
    position: number
    marksOverride: number | null
    question: QuestionBankItem
}

// ── Form payloads ─────────────────────────────────────────────

export interface CreateQuestionPayload {
    quizId?: string
    question: string
    imageUrl?: string
    type: QuestionType
    explanation?: string
    explanationImageUrl?: string
    difficulty: DifficultyLevel
    tags: string[]
    marks: number
    options: Array<{
        text: string
        isCorrect: boolean
        position: number
    }>
}

export interface BulkCreateQuestionsPayload {
    quizId?: string
    questions: CreateQuestionPayload[]
}

export interface ParsedQuestion {
    question: string
    type: QuestionType
    difficulty: DifficultyLevel
    marks: number
    explanation?: string
    tags?: string[]
    options?: { text: string; isCorrect: boolean }[]
    correctAnswer?: string
}

export interface PDFExtractionResult {
    questions: ParsedQuestion[]
    totalDetected: number
    format: string
}

export interface UpdateQuestionPayload extends Partial<CreateQuestionPayload> {
    id: string
}

export interface AddQuestionsToQuizPayload {
    quizId: string
    questionIds: string[]
}

export interface ReorderQuestionsPayload {
    quizId: string
    /** Ordered list of quiz_question IDs in their new order */
    orderedIds: string[]
}

export interface CreateQuizPayload {
    sectionId: string
    title: string
    description?: string
    type?: QuizType
    totalMarks?: number
    passingMarks?: number
    timeLimitSec?: number | null
}

// ── Course/Section selectors ──────────────────────────────────

export interface CourseSectionOption {
    courseId: string
    courseName: string
    sections: Array<{
        id: string
        title: string
        position: number
    }>
}

// ── Question type labels & metadata ───────────────────────────

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    mcq: "MCQ",
    multiple_select: "Multiple Select",
    subjective: "Subjective",
    fill_in_the_blanks: "Fill in the Blanks",
    true_or_false: "True or False",
    assertion_reasoning: "Assertion & Reasoning",
    number: "Number",
}

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
}

export const QUESTION_TYPES_WITH_OPTIONS: QuestionType[] = [
    "mcq",
    "multiple_select",
    "true_or_false",
    "assertion_reasoning",
]

export function questionTypeHasOptions(type: QuestionType): boolean {
    return QUESTION_TYPES_WITH_OPTIONS.includes(type)
}

export function questionTypeHasFreeAnswer(type: QuestionType): boolean {
    return ["subjective", "fill_in_the_blanks", "number"].includes(type)
}
