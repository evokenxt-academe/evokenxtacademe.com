/**
 * Progress Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for lecture progress, watch hours, and course completion
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  LectureProgress,
  WatchHoursDaily,
  CourseProgress,
  Lecture,
  Chapter,
  Course,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/progress] ${scope}: ${msg}`);
  return msg;
}

// ─── Lecture Progress Queries ──────────────────────────────────────

/**
 * Get progress for a specific lecture
 */
export async function getLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureId: string
): Promise<QueryResult<LectureProgress>> {
  const { data, error } = await supabase
    .from("lecture_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lecture_id", lectureId)
    .maybeSingle();

  const errMsg = handleError("getLectureProgress", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as LectureProgress | null, error: null };
}

/**
 * Get progress for multiple lectures
 */
export async function getLectureProgressBatch(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureIds: string[]
): Promise<QueryResult<LectureProgress[]>> {
  if (lectureIds.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from("lecture_progress")
    .select("*")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  const errMsg = handleError("getLectureProgressBatch", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Get all progress for a user (for dashboard)
 */
export async function getUserProgress(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<(LectureProgress & { 
  lecture: Lecture & { 
    chapter: Chapter & { 
      course: Pick<Course, "id" | "title" | "slug"> 
    } 
  } 
})[]>> {
  const { data, error } = await supabase
    .from("lecture_progress")
    .select(`
      *,
      lecture:lectures!lecture_id(
        *,
        chapter:chapters!chapter_id(
          *,
          course:courses!course_id(id, title, slug)
        )
      )
    `)
    .eq("user_id", userId)
    .order("last_watched_at", { ascending: false });

  const errMsg = handleError("getUserProgress", error);
  if (errMsg) return { data: null, error: errMsg };

  return { 
    data: data as unknown as (LectureProgress & { 
      lecture: Lecture & { 
        chapter: Chapter & { 
          course: Pick<Course, "id" | "title" | "slug"> 
        } 
      } 
    })[], 
    error: null 
  };
}

/**
 * Get recent activity (recently watched lectures)
 */
export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 5
): Promise<QueryResult<(LectureProgress & { 
  lecture: Lecture & { 
    chapter: Chapter & { 
      course: Pick<Course, "id" | "title" | "slug"> 
    } 
  } 
})[]>> {
  const { data, error } = await supabase
    .from("lecture_progress")
    .select(`
      *,
      lecture:lectures!lecture_id(
        *,
        chapter:chapters!chapter_id(
          *,
          course:courses!course_id(id, title, slug)
        )
      )
    `)
    .eq("user_id", userId)
    .not("last_watched_at", "is", null)
    .order("last_watched_at", { ascending: false })
    .limit(limit);

  const errMsg = handleError("getRecentActivity", error);
  if (errMsg) return { data: null, error: errMsg };

  return { 
    data: data as unknown as (LectureProgress & { 
      lecture: Lecture & { 
        chapter: Chapter & { 
          course: Pick<Course, "id" | "title" | "slug"> 
        } 
      } 
    })[], 
    error: null 
  };
}

/**
 * Get next lecture to continue (resume learning)
 */
export async function getNextLecture(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<{ lecture: Lecture; progress: LectureProgress | null } | null>> {
  // Get all chapters and lectures for the course
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select(`
      *,
      lectures:lectures!chapter_id(*)
    `)
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (chaptersError) {
    const errMsg = handleError("getNextLecture:chapters", chaptersError);
    return { data: null, error: errMsg };
  }

  // Flatten lectures with position
  const allLectures: Lecture[] = [];
  for (const chapter of chapters ?? []) {
    const sortedLectures = (chapter.lectures ?? [])
      .filter((l: Lecture) => l.is_published)
      .sort((a: Lecture, b: Lecture) => a.position - b.position);
    allLectures.push(...sortedLectures);
  }

  if (allLectures.length === 0) {
    return { data: null, error: null };
  }

  // Get user progress for these lectures
  const lectureIds = allLectures.map((l) => l.id);
  const { data: progressData, error: progressError } = await supabase
    .from("lecture_progress")
    .select("*")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  if (progressError) {
    const errMsg = handleError("getNextLecture:progress", progressError);
    return { data: null, error: errMsg };
  }

  const progressMap = new Map<string, LectureProgress>();
  for (const p of progressData ?? []) {
    progressMap.set(p.lecture_id, p as LectureProgress);
  }

  // Find the first incomplete lecture
  for (const lecture of allLectures) {
    const progress = progressMap.get(lecture.id);
    if (!progress || !progress.is_completed) {
      return { data: { lecture, progress: progress ?? null }, error: null };
    }
  }

  // All completed, return the last lecture
  const lastLecture = allLectures[allLectures.length - 1];
  return {
    data: { lecture: lastLecture, progress: progressMap.get(lastLecture.id) ?? null },
    error: null,
  };
}

// ─── Course Progress Queries ───────────────────────────────────────

/**
 * Calculate progress for a course
 */
export async function getCourseProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<CourseProgress>> {
  // Get all lectures for the course
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select(`
      lectures:lectures!chapter_id(id, duration_sec, is_published)
    `)
    .eq("course_id", courseId)
    .eq("is_published", true);

  if (chaptersError) {
    const errMsg = handleError("getCourseProgress:chapters", chaptersError);
    return { data: null, error: errMsg };
  }

  // Flatten lectures
  const allLectures: Array<{ id: string; duration_sec: number }> = [];
  for (const chapter of chapters ?? []) {
    const publishedLectures = (chapter.lectures ?? []).filter(
      (l: { is_published: boolean }) => l.is_published
    );
    allLectures.push(...publishedLectures);
  }

  const totalLectures = allLectures.length;
  if (totalLectures === 0) {
    return {
      data: {
        course_id: courseId,
        total_lectures: 0,
        completed_lectures: 0,
        progress_percentage: 0,
        total_watch_seconds: 0,
        last_watched_at: null,
      },
      error: null,
    };
  }

  // Get user progress
  const lectureIds = allLectures.map((l) => l.id);
  const { data: progressData, error: progressError } = await supabase
    .from("lecture_progress")
    .select("lecture_id, is_completed, watched_seconds, last_watched_at")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  if (progressError) {
    const errMsg = handleError("getCourseProgress:progress", progressError);
    return { data: null, error: errMsg };
  }

  const progress = progressData ?? [];
  const completedLectures = progress.filter((p) => p.is_completed).length;
  const totalWatchSeconds = progress.reduce((sum, p) => sum + p.watched_seconds, 0);
  const lastWatchedAt = progress
    .filter((p) => p.last_watched_at)
    .sort((a, b) => new Date(b.last_watched_at!).getTime() - new Date(a.last_watched_at!).getTime())[0]
    ?.last_watched_at ?? null;

  return {
    data: {
      course_id: courseId,
      total_lectures: totalLectures,
      completed_lectures: completedLectures,
      progress_percentage: Math.round((completedLectures / totalLectures) * 100),
      total_watch_seconds: totalWatchSeconds,
      last_watched_at: lastWatchedAt,
    },
    error: null,
  };
}

/**
 * Get progress for multiple courses
 */
export async function getCoursesProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseIds: string[]
): Promise<QueryResult<Map<string, CourseProgress>>> {
  if (courseIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const progressMap = new Map<string, CourseProgress>();

  // Get progress for each course (could be optimized with a single query)
  for (const courseId of courseIds) {
    const { data, error } = await getCourseProgress(supabase, userId, courseId);
    if (error) {
      console.error(`[getCourseProgress] Error for course ${courseId}: ${error}`);
      continue;
    }
    if (data) {
      progressMap.set(courseId, data);
    }
  }

  return { data: progressMap, error: null };
}

// ─── Watch Hours Queries ───────────────────────────────────────────

/**
 * Get daily watch hours for a user
 */
export async function getDailyWatchHours(
  supabase: SupabaseClient<Database>,
  userId: string,
  startDate: string,
  endDate: string
): Promise<QueryResult<WatchHoursDaily[]>> {
  const { data, error } = await supabase
    .from("watch_hours_daily")
    .select("*")
    .eq("user_id", userId)
    .gte("watch_date", startDate)
    .lte("watch_date", endDate)
    .order("watch_date", { ascending: true });

  const errMsg = handleError("getDailyWatchHours", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Get watch hours for a course
 */
export async function getCourseWatchHours(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<{ totalSeconds: number; dailyData: WatchHoursDaily[] }>> {
  const { data, error } = await supabase
    .from("watch_hours_daily")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("watch_date", { ascending: false });

  const errMsg = handleError("getCourseWatchHours", error);
  if (errMsg) return { data: null, error: errMsg };

  const dailyData = data ?? [];
  const totalSeconds = dailyData.reduce((sum, d) => sum + d.seconds, 0);

  return { data: { totalSeconds, dailyData }, error: null };
}

/**
 * Get total watch hours for a user (all courses)
 */
export async function getTotalWatchHours(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<number>> {
  const { data, error } = await supabase
    .from("watch_hours_daily")
    .select("seconds")
    .eq("user_id", userId);

  const errMsg = handleError("getTotalWatchHours", error);
  if (errMsg) return { data: null, error: errMsg };

  const totalSeconds = (data ?? []).reduce((sum, d) => sum + d.seconds, 0);
  return { data: totalSeconds, error: null };
}

/**
 * Get watch hours breakdown by course
 */
export async function getWatchHoursByCourse(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<Map<string, number>>> {
  const { data, error } = await supabase
    .from("watch_hours_daily")
    .select("course_id, seconds")
    .eq("user_id", userId);

  const errMsg = handleError("getWatchHoursByCourse", error);
  if (errMsg) return { data: null, error: errMsg };

  const courseMap = new Map<string, number>();
  for (const entry of data ?? []) {
    const current = courseMap.get(entry.course_id) ?? 0;
    courseMap.set(entry.course_id, current + entry.seconds);
  }

  return { data: courseMap, error: null };
}

// ─── Update Progress ───────────────────────────────────────────────

/**
 * Update lecture progress (upsert)
 */
export async function updateLectureProgress(
  supabase: SupabaseClient<Database>,
  userId: string,
  lectureId: string,
  update: {
    watched_seconds?: number;
    resume_at_seconds?: number;
    is_completed?: boolean;
  }
): Promise<QueryResult<LectureProgress>> {
  // First try to get existing progress
  const { data: existing } = await supabase
    .from("lecture_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lecture_id", lectureId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    // Update existing
    const updateData: Record<string, unknown> = {
      last_watched_at: now,
      watch_sessions: (existing.watch_sessions ?? 0) + 1,
    };

    if (update.watched_seconds !== undefined) {
      updateData.watched_seconds = Math.max(
        existing.watched_seconds ?? 0,
        update.watched_seconds
      );
    }
    if (update.resume_at_seconds !== undefined) {
      updateData.resume_at_seconds = update.resume_at_seconds;
    }
    if (update.is_completed !== undefined) {
      updateData.is_completed = update.is_completed;
      if (update.is_completed && !existing.completed_at) {
        updateData.completed_at = now;
      }
    }

    const { data, error } = await supabase
      .from("lecture_progress")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    const errMsg = handleError("updateLectureProgress:update", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as LectureProgress, error: null };
  } else {
    // Insert new
    const insertData = {
      user_id: userId,
      lecture_id: lectureId,
      watched_seconds: update.watched_seconds ?? 0,
      resume_at_seconds: update.resume_at_seconds ?? 0,
      is_completed: update.is_completed ?? false,
      watch_sessions: 1,
      last_watched_at: now,
      completed_at: update.is_completed ? now : null,
    };

    const { data, error } = await supabase
      .from("lecture_progress")
      .insert(insertData)
      .select()
      .single();

    const errMsg = handleError("updateLectureProgress:insert", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as LectureProgress, error: null };
  }
}

/**
 * Update daily watch hours (upsert)
 */
export async function updateDailyWatchHours(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string,
  additionalSeconds: number
): Promise<QueryResult<WatchHoursDaily>> {
  const today = new Date().toISOString().split("T")[0];

  // Try to get existing entry
  const { data: existing } = await supabase
    .from("watch_hours_daily")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("watch_date", today)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("watch_hours_daily")
      .update({ seconds: existing.seconds + additionalSeconds })
      .eq("id", existing.id)
      .select()
      .single();

    const errMsg = handleError("updateDailyWatchHours:update", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as WatchHoursDaily, error: null };
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("watch_hours_daily")
      .insert({
        user_id: userId,
        course_id: courseId,
        watch_date: today,
        seconds: additionalSeconds,
      })
      .select()
      .single();

    const errMsg = handleError("updateDailyWatchHours:insert", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as WatchHoursDaily, error: null };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Format watch time in a human-readable format
 */
export function formatWatchTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "< 1m";
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Check if course is completed (all lectures done)
 */
export function isCourseCompleted(progress: CourseProgress): boolean {
  return progress.completed_lectures === progress.total_lectures && progress.total_lectures > 0;
}
