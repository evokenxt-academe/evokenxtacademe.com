/**
 * Bridge layer between old API (sections) and new schema (chapters)
 * Allows gradual migration without breaking existing features
 */

import { createClient as createServerClient } from "@/utils/supabase/server";
import { getPublishedCourses } from "@/lib/supabase/queries";
import type { CourseWithDetails } from "@/types/database-v2.types";

/**
 * Fetch published courses using the new query layer
 * Maps v2 schema (chapters) to v1 response format (sections)
 */
export async function fetchPublishedCoursesV2(): Promise<CourseWithDetails[]> {
  const supabase = await createServerClient();
  const { data: courses, error } = await getPublishedCourses(supabase, {
    limit: 50,
  });

  if (error || !courses) {
    throw new Error(error || "Failed to fetch courses");
  }

  return courses;
}

/**
 * Adapter to convert v2 course structure to v1 API format
 * Maps chapters → sections while preserving lecture data
 */
export function adaptCourseV2toV1(course: CourseWithDetails): any {
  return {
    ...course,
    // Legacy alias: map chapters to sections for backward compatibility
    sections:
      course.chapters?.map((chapter) => ({
        id: chapter.id,
        course_id: chapter.course_id,
        title: chapter.title,
        position: chapter.sort_order || 0,
        lectures: chapter.lectures || [],
      })) || [],
  };
}
