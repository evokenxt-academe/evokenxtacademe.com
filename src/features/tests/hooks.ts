"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttempt,
  fetchAttempt,
  fetchAttemptResult,
  fetchEnrolledQuizzes,
  fetchQuiz,
  fetchQuizInsights,
  fetchStudentQuizzes,
  saveAnswer,
  submitAttempt,
} from "@/features/tests/api";
import type {
  AdminQuizListItem,
  AdminRankingEntry,
} from "@/features/tests/types";

// ── Student Hooks ─────────────────────────────────────────────

export function useStudentQuizzes() {
  return useQuery({
    queryKey: ["tests", "student-quizzes"],
    queryFn: fetchStudentQuizzes,
  });
}

export function useQuizzes() {
  return useQuery({
    queryKey: ["tests", "quizzes"],
    queryFn: fetchEnrolledQuizzes,
  });
}

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ["tests", "quiz", quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: Boolean(quizId),
    staleTime: 60_000,
  });
}

export function useAttempt(quizId: string) {
  return useQuery({
    queryKey: ["tests", "attempt", quizId],
    queryFn: () => fetchAttempt(quizId),
    enabled: Boolean(quizId),
    refetchOnWindowFocus: false,
  });
}

export function useCreateAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => createAttempt(quizId),
    onSuccess: (_result, quizId) => {
      void queryClient.invalidateQueries({ queryKey: ["tests", "attempt", quizId] });
      void queryClient.invalidateQueries({ queryKey: ["tests", "quizzes"] });
    },
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: saveAnswer,
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitAttempt,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: ["tests", "attempt", result.quizId],
      });
      void queryClient.invalidateQueries({ queryKey: ["tests", "quizzes"] });
      void queryClient.invalidateQueries({
        queryKey: ["tests", "result", result.attemptId],
      });
    },
  });
}

export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: ["tests", "result", attemptId],
    queryFn: () => fetchAttemptResult(attemptId),
    enabled: Boolean(attemptId),
    staleTime: 60_000,
  });
}

export function useQuizInsights(quizId: string) {
  return useQuery({
    queryKey: ["tests", "quiz-insights", quizId],
    queryFn: () => fetchQuizInsights(quizId),
    enabled: Boolean(quizId),
    staleTime: 60_000,
  });
}

// ── Admin Hooks ───────────────────────────────────────────────

async function fetchAdminQuizList(): Promise<AdminQuizListItem[]> {
  const res = await fetch("/api/admin/tests", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Failed to load quizzes.");
  return payload.quizzes ?? [];
}

export function useAdminQuizList() {
  return useQuery({
    queryKey: ["admin", "quizzes"],
    queryFn: fetchAdminQuizList,
    staleTime: 30_000,
  });
}

async function fetchAdminQuizRanking(quizId: string): Promise<AdminRankingEntry[]> {
  const res = await fetch(`/api/admin/tests/${quizId}/ranking`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Failed to load ranking.");
  return payload.ranking ?? [];
}

export function useAdminQuizRanking(quizId: string | null) {
  return useQuery({
    queryKey: ["admin", "quiz-ranking", quizId],
    queryFn: () => fetchAdminQuizRanking(quizId!),
    enabled: Boolean(quizId),
    staleTime: 30_000,
  });
}
