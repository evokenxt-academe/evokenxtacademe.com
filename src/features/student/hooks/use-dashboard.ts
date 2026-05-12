"use client";

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { DashboardPageData } from "@/features/student/types/dashboard";

const DASHBOARD_KEY = ["student", "dashboard"] as const;
const STALE_TIME = 5 * 60 * 1000; // 5 minutes — prevents refetch on tab switch
const GC_TIME = 10 * 60 * 1000; // 10 minutes — keeps data in cache

// ─── Main dashboard data hook ──────────────────────────────────────

export function useDashboardData(initialData: DashboardPageData) {
  return useQuery<DashboardPageData>({
    queryKey: DASHBOARD_KEY,
    queryFn: async () => {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    initialData,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false, // tab switch uses cached data
    refetchOnMount: false, // reuse cache when re-entering page
    placeholderData: keepPreviousData, // keep old data while refetching
  });
}

// ─── Realtime updates hook ─────────────────────────────────────────

export function useRealtimeUpdates(courseIds: string[]) {
  const queryClient = useQueryClient();
  const courseIdsRef = useRef(courseIds);
  courseIdsRef.current = courseIds;

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
  }, [queryClient]);

  useEffect(() => {
    if (courseIdsRef.current.length === 0) return;

    const supabase = createClient();

    // Subscribe to live_streams changes for enrolled courses
    const liveStreamChannel = supabase
      .channel("dashboard-live-streams")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_streams",
          filter: `course_id=in.(${courseIdsRef.current.join(",")})`,
        },
        () => {
          invalidateDashboard();
        },
      )
      .subscribe();

    // Subscribe to lecture_progress changes for the current user
    const progressChannel = supabase
      .channel("dashboard-progress")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lecture_progress",
        },
        () => {
          invalidateDashboard();
        },
      )
      .subscribe();

    // Subscribe to quiz_attempts changes for real-time quiz performance
    const quizAttemptsChannel = supabase
      .channel("dashboard-quiz-attempts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_attempts",
        },
        () => {
          invalidateDashboard();
        },
      )
      .subscribe();

    // Subscribe to quizzes table for published/unpublished changes
    const quizzesChannel = supabase
      .channel("dashboard-quizzes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quizzes",
        },
        () => {
          invalidateDashboard();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(liveStreamChannel);
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(quizAttemptsChannel);
      supabase.removeChannel(quizzesChannel);
    };
  }, [courseIds, invalidateDashboard]);
}
