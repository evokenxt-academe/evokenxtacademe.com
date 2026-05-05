import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  CourseWithContent,
  LectureProgressRecord,
} from "@/features/student/types/learn";

// ─── Fetch full course content (chapters → lectures → resources) ──

export async function getCourseContent(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<CourseWithContent | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, title, slug, description, thumbnail_url, language,
       chapters (
         id, title, position,
         lectures (
           id, title, description, duration_sec, yt_video_id, video_provider, position, is_preview,
           resources:lecture_resources ( id, lecture_id, title, file_url, file_type, file_size_kb, position )
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

  // Sort chapters by position, then sort lectures within each chapter
  const course = data as unknown as CourseWithContent;
  course.chapters = (course.chapters ?? [])
    .sort((a, b) => a.position - b.position)
    .map((chapter) => ({
      ...chapter,
      lectures: (chapter.lectures ?? [])
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          ...l,
          resources: (l.resources ?? []).sort(
            (x, y) => (x.position ?? 0) - (y.position ?? 0),
          ),
        })),
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
    .select("lecture_id, is_completed, watched_seconds, resume_at_seconds, last_watched_at")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  if (error) {
    console.error("[learn-queries] getCourseLectureProgress:", error.message);
    return [];
  }

  return (data ?? []) as LectureProgressRecord[];
}

// ─── Update lecture progress (upsert) ──────────────────────────────

export async function upsertLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureId: string,
  isCompleted: boolean,
  watchedSeconds?: number,
  resumeAtSeconds?: number,
): Promise<boolean> {
  const payload = {
    user_id: userId,
    lecture_id: lectureId,
    is_completed: isCompleted,
    watched_seconds: watchedSeconds ?? 0,
    resume_at_seconds: resumeAtSeconds ?? watchedSeconds ?? 0,
    last_watched_at: new Date().toISOString(),
    completed_at: isCompleted ? new Date().toISOString() : null,
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
