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
