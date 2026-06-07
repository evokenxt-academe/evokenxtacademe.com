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
    staleTime: 5 * 60 * 1000, // 5 min — match global config
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60_000, // keep live data fresh in background
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useStreamDetail(streamId: string) {
  return useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => getStreamById(streamId),
    enabled: !!streamId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
}
