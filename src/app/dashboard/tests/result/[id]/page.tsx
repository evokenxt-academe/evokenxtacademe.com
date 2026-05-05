import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/adminClient";
import { createClient } from "@/utils/supabase/server";
import { TestResultClient } from "./TestResultClient";
import type {
  AnswerMap,
  AttemptMeta,
  QuestionResult,
  LeaderboardEntry,
} from "@/types/test-result";

async function resolveUserRole(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  email?: string,
) {
  const byId = await adminClient
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (byId.error) {
    return null;
  }

  if (byId.data?.role) {
    return byId.data.role;
  }

  if (!email) {
    return null;
  }

  const byEmail = await adminClient
    .from("users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  if (byEmail.error) {
    return null;
  }

  return byEmail.data?.role ?? null;
}

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const role = await resolveUserRole(
    adminClient,
    user.id,
    user.email ?? undefined,
  );
  const isAdmin = role === "admin" || role === "instructor";

  const { data: attemptRow, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .select(
      "id, user_id, quiz_id, score, total_marks, status, started_at, submitted_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (attemptError || !attemptRow) {
    notFound();
  }

  if (!isAdmin && attemptRow.user_id !== user.id) {
    notFound();
  }

  const { data: quizRow, error: quizError } = await adminClient
    .from("quizzes")
    .select(
      "id, title, description, type, total_marks, passing_marks, time_limit_sec, section_id",
    )
    .eq("id", attemptRow.quiz_id)
    .maybeSingle();

  if (quizError || !quizRow) {
    notFound();
  }

  const { data: sectionRow } = await adminClient
    .from("sections")
    .select("course_id")
    .eq("id", quizRow.section_id)
    .maybeSingle();

  const { data: courseRow } = sectionRow?.course_id
    ? await adminClient
        .from("courses")
        .select("name, slug")
        .eq("id", sectionRow.course_id)
        .maybeSingle()
    : { data: null };

  const attempt = {
    ...attemptRow,
    quizzes: {
      ...quizRow,
      sections: {
        courses: {
          name: courseRow?.name ?? "Unknown Course",
          slug: courseRow?.slug ?? "",
        },
      },
    },
  };

  // ── Queries 2–4 in parallel ───────────────────────────────────
  const [questionsRes, answersRes, leaderboardRes] = await Promise.all([
    // Query 2 — All questions + options for this quiz
    adminClient
      .from("questions")
      .select(
        `
        id, question, source, marks, position,
        options ( id, text, is_correct )
      `,
      )
      .eq("quiz_id", attempt.quizzes.id)
      .order("position", { ascending: true }),

    // Query 3 — Student's answers for this attempt
    adminClient
      .from("quiz_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", id),

    // Query 4 — Leaderboard: all submitted attempts for same quiz
    adminClient
      .from("quiz_attempts")
      .select(
        `
        id, score, total_marks, submitted_at,
        users ( id, name, avatar )
      `,
      )
      .eq("quiz_id", attempt.quizzes.id)
      .eq("status", "submitted")
      .order("score", { ascending: false })
      .order("submitted_at", { ascending: true }),
  ]);

  const questions = questionsRes.data ?? [];
  const answers = answersRes.data ?? [];
  const leaderboard = leaderboardRes.data ?? [];

  // ── Build AnswerMap ───────────────────────────────────────────
  const answerMap: AnswerMap = Object.fromEntries(
    answers.map((a) => [a.question_id, a.selected_option_id]),
  );

  // ── Build QuestionResult[] ────────────────────────────────────
  const questionResults: QuestionResult[] = questions.map((q) => {
    const selectedOptionId = answerMap[q.id] ?? null;
    const selectedOption =
      q.options.find((o) => o.id === selectedOptionId) ?? null;
    const correctOption = q.options.find((o) => o.is_correct)!;
    const isSkipped = selectedOptionId === null;
    const isCorrect = !isSkipped && selectedOptionId === correctOption?.id;

    return {
      ...q,
      selectedOptionId,
      selectedOption,
      correctOption,
      isCorrect,
      isSkipped,
      earnedMarks: isCorrect ? q.marks : 0,
    };
  });

  // ── Build AttemptMeta ─────────────────────────────────────────
  const timeTakenSec = attempt.submitted_at
    ? Math.round(
        (new Date(attempt.submitted_at).getTime() -
          new Date(attempt.started_at).getTime()) /
          1000,
      )
    : null;

  const timeTakenLabel = timeTakenSec
    ? `${Math.floor(timeTakenSec / 60)}m ${timeTakenSec % 60}s`
    : "—";

  const quiz = attempt.quizzes;
  const sections = quiz.sections as {
    courses: { name: string; slug: string };
  } | null;

  const attemptMeta: AttemptMeta = {
    id: attempt.id,
    score: attempt.score,
    total_marks: attempt.total_marks,
    status: attempt.status as AttemptMeta["status"],
    started_at: attempt.started_at,
    submitted_at: attempt.submitted_at,
    scorePercent:
      attempt.total_marks > 0
        ? Math.round((attempt.score / attempt.total_marks) * 100)
        : 0,
    passingPercent:
      attempt.total_marks > 0
        ? Math.round((quiz.passing_marks / attempt.total_marks) * 100)
        : 0,
    isPassed:
      attempt.score >= quiz.passing_marks && attempt.status === "submitted",
    timeTakenLabel,
    quizTitle: quiz.title,
    quizType: quiz.type as AttemptMeta["quizType"],
    quizDescription: quiz.description ?? null,
    passing_marks: quiz.passing_marks,
    courseName: sections?.courses?.name ?? "Unknown Course",
    courseSlug: sections?.courses?.slug ?? "",
  };

  // ── Build LeaderboardEntry[] ──────────────────────────────────
  const leaderboardEntries: LeaderboardEntry[] = leaderboard.map(
    (entry, i) => ({
      id: entry.id,
      score: entry.score,
      total_marks: entry.total_marks,
      submitted_at: entry.submitted_at ?? "",
      users: entry.users as LeaderboardEntry["users"],
      rank: i + 1,
      scorePercent:
        entry.total_marks > 0
          ? Math.round((entry.score / entry.total_marks) * 100)
          : 0,
      isCurrentUser: entry.id === id,
    }),
  );

  const currentUserRank =
    leaderboardEntries.find((e) => e.isCurrentUser)?.rank ?? 0;

  return (
    <TestResultClient
      attemptMeta={attemptMeta}
      questionResults={questionResults}
      leaderboard={leaderboardEntries}
      currentUserRank={currentUserRank}
      totalStudents={leaderboardEntries.length}
    />
  );
}
