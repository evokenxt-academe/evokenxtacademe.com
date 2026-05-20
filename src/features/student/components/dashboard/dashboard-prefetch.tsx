"use client";

/**
 * DashboardPrefetch — Warms the TanStack Query cache for critical
 * dashboard queries on mount so tab switching is instant.
 *
 * This component renders nothing visible — it just seeds the cache
 * with the server-fetched profile data and triggers a background
 * prefetch for live streams.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/student/hooks/use-dashboard-queries";

interface DashboardPrefetchProps {
  userId: string;
  /** Profile data from the server layout fetch */
  profile: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: string | null;
  };
}

export function DashboardPrefetch({ userId, profile }: DashboardPrefetchProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Seed profile data into cache so Profile tab renders instantly
    queryClient.setQueryData(dashboardKeys.profile, profile);

    // Prefetch dashboard home data if not already cached
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.home,
      queryFn: async () => {
        const res = await fetch("/api/student/dashboard");
        if (!res.ok) throw new Error("Failed to prefetch dashboard");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch my-courses data if not already cached
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.myCourses,
      queryFn: async () => {
        const res = await fetch("/api/student/my-courses");
        if (!res.ok) throw new Error("Failed to prefetch courses");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, userId, profile]);

  return null;
}
