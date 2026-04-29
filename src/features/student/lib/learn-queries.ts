import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  CourseWithContent,
  LectureProgressRecord,
} from "@/features/student/types/learn";

// ─── Fetch full course content (sections → lectures → resources) ──

export async function getCourseContent(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<CourseWithContent | null> {
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
    .maybeSingle();

  if (error) {
    console.error("[learn-queries] getCourseContent:", error.message);
    return null;
  }

  if (!data) return null;

  // Sort sections by position, then sort lectures within each section
  const course = data as unknown as CourseWithContent;
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

// ─── Fetch course by slug (to resolve slug → id) ──────────────────

export async function getCourseIdBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[learn-queries] getCourseIdBySlug:", error.message);
    return null;
  }

  return (data as { id: string } | null)?.id ?? null;
}

// ─── Fetch lecture progress for the entire course ──────────────────

export async function getCourseLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureIds: string[],
): Promise<LectureProgressRecord[]> {
  if (lectureIds.length === 0) return [];

  const { data, error } = await supabase
    .from("lecture_progress")
    .select("lecture_id, is_completed, watched_seconds, last_watched_at")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  if (error) {
    console.error("[learn-queries] getCourseLectureProgress:", error.message);
    return [];
  }

  return (data ?? []) as LectureProgressRecord[];
}

// ─── Mark a lecture as completed (upsert) ──────────────────────────

export async function upsertLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureId: string,
  isCompleted: boolean,
  watchedSeconds?: number,
): Promise<boolean> {
  const payload = {
    user_id: userId,
    lecture_id: lectureId,
    is_completed: isCompleted,
    watched_seconds: watchedSeconds ?? 0,
    last_watched_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SDK upsert type inference bug
  const { error } = await (supabase.from("lecture_progress") as any)
    .upsert(payload, { onConflict: "user_id,lecture_id" });

  if (error) {
    console.error("[learn-queries] upsertLectureProgress:", error.message);
    return false;
  }

  return true;
}
