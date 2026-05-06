"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import {
  getCourseContent,
  getCourseLectureProgress,
  upsertLectureProgress,
} from "@/features/student/lib/learn-queries";
import type {
  CourseWithContent,
  LectureProgressRecord,
  ProgressMap,
} from "@/features/student/types/learn";
import { useMemo } from "react";

// ─── useCourseContent ──────────────────────────────────────────────

export function useCourseContent(courseId: string | null) {
  const supabase = createClient();

  return useQuery<CourseWithContent | null>({
    queryKey: ["course-content", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      return getCourseContent(supabase, courseId);
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// ─── useLectureProgress ────────────────────────────────────────────

export function useLectureProgress(
  userId: string | null,
  lectureIds: string[],
) {
  const supabase = createClient();

  const query = useQuery<LectureProgressRecord[]>({
    queryKey: ["lecture-progress", userId, lectureIds.length],
    queryFn: async () => {
      if (!userId || lectureIds.length === 0) return [];
      return getCourseLectureProgress(supabase, userId, lectureIds);
    },
    enabled: !!userId && lectureIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Build a progress map for O(1) lookup
  const progressMap: ProgressMap = useMemo(() => {
    const map = new Map<string, LectureProgressRecord>();
    if (query.data) {
      for (const record of query.data) {
        map.set(record.lecture_id, record);
      }
    }
    return map;
  }, [query.data]);

  return { ...query, progressMap };
}

// ─── useUpdateProgress ─────────────────────────────────────────────

export function useUpdateProgress(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lectureId,
      isCompleted,
      watchedSeconds,
      resumeAtSeconds,
    }: {
      lectureId: string;
      isCompleted: boolean;
      watchedSeconds?: number;
      resumeAtSeconds?: number;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      
      const res = await fetch(`/api/student/lectures/${lectureId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted,
          watchedSeconds,
          resumeAtSeconds,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update progress");
      }

      return { lectureId, isCompleted, watchedSeconds, resumeAtSeconds };
    },
    onSuccess: () => {
      // Invalidate progress queries so UI reflects the change
      queryClient.invalidateQueries({ queryKey: ["lecture-progress"] });
    },
  });
}
