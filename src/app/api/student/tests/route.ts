import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  total_marks: number | null;
  passing_marks: number | null;
  time_limit_sec: number | null;
  section: {
    id: string;
    title: string;
    course: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type AttemptRow = {
  id: string;
  quiz_id: string;
  score: number | null;
  total_marks: number | null;
  status: "in_progress" | "submitted" | "timed_out" | null;
};

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { data: enrollmentRows, error: enrollmentError } = await adminClient
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (enrollmentError) {
    return NextResponse.json(
      { error: "Failed to fetch enrollments." },
      { status: 500 },
    );
  }

  const enrolledCourseIds = Array.from(
    new Set((enrollmentRows ?? []).map((row) => row.course_id).filter(Boolean)),
  );

  if (enrolledCourseIds.length === 0) {
    return NextResponse.json({
      quizzes: [],
      enrollmentCount: 0,
      ...(debug
        ? {
            debug: {
              userId: user.id,
              enrolledCourseIds: [],
              enrolledSectionIds: [],
              publishedQuizCount: 0,
            },
          }
        : {}),
    });
  }

  const { data: sectionRows, error: sectionError } = await adminClient
    .from("sections")
    .select("id, course_id")
    .in("course_id", enrolledCourseIds);

  if (sectionError) {
    return NextResponse.json(
      { error: "Failed to resolve enrolled sections." },
      { status: 500 },
    );
  }

  const enrolledSectionIds = (sectionRows ?? [])
    .map((row) => row.id)
    .filter(Boolean);

  if (enrolledSectionIds.length === 0) {
    return NextResponse.json({
      quizzes: [],
      enrollmentCount: enrolledCourseIds.length,
      ...(debug
        ? {
            debug: {
              userId: user.id,
              enrolledCourseIds,
              enrolledSectionIds: [],
              publishedQuizCount: 0,
            },
          }
        : {}),
    });
  }

  const { data: quizRows, error: quizError } = await adminClient
    .from("quizzes")
    .select(
      `
      id,
      title,
      description,
      total_marks,
      passing_marks,
      time_limit_sec,
      section:sections!inner (
        id,
        title,
        course:courses!inner (
          id,
          name,
          status
        )
      )
    `,
    )
    .eq("is_published", true)
    .in("section_id", enrolledSectionIds);

  if (quizError) {
    return NextResponse.json(
      { error: "Failed to fetch quizzes." },
      { status: 500 },
    );
  }

  const safeQuizzes = (quizRows ?? []) as unknown as QuizRow[];
  const visibleQuizzes = safeQuizzes.filter(
    (quiz) =>
      quiz.section?.course &&
      enrolledCourseIds.includes(quiz.section.course.id),
  );

  if (visibleQuizzes.length === 0) {
    return NextResponse.json({
      quizzes: [],
      enrollmentCount: enrolledCourseIds.length,
      ...(debug
        ? {
            debug: {
              userId: user.id,
              enrolledCourseIds,
              enrolledSectionIds,
              publishedQuizCount: 0,
            },
          }
        : {}),
    });
  }

  const quizIds = visibleQuizzes.map((quiz) => quiz.id);
  const { data: attemptRows, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .select("id, quiz_id, status, score, total_marks, started_at")
    .eq("user_id", user.id)
    .in("quiz_id", quizIds)
    .order("started_at", { ascending: false });

  if (attemptError) {
    return NextResponse.json(
      { error: "Failed to fetch quiz attempts." },
      { status: 500 },
    );
  }

  const latestByQuiz = new Map<string, AttemptRow>();
  for (const attempt of (attemptRows ?? []) as AttemptRow[]) {
    if (!latestByQuiz.has(attempt.quiz_id)) {
      latestByQuiz.set(attempt.quiz_id, attempt);
    }
  }

  const quizzes = visibleQuizzes.map((quiz) => {
    const latest = latestByQuiz.get(quiz.id);
    const status = latest
      ? latest.status === "in_progress"
        ? "in_progress"
        : "completed"
      : "not_attempted";

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      totalMarks: toFiniteNumber(quiz.total_marks),
      passingMarks: toFiniteNumber(quiz.passing_marks),
      timeLimitSec: quiz.time_limit_sec,
      courseId: quiz.section!.course!.id,
      courseName: quiz.section!.course!.name,
      sectionId: quiz.section!.id,
      sectionTitle: quiz.section!.title,
      status,
      latestAttemptId: latest?.id ?? null,
      latestScore: latest && latest.status !== "in_progress" ? toFiniteNumber(latest.score) : null,
    };
  });

  return NextResponse.json({
    quizzes,
    enrollmentCount: enrolledCourseIds.length,
    ...(debug
      ? {
          debug: {
            userId: user.id,
            enrolledCourseIds,
            enrolledSectionIds,
            publishedQuizCount: quizzes.length,
          },
        }
      : {}),
  });
}
