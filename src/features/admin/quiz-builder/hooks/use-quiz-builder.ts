"use client"

// ─────────────────────────────────────────────────────────────
// Quiz Builder — TanStack Query Hooks
// ─────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    quizBuilderApi,
    type QuestionBankFilters,
} from "../services/quiz-builder-api"
import type {
    CreateQuestionPayload,
    UpdateQuestionPayload,
    AddQuestionsToQuizPayload,
    ReorderQuestionsPayload,
    CreateQuizPayload,
    BulkCreateQuestionsPayload,
} from "../types"

// ── Keys ──────────────────────────────────────────────────────

export const quizBuilderKeys = {
    all: ["quiz-builder"] as const,
    courseSections: () => [...quizBuilderKeys.all, "course-sections"] as const,
    questionBank: (filters?: QuestionBankFilters) =>
        [...quizBuilderKeys.all, "question-bank", filters ?? {}] as const,
    quiz: (sectionId: string) =>
        [...quizBuilderKeys.all, "quiz", sectionId] as const,
    quizQuestions: (quizId: string) =>
        [...quizBuilderKeys.all, "quiz-questions", quizId] as const,
}

// ── Course/Section selectors ──────────────────────────────────

export function useCourseSections() {
    return useQuery({
        queryKey: quizBuilderKeys.courseSections(),
        queryFn: quizBuilderApi.getCourseSections,
        staleTime: 5 * 60 * 1000,
    })
}

// ── Question Bank ─────────────────────────────────────────────

export function useQuestionBank(filters?: QuestionBankFilters) {
    return useQuery({
        queryKey: quizBuilderKeys.questionBank(filters),
        queryFn: () => quizBuilderApi.getQuestionBank(filters),
    })
}

export function useCreateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateQuestionPayload) =>
            quizBuilderApi.createQuestion(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            toast.success("Question created")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create question")
        },
    })
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: UpdateQuestionPayload) =>
            quizBuilderApi.updateQuestion(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            toast.success("Question updated")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update question")
        },
    })
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (questionId: string) =>
            quizBuilderApi.deleteQuestion(questionId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            toast.success("Question deleted")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete question")
        },
    })
}

export function useDuplicateQuestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (questionId: string) =>
            quizBuilderApi.duplicateQuestion(questionId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            toast.success("Question duplicated")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to duplicate question")
        },
    })
}

export function useBulkCreateQuestions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: BulkCreateQuestionsPayload) =>
            quizBuilderApi.bulkCreateQuestions(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            toast.success(
                data.created === 1
                    ? "1 question imported"
                    : `${data.created} questions imported`
            )
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to import questions")
        },
    })
}

export function useParseQuestions() {
    return useMutation({
        mutationFn: (text: string) => quizBuilderApi.parseQuestions(text),
        onError: (error: Error) => {
            toast.error(error.message || "Failed to parse questions")
        },
    })
}

export function useExtractQuestions() {
    return useMutation({
        mutationFn: (file: File) => quizBuilderApi.extractQuestions(file),
        onError: (error: Error) => {
            toast.error(error.message || "Failed to extract questions from PDF")
        },
    })
}

export function useImportPdfToQuiz() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: { quizId: string; file: File; selectedIndices: number[] }) =>
            quizBuilderApi.importPdfToQuiz(payload.quizId, payload.file, payload.selectedIndices),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: quizBuilderKeys.quizQuestions(variables.quizId),
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "question-bank"],
            })
            toast.success(`${_data.total} question(s) imported from PDF`)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to import PDF questions")
        },
    })
}

// ── Quiz ──────────────────────────────────────────────────────

export function useQuizForSection(sectionId: string | null) {
    return useQuery({
        queryKey: quizBuilderKeys.quiz(sectionId ?? ""),
        queryFn: () => quizBuilderApi.getOrCreateQuiz(sectionId!),
        enabled: !!sectionId,
    })
}

export function useCreateQuiz() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateQuizPayload) =>
            quizBuilderApi.createQuiz(payload),
        onSuccess: (data, variables) => {
            // Immediately set the quiz data so the UI updates instantly
            queryClient.setQueryData(
                quizBuilderKeys.quiz(variables.sectionId),
                data
            )
            // Also invalidate for a background refetch to ensure freshness
            queryClient.invalidateQueries({
                queryKey: quizBuilderKeys.quiz(variables.sectionId),
            })
            toast.success("Quiz created")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create quiz")
        },
    })
}

export function useToggleQuizPublish() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ quizId, isPublished }: { quizId: string; isPublished: boolean }) =>
            quizBuilderApi.togglePublish(quizId, isPublished),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz"],
            })
            toast.success(variables.isPublished ? "Quiz published" : "Quiz unpublished")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to toggle publish")
        },
    })
}

// ── Quiz Questions ────────────────────────────────────────────

export function useQuizQuestions(quizId: string | null) {
    return useQuery({
        queryKey: quizBuilderKeys.quizQuestions(quizId ?? ""),
        queryFn: () => quizBuilderApi.getQuizQuestions(quizId!),
        enabled: !!quizId,
    })
}

export function useAddQuestionsToQuiz() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: AddQuestionsToQuizPayload) =>
            quizBuilderApi.addQuestionsToQuiz(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: quizBuilderKeys.quizQuestions(variables.quizId),
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz"],
            })
            toast.success(`${_data.added} question(s) added to quiz`)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add questions")
        },
    })
}

export function useRemoveQuestionFromQuiz() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ quizId, quizQuestionId }: { quizId: string; quizQuestionId: string }) =>
            quizBuilderApi.removeQuestionFromQuiz(quizId, quizQuestionId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz-questions"],
            })
            queryClient.invalidateQueries({
                queryKey: [...quizBuilderKeys.all, "quiz"],
            })
            toast.success("Question removed from quiz")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to remove question")
        },
    })
}

export function useReorderQuestions() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ReorderQuestionsPayload) =>
            quizBuilderApi.reorderQuestions(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: quizBuilderKeys.quizQuestions(variables.quizId),
            })
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to reorder questions")
        },
    })
}
