import { createClient } from "@/utils/supabase/client";
import type { EnrollmentWithCourse, MyCourse } from "./types";

function getClient() {
    return createClient();
}

function calculateProgress(
    rows: EnrollmentWithCourse[],
    userId: string
): MyCourse[] {
    return rows.map((enrollment) => {
        const sections = enrollment.course.sections ?? [];
        const lectures = sections.flatMap((section) => section.lectures ?? []);
        const totalLessons = lectures.length;

        const userProgress = lectures.flatMap((lecture) =>
            (lecture.lecture_progress ?? []).filter(
                (progress) => progress.user_id === userId
            )
        );

        const completedLessons = userProgress.filter(
            (progress) => progress.is_completed
        ).length;

        const progressPercent = totalLessons
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        const lastAccessedAt = userProgress
            .map((progress) => progress.last_watched_at)
            .filter(Boolean)
            .sort()
            .at(-1) ?? null;

        return {
            enrollmentId: enrollment.id,
            courseId: enrollment.course.id,
            slug: enrollment.course.slug,
            title: enrollment.course.name,
            thumbnailUrl: enrollment.course.thumbnail_url,
            instructorName: enrollment.course.instructor?.name || "Instructor",
            totalLessons,
            completedLessons,
            progressPercent,
            lastAccessedAt,
        } satisfies MyCourse;
    });
}

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
        name,
        slug,
        thumbnail_url,
        instructor:users (
          name,
          avatar
        ),
        sections (
          id,
          lectures (
            id,
            lecture_progress (
              user_id,
              is_completed,
              last_watched_at
            )
          )
        )
      )
    `
        )
        .eq("user_id", userId)
        .order("enrolled_at", { ascending: false });

    if (error) {
        throw new Error(`fetchMyCourses: ${error.message}`);
    }

    const rows = (data ?? []) as EnrollmentWithCourse[];
    return calculateProgress(rows, userId);
}
