"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getQuestionsByQuizId, saveQuestion, deleteQuestion as deleteQ, reorderQuestions as reorderQ, batchInsertQuestions, addQuestionsFromBank } from "@/lib/supabase/queries/questions";
import type { QuestionFormData } from "@/types/quiz";
import { toast } from "sonner";
import { useEffect } from "react";
import { subscribeToRow } from "@/lib/supabase/realtime";

export function useQuestions(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["questions", quizId],
    queryFn: () => getQuestionsByQuizId(supabase, quizId),
    enabled: !!quizId,
  });

  useEffect(() => {
    if (!quizId) return;
    const channelId = `quiz-questions-${quizId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = subscribeToRow(supabase, channelId, "questions", "quiz_id", quizId, () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    });
    return () => { supabase.removeChannel(channel); };
  }, [supabase, quizId, queryClient]);

  return query;
}

export function useSaveQuestion(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, data }: { questionId: string | null; data: QuestionFormData }) => {
      return saveQuestion(supabase, quizId, questionId, data);
    },
    onMutate: async ({ questionId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["questions", quizId] });
      const prev = queryClient.getQueryData(["questions", quizId]);
      queryClient.setQueryData(["questions", quizId], (old: any[] | undefined) => {
        if (!old) return [{ ...data, id: questionId || "temp", quiz_id: quizId, options: data.options || [] }];
        if (questionId) return old.map((q) => (q.id === questionId ? { ...q, ...data } : q));
        return [...old, { ...data, id: "temp", quiz_id: quizId, position: old.length + 1, options: data.options || [] }];
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["questions", quizId], context?.prev);
      toast.error("Failed to save question");
    },
    onSuccess: () => { toast.success("Question saved"); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["questions", quizId] }); },
  });
}

export function useDeleteQuestion(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteQ(supabase, questionId),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ["questions", quizId] });
      const prev = queryClient.getQueryData(["questions", quizId]);
      queryClient.setQueryData(["questions", quizId], (old: any[] | undefined) =>
        old?.filter((q) => q.id !== questionId).map((q, i) => ({ ...q, position: i + 1 }))
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["questions", quizId], context?.prev);
      toast.error("Failed to delete question");
    },
    onSuccess: () => { toast.success("Question deleted"); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["questions", quizId] }); },
  });
}

export function useReorderQuestions(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderQ(supabase, quizId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ["questions", quizId] });
      const prev = queryClient.getQueryData(["questions", quizId]);
      queryClient.setQueryData(["questions", quizId], (old: any[] | undefined) => {
        if (!old) return old;
        return orderedIds.map((id, i) => {
          const q = old.find((q) => q.id === id);
          return q ? { ...q, position: i + 1 } : null;
        }).filter(Boolean);
      });
      return { prev };
    },
    onError: (_err, _ids, context) => {
      queryClient.setQueryData(["questions", quizId], context?.prev);
      toast.error("Failed to reorder questions");
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["questions", quizId] }); },
  });
}

export function useBatchInsertQuestions(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questions: QuestionFormData[]) => batchInsertQuestions(supabase, quizId, questions),
    onSuccess: (result) => {
      toast.success(`${result.inserted} questions imported`);
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    },
    onError: () => { toast.error("Failed to import questions"); },
  });
}

export function useAddFromBank(quizId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bankIds: string[]) => addQuestionsFromBank(supabase, quizId, bankIds),
    onSuccess: (result) => {
      toast.success(`${result.inserted} questions added from Question Bank`);
      queryClient.invalidateQueries({ queryKey: ["questions", quizId] });
    },
    onError: () => { toast.error("Failed to add questions from bank"); },
  });
}
