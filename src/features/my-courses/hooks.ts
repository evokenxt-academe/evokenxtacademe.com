"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import * as api from "./api";
import type { MyCourse } from "./types";

export const myCoursesKeys = {
    all: ["my-courses"] as const,
} as const;

export function useMyCourses(
    options?: Omit<UseQueryOptions<MyCourse[], Error>, "queryKey" | "queryFn">
) {
    return useQuery<MyCourse[], Error>({
        queryKey: myCoursesKeys.all,
        queryFn: api.fetchMyCourses,
        staleTime: 30_000,
        ...options,
    });
}
