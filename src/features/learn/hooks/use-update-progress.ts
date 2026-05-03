"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { ProgressPayload } from "../types";

export function useUpdateProgress(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProgressPayload) => {
      const res = await fetch(`/api/student/lectures/${payload.lecture_id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: payload.is_completed,
          watchedSeconds: payload.watched_seconds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update progress");
      }
    },
    onSuccess: () => {
      // Invalidate progress cache to refetch updated progress
      queryClient.invalidateQueries({
        queryKey: ["lecture-progress", courseId],
      });
    },
    // Silently fail progress updates — they're not critical
    onError: (err) => {
      console.error("[useUpdateProgress]", err.message);
    },
  });
}
