// ─────────────────────────────────────────────────────────
// My Courses — API
// Supabase relational query + progress calculation
// ─────────────────────────────────────────────────────────

import { createClient } from "@/utils/supabase/client";
import type { EnrollmentWithCourse, MyCourse } from "./types";

function getClient() {
  return createClient();
}

/**
 * Calculate progress per enrollment and determine the "resume" lecture
 * using lecture_progress.last_watched_at.
 */
function calculateProgress(
  rows: EnrollmentWithCourse[],
  userId: string,
): MyCourse[] {
  return rows.map((enrollment) => {
    const chapters = [...(enrollment.course.chapters ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const lectures = chapters.flatMap((chapter) =>
      [...(chapter.lectures ?? [])].sort((a, b) => a.position - b.position),
    );
    const totalLessons = lectures.length;

    // Flatten progress rows belonging to this user
    const userProgress = lectures.flatMap((lecture) =>
      (lecture.lecture_progress ?? []).filter(
        (progress) => progress.user_id === userId,
      ),
    );

    const completedLessons = userProgress.filter(
      (p) => p.is_completed,
    ).length;

    const progressPercent = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    const totalDurationSec = lectures.reduce(
      (sum, lecture) => sum + (lecture.duration_sec ?? 0),
      0,
    );

    const watchedSec = userProgress.reduce(
      (sum, p) => sum + (p.watched_seconds ?? 0),
      0,
    );

    // ── Determine resume lecture ────────────────────────
    // 1. Find the last-watched lecture (most recent last_watched_at)
    // 2. Fallback to the first uncompleted lecture
    // 3. Fallback to the very first lecture

    // Build a map: lectureId → progress
    const progressByLectureId = new Map<
      string,
      { is_completed: boolean; last_watched_at: string | null; watched_seconds: number }
    >();
    for (const lecture of lectures) {
      const progressForLecture = (lecture.lecture_progress ?? []).find(
        (p) => p.user_id === userId,
      );
      if (progressForLecture) {
        progressByLectureId.set(lecture.id, {
          is_completed: progressForLecture.is_completed,
          last_watched_at: progressForLecture.last_watched_at,
          watched_seconds: progressForLecture.watched_seconds ?? 0,
        });
      }
    }

    // Find last-watched lecture
    let lastWatchedLectureId: string | null = null;
    let lastWatchedAt: string | null = null;
    let latestMs = 0;

    for (const lecture of lectures) {
      const prog = progressByLectureId.get(lecture.id);
      if (prog?.last_watched_at) {
        const ms = Date.parse(prog.last_watched_at);
        if (!Number.isNaN(ms) && ms > latestMs) {
          latestMs = ms;
          lastWatchedAt = prog.last_watched_at;
          lastWatchedLectureId = lecture.id;
        }
      }
    }

    // Find first uncompleted lecture
    let firstUncompletedId: string | null = null;
    for (const lecture of lectures) {
      const prog = progressByLectureId.get(lecture.id);
      if (!prog?.is_completed) {
        firstUncompletedId = lecture.id;
        break;
      }
    }

    const resumeLectureId =
      lastWatchedLectureId ?? firstUncompletedId ?? lectures[0]?.id ?? null;

    // Resolve title for the resume lecture
    const resumeLecture = resumeLectureId
      ? lectures.find((l) => l.id === resumeLectureId)
      : null;

    // last accessed = most recent last_watched_at across all lectures
    const lastAccessedAt = lastWatchedAt;

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.course.id,
      slug: enrollment.course.slug,
      title: enrollment.course.title,
      thumbnailUrl: enrollment.course.thumbnail_url,
      instructorName: enrollment.course.instructor?.name || "Instructor",
      instructorAvatar: enrollment.course.instructor?.avatar ?? null,
      totalLessons,
      completedLessons,
      progressPercent,
      totalDurationSec,
      watchedSec,
      lastAccessedAt,
      resumeLectureId,
      resumeLectureTitle: resumeLecture?.title ?? null,
      isCompleted: totalLessons > 0 && completedLessons === totalLessons,
    } satisfies MyCourse;
  });
}

// ── Public API ───────────────────────────────────────────

export async function fetchMyCourses(): Promise<MyCourse[]> {
  const supabase = getClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(`fetchMyCourses: ${userError.message}`);
  }

  const userId = userData.user?.id;
  if (!userId) {
    throw new Error("fetchMyCourses: not authenticated");
  }

  // Single relational query — enrollments → courses → chapters → lectures → lecture_progress
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      user_id,
      course_id,
      status,
      enrolled_at,
      expires_at,
      course:courses (
        id,
        title,
        slug,
        thumbnail_url,
        instructor:users!instructor_id (
          name,
          avatar
        ),
        chapters (
          id,
          title,
          position,
          lectures (
            id,
            title,
            duration_sec,
            position,
            lecture_progress (
              user_id,
              is_completed,
              watched_seconds,
              last_watched_at
            )
          )
        )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });

  if (error) {
    throw new Error(`fetchMyCourses: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as EnrollmentWithCourse[];

  // Filter out enrollments where the course is null (e.g., unpublished or deleted)
  const validRows = rows.filter((row) => row.course);

  // Post-process: calculate progress and resolve resume lecture titles
  const courses = calculateProgress(validRows, userId);

  // Sort: most recently accessed first, then by enrolled_at
  courses.sort((a, b) => {
    const aMs = a.lastAccessedAt ? Date.parse(a.lastAccessedAt) : 0;
    const bMs = b.lastAccessedAt ? Date.parse(b.lastAccessedAt) : 0;
    if (aMs !== bMs) return bMs - aMs;
    return 0; // keep DB order (enrolled_at desc)
  });

  return courses;
}
