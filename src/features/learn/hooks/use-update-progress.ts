"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { ProgressPayload } from "../types";

async function upsertProgress(payload: ProgressPayload) {
  const supabase = createClient();

  const { error } = await supabase
    .from("lecture_progress")
    .upsert(
      {
        user_id: payload.user_id,
        lecture_id: payload.lecture_id,
        watched_seconds: payload.watched_seconds,
        is_completed: payload.is_completed,
        last_watched_at: payload.last_watched_at,
      },
      { onConflict: "user_id,lecture_id" }
    );

  if (error) throw new Error(error.message);
}

export function useUpdateProgress(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertProgress,
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
