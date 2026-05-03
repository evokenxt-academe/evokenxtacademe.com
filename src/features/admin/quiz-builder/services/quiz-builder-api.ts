// ─────────────────────────────────────────────────────────────
// Quiz Builder API — Client-side fetch layer
// ─────────────────────────────────────────────────────────────

import type {
    QuestionBankItem,
    QuizSummary,
    QuizQuestion,
    CreateQuestionPayload,
    UpdateQuestionPayload,
    AddQuestionsToQuizPayload,
    ReorderQuestionsPayload,
    CreateQuizPayload,
    CourseSectionOption,
    QuestionType,
    DifficultyLevel,
    BulkCreateQuestionsPayload,
    PDFExtractionResult,
    ParsedQuestion,
} from "../types"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        credentials: "include",
        cache: "no-store",
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
    })

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
    }

    return response.json() as Promise<T>
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(path, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: formData,
    })

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
    }

    return response.json() as Promise<T>
}

// ── Question Bank ─────────────────────────────────────────────

export interface QuestionBankFilters {
    search?: string
    type?: QuestionType
    difficulty?: DifficultyLevel
    tags?: string[]
    page?: number
    limit?: number
}

export const quizBuilderApi = {
    // ── Course / Section selectors
    getCourseSections: () =>
        apiFetch<{ courseSections: CourseSectionOption[] }>("/api/admin/quiz-builder/courses"),

    // ── Question Bank
    getQuestionBank: (filters?: QuestionBankFilters) => {
        const params = new URLSearchParams()
        if (filters?.search) params.set("search", filters.search)
        if (filters?.type) params.set("type", filters.type)
        if (filters?.difficulty) params.set("difficulty", filters.difficulty)
        if (filters?.tags?.length) params.set("tags", filters.tags.join(","))
        if (filters?.page) params.set("page", String(filters.page))
        if (filters?.limit) params.set("limit", String(filters.limit))
        const qs = params.toString()
        return apiFetch<{ questions: QuestionBankItem[]; total: number }>(
            `/api/admin/quiz-builder/question-bank${qs ? `?${qs}` : ""}`
        )
    },

    createQuestion: (payload: CreateQuestionPayload) =>
        apiFetch<{ question: QuestionBankItem }>("/api/admin/quiz-builder/question-bank", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateQuestion: (payload: UpdateQuestionPayload) =>
        apiFetch<{ question: QuestionBankItem }>(
            `/api/admin/quiz-builder/question-bank/${payload.id}`,
            {
                method: "PUT",
                body: JSON.stringify(payload),
            }
        ),

    deleteQuestion: (questionId: string) =>
        apiFetch<{ success: boolean }>(
            `/api/admin/quiz-builder/question-bank/${questionId}`,
            { method: "DELETE" }
        ),

    duplicateQuestion: (questionId: string) =>
        apiFetch<{ question: QuestionBankItem }>(
            `/api/admin/quiz-builder/question-bank/${questionId}/duplicate`,
            { method: "POST" }
        ),

    bulkCreateQuestions: (payload: BulkCreateQuestionsPayload) =>
        apiFetch<{ questions: QuestionBankItem[]; created: number }>(
            "/api/admin/quiz-builder/question-bank/bulk",
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        ),

    parseQuestions: (text: string) =>
        apiFetch<{ questions: ParsedQuestion[]; totalDetected: number; format: string }>(
            "/api/admin/quiz-builder/parse-questions",
            {
                method: "POST",
                body: JSON.stringify({ text }),
            }
        ),

    extractQuestions: (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        return apiUpload<PDFExtractionResult>(
            "/api/admin/quiz-builder/extract-questions",
            formData
        )
    },

    // ── Quiz Management
    getOrCreateQuiz: (sectionId: string) =>
        apiFetch<{ quiz: QuizSummary }>(`/api/admin/quiz-builder/quiz?sectionId=${sectionId}`),

    createQuiz: (payload: CreateQuizPayload) =>
        apiFetch<{ quiz: QuizSummary }>("/api/admin/quiz-builder/quiz", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateQuiz: (quizId: string, payload: Partial<CreateQuizPayload>) =>
        apiFetch<{ quiz: QuizSummary }>(`/api/admin/quiz-builder/quiz/${quizId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),

    togglePublish: (quizId: string, isPublished: boolean) =>
        apiFetch<{ success: boolean }>(`/api/admin/quiz-builder/quiz/${quizId}/publish`, {
            method: "PATCH",
            body: JSON.stringify({ isPublished }),
        }),

    // ── Quiz Questions (junction)
    getQuizQuestions: (quizId: string) =>
        apiFetch<{ questions: QuizQuestion[] }>(
            `/api/admin/quiz-builder/quiz/${quizId}/questions`
        ),

    addQuestionsToQuiz: (payload: AddQuestionsToQuizPayload) =>
        apiFetch<{ added: number }>(
            `/api/admin/quiz-builder/quiz/${payload.quizId}/questions`,
            {
                method: "POST",
                body: JSON.stringify({ questionIds: payload.questionIds }),
            }
        ),

    removeQuestionFromQuiz: (quizId: string, quizQuestionId: string) =>
        apiFetch<{ success: boolean }>(
            `/api/admin/quiz-builder/quiz/${quizId}/questions/${quizQuestionId}`,
            { method: "DELETE" }
        ),

    reorderQuestions: (payload: ReorderQuestionsPayload) =>
        apiFetch<{ success: boolean }>(
            `/api/admin/quiz-builder/quiz/${payload.quizId}/questions/reorder`,
            {
                method: "PATCH",
                body: JSON.stringify({ orderedIds: payload.orderedIds }),
            }
        ),

    // ── Answer Key Import
    importAnswerKey: (file: File, quizId: string) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("quizId", quizId)
        return apiUpload<import("./answer-key-parser").ImportAnswerKeyResult>(
            "/api/admin/import-answer-key",
            formData
        )
    },
}
