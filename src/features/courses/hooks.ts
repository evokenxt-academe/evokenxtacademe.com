"use client";

/**
 * Course Feature — TanStack Query Hooks
 *
 * Every hook follows the pattern:
 * - useSomething() for reads (useQuery)
 * - useSomethingMutation() for writes (useMutation + invalidation)
 *
 * Query keys are centralized for consistency.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import * as api from "./api";
import type { CatalogCourse } from "@/lib/supabase/queries";
import type {
  CourseWithCurriculum,
  CourseRow,
  SectionRow,
  LectureRow,
  CreateCoursePayload,
  UpdateCoursePayload,
  AddSectionPayload,
  UpdateSectionPayload,
  AddLecturePayload,
  UpdateLecturePayload,
  AddResourcePayload,
  PositionUpdate,
} from "./types";

// ─────────────────────────────────────────────────────────
// Query Keys (centralized for consistency)
// ─────────────────────────────────────────────────────────

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  catalog: () => [...courseKeys.all, "catalog"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
  slug: (slug: string) => [...courseKeys.all, "slug", slug] as const,
  sections: (courseId: string) =>
    [...courseKeys.all, courseId, "sections"] as const,
  lectures: (sectionId: string) =>
    [...courseKeys.all, "lectures", sectionId] as const,
} as const;

// ─────────────────────────────────────────────────────────
// READ — Course
// ─────────────────────────────────────────────────────────

/**
 * Fetch a single course with full curriculum tree (sections → lectures → resources).
 */
export function useCourse(
  courseId: string,
  options?: Omit<
    UseQueryOptions<CourseWithCurriculum, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<CourseWithCurriculum, Error>({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => api.fetchCourseWithCurriculum(courseId),
    enabled: !!courseId,
    staleTime: 30_000, // 30s — curriculum doesn't change often
    ...options,
  });
}

/**
 * Fetch a course by slug (for public-facing routes).
 */
export function useCourseBySlug(
  slug: string,
  options?: Omit<
    UseQueryOptions<CourseWithCurriculum, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<CourseWithCurriculum, Error>({
    queryKey: courseKeys.slug(slug),
    queryFn: () => api.fetchCourseBySlug(slug),
    enabled: !!slug,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Fetch the full course list (without curriculum tree).
 */
export function useCourses(
  options?: Omit<UseQueryOptions<CourseRow[], Error>, "queryKey" | "queryFn">
) {
  return useQuery<CourseRow[], Error>({
    queryKey: courseKeys.lists(),
    queryFn: api.fetchCourses,
    staleTime: 60_000, // 1 min
    ...options,
  });
}

/**
 * Fetch public published catalog courses with joins for cards.
 */
export function usePublishedCatalogCourses(
  options?: Omit<
    UseQueryOptions<CatalogCourse[], Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<CatalogCourse[], Error>({
    queryKey: courseKeys.catalog(),
    queryFn: api.fetchPublishedCatalogCourses,
    staleTime: 60_000,
    refetchInterval: 120_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────
// READ — Sections / Lectures (standalone)
// ─────────────────────────────────────────────────────────

export function useSections(courseId: string) {
  return useQuery<SectionRow[], Error>({
    queryKey: courseKeys.sections(courseId),
    queryFn: () => api.fetchSections(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useLectures(sectionId: string) {
  return useQuery<LectureRow[], Error>({
    queryKey: courseKeys.lectures(sectionId),
    queryFn: () => api.fetchLectures(sectionId),
    enabled: !!sectionId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────
// WRITE — Course
// ─────────────────────────────────────────────────────────

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => api.createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      payload,
    }: {
      courseId: string;
      payload: UpdateCoursePayload;
    }) => api.updateCourse(courseId, payload),

    // Optimistic update — immediately reflect changes in the UI
    onMutate: async ({ courseId, payload }) => {
      await queryClient.cancelQueries({
        queryKey: courseKeys.detail(courseId),
      });

      const previous = queryClient.getQueryData<CourseWithCurriculum>(
        courseKeys.detail(courseId)
      );

      if (previous) {
        queryClient.setQueryData<CourseWithCurriculum>(
          courseKeys.detail(courseId),
          { ...previous, ...payload }
        );
      }

      return { previous, courseId };
    },

    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          courseKeys.detail(context.courseId),
          context.previous
        );
      }
    },

    onSettled: (_data, _err, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => api.deleteCourse(courseId),
    onSuccess: (_data, courseId) => {
      queryClient.removeQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

// ─────────────────────────────────────────────────────────
// WRITE — Sections
// ─────────────────────────────────────────────────────────

export function useAddSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddSectionPayload) => api.addSection(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(payload.course_id),
      });
      queryClient.invalidateQueries({
        queryKey: courseKeys.sections(payload.course_id),
      });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      courseId,
      payload,
    }: {
      sectionId: string;
      courseId: string;
      payload: UpdateSectionPayload;
    }) => api.updateSection(sectionId, payload),
    onSettled: (_data, _err, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
    }: {
      sectionId: string;
      courseId: string;
    }) => api.deleteSection(sectionId),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

/**
 * Reorder sections with optimistic update.
 * Expects the full reordered list as `updates` and the `courseId`.
 */
export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      updates,
    }: {
      updates: PositionUpdate[];
      courseId: string;
    }) => api.reorderSections(updates),

    // Optimistic: apply new positions to the cached course
    onMutate: async ({ updates, courseId }) => {
      await queryClient.cancelQueries({
        queryKey: courseKeys.detail(courseId),
      });

      const previous = queryClient.getQueryData<CourseWithCurriculum>(
        courseKeys.detail(courseId)
      );

      if (previous) {
        const positionMap = new Map(
          updates.map(({ id, position }) => [id, position])
        );

        const reorderedSections = [...previous.sections]
          .map((s) => ({
            ...s,
            position: positionMap.get(s.id) ?? s.position,
          }))
          .sort((a, b) => a.position - b.position);

        queryClient.setQueryData<CourseWithCurriculum>(
          courseKeys.detail(courseId),
          { ...previous, sections: reorderedSections }
        );
      }

      return { previous, courseId };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          courseKeys.detail(context.courseId),
          context.previous
        );
      }
    },

    onSettled: (_data, _err, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────
// WRITE — Lectures
// ─────────────────────────────────────────────────────────

export function useAddLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: AddLecturePayload;
      courseId: string;
    }) => api.addLecture(payload),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

export function useUpdateLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
      payload,
    }: {
      lectureId: string;
      courseId: string;
      payload: UpdateLecturePayload;
    }) => api.updateLecture(lectureId, payload),
    onSettled: (_data, _err, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

export function useDeleteLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
    }: {
      lectureId: string;
      courseId: string;
    }) => api.deleteLecture(lectureId),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

/**
 * Reorder lectures with optimistic update.
 */
export function useReorderLectures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      updates,
    }: {
      updates: PositionUpdate[];
      courseId: string;
      sectionId: string;
    }) => api.reorderLectures(updates),

    onMutate: async ({ updates, courseId, sectionId }) => {
      await queryClient.cancelQueries({
        queryKey: courseKeys.detail(courseId),
      });

      const previous = queryClient.getQueryData<CourseWithCurriculum>(
        courseKeys.detail(courseId)
      );

      if (previous) {
        const positionMap = new Map(
          updates.map(({ id, position }) => [id, position])
        );

        const updatedSections = previous.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const reorderedLectures = [...s.lectures]
            .map((l) => ({
              ...l,
              position: positionMap.get(l.id) ?? l.position,
            }))
            .sort((a, b) => a.position - b.position);
          return { ...s, lectures: reorderedLectures };
        });

        queryClient.setQueryData<CourseWithCurriculum>(
          courseKeys.detail(courseId),
          { ...previous, sections: updatedSections }
        );
      }

      return { previous, courseId };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          courseKeys.detail(context.courseId),
          context.previous
        );
      }
    },

    onSettled: (_data, _err, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────
// WRITE — Resources
// ─────────────────────────────────────────────────────────

export function useAddResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
    }: {
      payload: AddResourcePayload;
      courseId: string;
    }) => api.addResource(payload),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resourceId,
    }: {
      resourceId: string;
      courseId: string;
    }) => api.deleteResource(resourceId),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detail(courseId),
      });
    },
  });
}
