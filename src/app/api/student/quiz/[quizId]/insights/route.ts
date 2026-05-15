import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/adminClient";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type AttemptRow = {
  id: string;
  user_id: string;
  score: number | null;
  total_marks: number | null;
  status: "in_progress" | "submitted" | "timed_out" | null;
  started_at: string;
  submitted_at: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
};

type QuizAccessRow = {
  id: string;
  title: string;
  description: string | null;
  total_marks: number | null;
  passing_marks: number | null;
  time_limit_sec: number | null;
  section:
  | {
    id: string;
    title: string | null;
    course:
    | {
      id: string;
      name: string | null;
    }
    | null;
  }
  | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "NA";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function durationSeconds(startedAt: string, submittedAt: string | null): number | null {
  if (!submittedAt) return null;
  const startMs = new Date(startedAt).getTime();
  const submitMs = new Date(submittedAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(submitMs) || submitMs < startMs) {
    return null;
  }
  return Math.round((submitMs - startMs) / 1000);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: quizRow, error: quizError } = await adminClient
    .from("quizzes")
    .select(
      "id, title, description, total_marks, passing_marks, time_limit_sec, section:sections(id, title, course:courses(id, name:title))",
    )
    .eq("id", quizId)
    .eq("is_published", true)
    .maybeSingle();

  if (quizError || !quizRow) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const quiz = quizRow as any as QuizAccessRow;
  const courseId = quiz.section?.course?.id ?? null;

  if (!courseId) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const { data: enrollment } = await adminClient
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const { data: quizQuestions, error: questionCountError } = await adminClient
    .from("questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (questionCountError) {
    return NextResponse.json({ error: "Failed to load quiz questions." }, { status: 500 });
  }

  const { data: attemptRows, error: attemptsError } = await adminClient
    .from("quiz_attempts")
    .select("id, user_id, score, total_marks, status, started_at, submitted_at")
    .eq("quiz_id", quizId)
    .in("status", ["submitted", "timed_out"])
    .order("score", { ascending: false })
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (attemptsError) {
    return NextResponse.json({ error: "Failed to load attempts." }, { status: 500 });
  }

  const allSubmittedAttempts = (attemptRows ?? []) as AttemptRow[];
  const bestAttemptByUser = new Map<string, AttemptRow>();
  const attemptsByUser = new Map<string, number>();
  const attemptRankById = new Map<string, number>();

  let lastScore: number | null = null;
  let runningRank = 0;

  for (let index = 0; index < allSubmittedAttempts.length; index += 1) {
    const attempt = allSubmittedAttempts[index];
    const score = toNumber(attempt.score);
    if (lastScore === null || score < lastScore) {
      runningRank = index + 1;
      lastScore = score;
    }
    attemptRankById.set(attempt.id, runningRank);
    attemptsByUser.set(attempt.user_id, (attemptsByUser.get(attempt.user_id) ?? 0) + 1);
    if (!bestAttemptByUser.has(attempt.user_id)) {
      bestAttemptByUser.set(attempt.user_id, attempt);
    }
  }

  const rankedBestAttempts = Array.from(bestAttemptByUser.values());
  const userIds = rankedBestAttempts.map((attempt) => attempt.user_id);

  const { data: userRows, error: usersError } = userIds.length
    ? await adminClient.from("users").select("id, name").in("id", userIds)
    : { data: [], error: null };

  if (usersError) {
    return NextResponse.json({ error: "Failed to load ranking users." }, { status: 500 });
  }

  const usersById = new Map<string, UserRow>();
  for (const row of (userRows ?? []) as UserRow[]) {
    usersById.set(row.id, row);
  }

  let previousScore: number | null = null;
  let displayRank = 0;
  const ranking = rankedBestAttempts.slice(0, 50).map((attempt, index) => {
    const score = toNumber(attempt.score);
    if (previousScore === null || score < previousScore) {
      displayRank = index + 1;
      previousScore = score;
    }
    const totalMarks = toNumber(attempt.total_marks) || toNumber(quiz.total_marks);
    const name = usersById.get(attempt.user_id)?.name?.trim() || "Student";

    return {
      rank: displayRank,
      userId: attempt.user_id,
      name,
      initials: toInitials(name),
      score,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0,
      submittedAt: attempt.submitted_at,
      durationSec: durationSeconds(attempt.started_at, attempt.submitted_at),
      attempts: attemptsByUser.get(attempt.user_id) ?? 1,
    };
  });

  const { data: historyRows, error: historyError } = await adminClient
    .from("quiz_attempts")
    .select("id, user_id, score, total_marks, status, started_at, submitted_at")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  if (historyError) {
    return NextResponse.json({ error: "Failed to load test history." }, { status: 500 });
  }

  const history = ((historyRows ?? []) as AttemptRow[]).map((attempt) => {
    const score = toNumber(attempt.score);
    const totalMarks = toNumber(attempt.total_marks) || toNumber(quiz.total_marks);
    return {
      attemptId: attempt.id,
      status: attempt.status,
      score,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      durationSec: durationSeconds(attempt.started_at, attempt.submitted_at),
      rank: attemptRankById.get(attempt.id) ?? null,
    };
  });

  const attemptCount = allSubmittedAttempts.length;
  const participants = bestAttemptByUser.size;
  const totalScore = allSubmittedAttempts.reduce(
    (sum, attempt) => sum + toNumber(attempt.score),
    0,
  );
  const highestScore = allSubmittedAttempts.reduce(
    (best, attempt) => Math.max(best, toNumber(attempt.score)),
    0,
  );
  const passCount = allSubmittedAttempts.reduce((count, attempt) => {
    return toNumber(attempt.score) >= toNumber(quiz.passing_marks) ? count + 1 : count;
  }, 0);

  const distribution = [
    { label: "0-40%", count: 0 },
    { label: "41-60%", count: 0 },
    { label: "61-80%", count: 0 },
    { label: "81-100%", count: 0 },
  ];

  for (const attempt of allSubmittedAttempts) {
    const totalMarks = toNumber(attempt.total_marks) || toNumber(quiz.total_marks);
    const percentage = totalMarks > 0 ? Math.round((toNumber(attempt.score) / totalMarks) * 100) : 0;
    if (percentage <= 40) distribution[0].count += 1;
    else if (percentage <= 60) distribution[1].count += 1;
    else if (percentage <= 80) distribution[2].count += 1;
    else distribution[3].count += 1;
  }

  return NextResponse.json({
    about: {
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      courseName: quiz.section?.course?.name ?? "",
      sectionTitle: quiz.section?.title ?? "",
      totalMarks: toNumber(quiz.total_marks),
      passingMarks: toNumber(quiz.passing_marks),
      timeLimitSec: quiz.time_limit_sec,
      questionCount: (quizQuestions ?? []).length,
    },
    report: {
      participants,
      attempts: attemptCount,
      averageScore: attemptCount > 0 ? Number((totalScore / attemptCount).toFixed(1)) : 0,
      highestScore,
      passRate: attemptCount > 0 ? Math.round((passCount / attemptCount) * 100) : 0,
      averageAccuracy:
        attemptCount > 0 && toNumber(quiz.total_marks) > 0
          ? Math.round((totalScore / (attemptCount * toNumber(quiz.total_marks))) * 100)
          : 0,
      distribution,
    },
    ranking,
    history,
  });
}
