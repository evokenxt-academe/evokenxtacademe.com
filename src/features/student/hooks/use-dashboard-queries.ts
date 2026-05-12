"use client";

/**
 * TanStack Query hooks for student dashboard pages.
 *
 * These hooks use stable query keys and the global QueryClient config
 * (staleTime: 5 min, gcTime: 10 min, refetchOnMount: false) so that
 * tab switching between Home / Learn / Live / Profile is instant —
 * cached data is shown immediately, no skeleton flash.
 */

import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/app/dashboard/_lib/dashboard-data";
import type { MyCourseRow } from "@/app/dashboard/my-courses/_lib/my-courses-data";

// ── Query keys ──────────────────────────────────────────────────────
// Stable, consistent keys so TanStack Query hits cache correctly.

export const dashboardKeys = {
  home: ["student", "dashboard"] as const,
  myCourses: ["student", "my-courses"] as const,
  profile: ["student", "profile"] as const,
  liveStreams: ["live-streams"] as const,
} as const;

// ── Dashboard Home ──────────────────────────────────────────────────

export function useStudentDashboard(initialData?: DashboardData) {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.home,
    queryFn: async () => {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    initialData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// ── My Courses (Learn tab) ──────────────────────────────────────────

export function useStudentMyCourses(initialData?: MyCourseRow[]) {
  return useQuery<MyCourseRow[]>({
    queryKey: dashboardKeys.myCourses,
    queryFn: async () => {
      const res = await fetch("/api/student/my-courses");
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
    initialData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
