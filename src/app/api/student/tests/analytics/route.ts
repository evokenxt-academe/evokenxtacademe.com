import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

interface AttemptAnalyticsRow {
  id: string;
  quiz_id: string;
  score: number | null;
  total_marks: number | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
  quiz: {
    id: string;
    title: string;
    total_marks: number | null;
    passing_marks: number | null;
    section: {
      id: string;
      course: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function GET() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get enrolled course IDs
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
    new Set(
      (enrollmentRows ?? []).map((r) => r.course_id).filter(Boolean),
    ),
  );

  if (enrolledCourseIds.length === 0) {
    return NextResponse.json({ attempts: [] });
  }

  // 2. Resolve section IDs for enrolled courses
  const { data: sectionRows, error: sectionError } = await adminClient
    .from("sections")
    .select("id")
    .in("course_id", enrolledCourseIds);

  if (sectionError) {
    return NextResponse.json(
      { error: "Failed to resolve sections." },
      { status: 500 },
    );
  }

  const sectionIds = (sectionRows ?? []).map((r) => r.id).filter(Boolean);

  if (sectionIds.length === 0) {
    return NextResponse.json({ attempts: [] });
  }

  // 3. Get quiz IDs from enrolled sections
  const { data: quizIdRows, error: quizIdError } = await adminClient
    .from("quizzes")
    .select("id")
    .eq("is_published", true)
    .in("section_id", sectionIds);

  if (quizIdError) {
    return NextResponse.json(
      { error: "Failed to fetch quiz IDs." },
      { status: 500 },
    );
  }

  const quizIds = (quizIdRows ?? []).map((r) => r.id).filter(Boolean);

  if (quizIds.length === 0) {
    return NextResponse.json({ attempts: [] });
  }

  // 4. Fetch all submitted attempts for these quizzes
  const { data: attemptRows, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .select(
      `
      id,
      quiz_id,
      score,
      total_marks,
      status,
      started_at,
      submitted_at,
      quiz:quizzes!inner (
        id,
        title,
        total_marks,
        passing_marks,
        section:sections!inner (
          id,
          course:courses!inner (
            id,
            name
          )
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .in("quiz_id", quizIds)
    .in("status", ["submitted", "timed_out"])
    .order("submitted_at", { ascending: true });

  if (attemptError) {
    return NextResponse.json(
      { error: "Failed to fetch attempts." },
      { status: 500 },
    );
  }

  const safeAttempts = (attemptRows ?? []) as unknown as AttemptAnalyticsRow[];

  const attempts = safeAttempts
    .filter((a) => a.quiz?.section?.course)
    .map((a) => {
      const quizTotalMarks = toNum(a.quiz!.total_marks) || toNum(a.total_marks);
      const score = toNum(a.score);
      const passingMarks = toNum(a.quiz!.passing_marks);

      return {
        id: a.id,
        quizId: a.quiz_id,
        quizTitle: a.quiz!.title,
        courseName: a.quiz!.section!.course!.name,
        courseId: a.quiz!.section!.course!.id,
        score,
        totalMarks: quizTotalMarks,
        passingMarks,
        percentage: quizTotalMarks > 0 ? Math.round((score / quizTotalMarks) * 100) : 0,
        passed: score >= passingMarks,
        status: a.status,
        startedAt: a.started_at,
        submittedAt: a.submitted_at,
        durationSec:
          a.submitted_at && a.started_at
            ? Math.round(
                (new Date(a.submitted_at).getTime() -
                  new Date(a.started_at).getTime()) /
                  1000,
              )
            : null,
      };
    });

  return NextResponse.json({ attempts });
}
