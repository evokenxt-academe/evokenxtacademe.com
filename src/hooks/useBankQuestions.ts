"use client";

import { useQuery, useQueryClient, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getBankQuestions, getBankDashboardStats, verifyBankQuestion } from "@/lib/supabase/queries/bank";
import { useEffect } from "react";
import { subscribeToTable } from "@/lib/supabase/realtime";
import { toast } from "sonner";

export function useBankQuestions(filters?: {
  subject_id?: string; topic_id?: string; sub_topic_id?: string;
  type?: string; difficulty?: string; verified?: string; search?: string;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["bank-questions", filters],
    queryFn: ({ pageParam = 0 }) => getBankQuestions(supabase, { ...filters, offset: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const total = allPages.reduce((s, p) => s + p.data.length, 0);
      return total < lastPage.count ? total : undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    const channelId = `bank-questions-admin-${Math.random().toString(36).substring(2, 9)}`;
    const channel = subscribeToTable(supabase, channelId, "bank_questions", () => {
      queryClient.invalidateQueries({ queryKey: ["bank-questions"] });
    });
    return () => { supabase.removeChannel(channel); };
  }, [supabase, queryClient]);

  return query;
}

export function useBankStats(subjectId?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["bank-stats", subjectId],
    queryFn: () => getBankDashboardStats(supabase, subjectId),
  });
}

export function useVerifyBankQuestion() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      await verifyBankQuestion(supabase, id, verified);
    },
    onSuccess: () => {
      toast.success("Verification status updated");
      queryClient.invalidateQueries({ queryKey: ["bank-questions"] });
    },
    onError: () => { toast.error("Failed to update verification"); },
  });
}
