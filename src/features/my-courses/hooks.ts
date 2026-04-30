// ─────────────────────────────────────────────────────────
// My Courses — TanStack Query Hook
// ─────────────────────────────────────────────────────────

"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchMyCourses } from "./api";
import type { MyCourse } from "./types";

export const myCoursesKeys = {
  all: ["my-courses"] as const,
} as const;

/**
 * `useMyCourses` — fetches enrolled courses with progress.
 *
 * - Caches for 30 s (staleTime)
 * - Re-fetches when the browser tab regains focus
 * - Error / loading / data states exposed via return value
 */
export function useMyCourses(
  options?: Omit<UseQueryOptions<MyCourse[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery<MyCourse[], Error>({
    queryKey: myCoursesKeys.all,
    queryFn: fetchMyCourses,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}
