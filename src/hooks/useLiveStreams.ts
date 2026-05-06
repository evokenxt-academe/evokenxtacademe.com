"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getStudentLiveStreams, getStreamById } from "@/lib/supabase/live-stream-queries";
import { useLiveStreamsRealtime } from "./useStreamRealtime";

export function useLiveStreamsList() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["live-streams"] });
  }, [queryClient]);

  useLiveStreamsRealtime(invalidate);

  return useQuery({
    queryKey: ["live-streams"],
    queryFn: () => getStudentLiveStreams(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useStreamDetail(streamId: string) {
  return useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => getStreamById(streamId),
    enabled: !!streamId,
    staleTime: 10_000,
  });
}
