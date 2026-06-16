"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAllQuizzes, getQuizById, getQuizDashboardStats, getQuizTypeDistribution, getQuizAttempts, getDailyQuizAttempts } from "@/lib/supabase/queries/quizzes";
import { toast } from "sonner";
import { useEffect } from "react";
import { subscribeToTable } from "@/lib/supabase/realtime";

export function useQuizzes(filters?: {
  search?: string;
  program?: string;
  type?: string;
  status?: string;
  courseId?: string;
  chapterId?: string;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["quizzes", filters],
    queryFn: () => getAllQuizzes(supabase, filters),
  });

  // Realtime subscription
  useEffect(() => {
    const channelId = `quizzes-admin-${Math.random().toString(36).substring(2, 9)}`;
    const channel = subscribeToTable(supabase, channelId, "quizzes", () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    });
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  return query;
}

export function useQuiz(quizId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizById(supabase, quizId),
    enabled: !!quizId,
  });
}

export function useQuizStats() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["quiz-stats"],
    queryFn: () => getQuizDashboardStats(supabase),
  });
}

export function useQuizTypeDistribution() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["quiz-type-distribution"],
    queryFn: () => getQuizTypeDistribution(supabase),
  });
}

export function useQuizAttempts(quizId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["quiz-attempts", quizId],
    queryFn: () => getQuizAttempts(supabase, quizId),
    enabled: !!quizId,
  });
}

export function usePublishQuiz() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("quizzes").update({ is_published: published }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, published }) => {
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });
      const prev = queryClient.getQueryData(["quizzes"]);
      queryClient.setQueryData(["quizzes"], (old: any) =>
        old?.map((q: any) => (q.id === id ? { ...q, is_published: published } : q))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["quizzes"], context?.prev);
      toast.error("Failed to update quiz status");
    },
    onSuccess: (_, { published }) => {
      toast.success(published ? "Quiz published" : "Quiz unpublished");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useDeleteQuiz() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });
      const prev = queryClient.getQueryData(["quizzes"]);
      queryClient.setQueryData(["quizzes"], (old: any) => old?.filter((q: any) => q.id !== id));
      return { prev };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["quizzes"], context?.prev);
      toast.error("Failed to delete quiz");
    },
    onSuccess: () => { toast.success("Quiz deleted"); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["quizzes"] }); },
  });
}

export function useUpdateQuiz() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("quizzes").update({ ...data }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });
      const prev = queryClient.getQueryData(["quizzes"]);
      queryClient.setQueryData(["quizzes"], (old: any) =>
        old?.map((q: any) => (q.id === id ? { ...q, ...data } : q))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["quizzes"], context?.prev);
      toast.error("Failed to update quiz settings");
    },
    onSuccess: () => {
      toast.success("Quiz settings saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useQuizRanking(quizId: string) {
  return useQuery({
    queryKey: ["quiz-ranking", quizId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tests/${quizId}/ranking`);
      if (!res.ok) throw new Error("Failed to fetch ranking");
      return res.json();
    },
    enabled: !!quizId,
  });
}

export function useDailyQuizAttempts() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["daily-quiz-attempts"],
    queryFn: () => getDailyQuizAttempts(supabase),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
