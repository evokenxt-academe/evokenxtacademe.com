"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getStudentEnrollments,
  getStudentProgress,
  getCourseWithChapters,
} from "@/lib/supabase/queries";
import type {
  EnrollmentWithCourse,
  StudentProgressStats,
} from "@/types/database-v2.types";

/**
 * Get student's enrolled courses with progress
 */
export async function getStudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    // Get enrollments
    const { data: enrollments, error: enrollError } =
      await getStudentEnrollments(supabase, user.id);

    if (enrollError) {
      return { error: enrollError };
    }

    // Get progress stats for each enrolled course
    const progressData = await Promise.all(
      (enrollments || []).map(async (enrollment) => {
        const { data: progress } = await getStudentProgress(
          supabase,
          user.id,
          enrollment.course_id
        );
        return progress;
      })
    );

    return {
      enrollments,
      progress: progressData,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get full course content with chapters and lectures
 */
export async function getStudentCourseContent(courseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    // Check enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrollError) {
      return { error: enrollError };
    }

    if (!enrollment) {
      return { error: "Not enrolled in this course" };
    }

    // Get course with chapters
    const { data: course, error: courseError } = await getCourseWithChapters(
      supabase,
      courseId
    );

    if (courseError) {
      return { error: courseError };
    }

    // Get progress for all lectures
    const { data: progress } = await supabase
      .from("lecture_progress")
      .select("lecture_id, watched_seconds, is_completed, resume_at_seconds")
      .eq("user_id", user.id);

    const progressMap = new Map(
      (progress || []).map((p) => [p.lecture_id, p])
    );

    return {
      course,
      progress: progressMap,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get student's quiz attempts and scores
 */
export async function getStudentQuizzes(courseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select(
        `
        id,
        quiz_id,
        score,
        max_score,
        status,
        completed_at,
        quiz:quizzes!quiz_id (
          id,
          title,
          description,
          chapter:chapters!chapter_id (id, course_id)
        )
      `
      )
      .eq("user_id", user.id)
      .eq("quiz.chapter.course_id", courseId)
      .order("completed_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { attempts };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/**
 * Get student certificates earned
 */
export async function getStudentCertificates() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    const { data: certificates, error } = await supabase
      .from("certificates")
      .select(
        `
        id,
        course_id,
        issued_at,
        certificate_url,
        course:courses!course_id (id, name, slug)
      `
      )
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { certificates };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
