"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { CourseContent, ProgressMap } from "../types";

// ─── Fetch course content with sections → lectures → resources ────

async function fetchCourseContent(courseId: string): Promise<CourseContent> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .select(
      `*,
       sections (
         *,
         lectures (
           *,
           resources (*)
         )
       )`
    )
    .eq("id", courseId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Course not found");

  // Sort sections by position, then lectures within each section
  const course = data as unknown as CourseContent;
  course.sections = (course.sections ?? [])
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      ...section,
      lectures: (section.lectures ?? []).sort(
        (a, b) => a.position - b.position
      ),
    }));

  return course;
}

export function useCourseContent(courseId: string) {
  return useQuery<CourseContent>({
    queryKey: ["course-content", courseId],
    queryFn: () => fetchCourseContent(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ─── Fetch lecture progress for the current user ──────────────────

async function fetchLectureProgress(
  courseId: string
): Promise<ProgressMap> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  // First get all lecture IDs in this course
  const { data: sections } = await supabase
    .from("sections")
    .select("lectures(id)")
    .eq("course_id", courseId);

  if (!sections) return {};

  const lectureIds = sections.flatMap((s: any) =>
    (s.lectures ?? []).map((l: any) => l.id)
  );
  if (lectureIds.length === 0) return {};

  const { data: progress } = await supabase
    .from("lecture_progress")
    .select("lecture_id, is_completed, watched_seconds, last_watched_at")
    .eq("user_id", user.id)
    .in("lecture_id", lectureIds);

  if (!progress) return {};

  const map: ProgressMap = {};
  for (const p of progress) {
    map[p.lecture_id] = {
      is_completed: p.is_completed,
      watched_seconds: p.watched_seconds,
      last_watched_at: p.last_watched_at,
    };
  }
  return map;
}

export function useLectureProgress(courseId: string) {
  return useQuery<ProgressMap>({
    queryKey: ["lecture-progress", courseId],
    queryFn: () => fetchLectureProgress(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}
