"use client";

import { useMemo, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import {
  createAttempt,
  fetchAttempt,
  fetchAttemptResult,
  fetchEnrolledQuizzes,
  fetchQuiz,
  fetchQuizInsights,
  fetchStudentQuizzes,
  fetchStudentTestAnalytics,
  saveAnswer,
  submitAttempt,
} from "@/features/tests/api";
import type {
  AdminQuizListItem,
  AdminRankingEntry,
  QuizSummaryItem,
  StudentAttemptAnalytics,
  TestDashboardStats,
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
      void queryClient.invalidateQueries({ queryKey: ["tests", "analytics"] });
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

// ── Analytics & Stats Hooks ───────────────────────────────────

export function useTestAnalytics() {
  return useQuery({
    queryKey: ["tests", "analytics"],
    queryFn: fetchStudentTestAnalytics,
    staleTime: 60_000,
  });
}

export function useTestStats(
  quizzes: QuizSummaryItem[],
  attempts: StudentAttemptAnalytics[],
): TestDashboardStats {
  return useMemo(() => {
    const totalTests = quizzes.length;
    const completedTests = quizzes.filter((q) => q.status === "completed").length;

    const submittedAttempts = attempts.filter(
      (a) => a.status === "submitted" || a.status === "timed_out",
    );

    const avgScore =
      submittedAttempts.length > 0
        ? Math.round(
            submittedAttempts.reduce((sum, a) => sum + a.percentage, 0) /
              submittedAttempts.length,
          )
        : 0;

    const bestScore =
      submittedAttempts.length > 0
        ? Math.max(...submittedAttempts.map((a) => a.percentage))
        : 0;

    return {
      totalTests,
      completedTests,
      averageScore: avgScore,
      bestScore,
    };
  }, [quizzes, attempts]);
}

// ── Realtime Subscription Hook ────────────────────────────────

export function useRealtimeAttempts() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["tests", "student-quizzes"] });
    void queryClient.invalidateQueries({ queryKey: ["tests", "analytics"] });
  }, [queryClient]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("test-dashboard-attempts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quiz_attempts",
        },
        () => invalidate(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quiz_attempts",
        },
        () => invalidate(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidate]);
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
