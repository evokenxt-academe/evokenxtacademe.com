"use client";

import { useQuery } from "@tanstack/react-query";

import type { LiveStreamPayload, LiveStreamSummary } from "@/features/live-stream/types";

async function fetchLiveStream(courseId: string): Promise<LiveStreamPayload> {
  const response = await fetch(
    `/api/student/live-stream?courseId=${encodeURIComponent(courseId)}`,
    { credentials: "include", cache: "no-store" },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<LiveStreamPayload>;
}

export function useCourseLiveStatus(courseId: string | null) {
  const query = useQuery({
    queryKey: ["course-live-status", courseId],
    enabled: Boolean(courseId),
    queryFn: () => fetchLiveStream(courseId!),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const liveStream: LiveStreamSummary | null =
    query.data?.currentStream?.status === "live"
      ? query.data.currentStream
      : null;

  return {
    liveStream,
    isLive: Boolean(liveStream),
    isLoading: query.isLoading,
    error: query.error,
  };
}
