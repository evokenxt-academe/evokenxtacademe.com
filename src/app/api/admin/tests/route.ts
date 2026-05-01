import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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

  // Verify admin role
  const { data: userRow } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userRow || userRow.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all quizzes with section → course relationship
  const { data: quizzes, error: quizError } = await adminClient
    .from("quizzes")
    .select(
      `
      id,
      title,
      description,
      total_marks,
      passing_marks,
      time_limit_sec,
      is_published,
      created_at,
      section:sections!inner (
        id,
        title,
        course:courses!inner (
          id,
          name
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (quizError) {
    return NextResponse.json(
      { error: "Failed to fetch quizzes." },
      { status: 500 },
    );
  }

  // Get question counts per quiz
  const quizIds = (quizzes ?? []).map((q: any) => q.id);

  let questionCounts: Record<string, number> = {};
  if (quizIds.length > 0) {
    const { data: questions } = await adminClient
      .from("questions")
      .select("quiz_id")
      .in("quiz_id", quizIds);

    if (questions) {
      for (const q of questions) {
        questionCounts[q.quiz_id] = (questionCounts[q.quiz_id] ?? 0) + 1;
      }
    }
  }

  // Get attempt stats per quiz
  let attemptStats: Record<
    string,
    { count: number; participants: Set<string>; scores: number[]; totalMarks: number }
  > = {};
  if (quizIds.length > 0) {
    const { data: attempts } = await adminClient
      .from("quiz_attempts")
      .select("quiz_id, user_id, score, total_marks, status")
      .in("quiz_id", quizIds)
      .in("status", ["submitted", "timed_out"]);

    if (attempts) {
      for (const a of attempts) {
        if (!attemptStats[a.quiz_id]) {
          attemptStats[a.quiz_id] = {
            count: 0,
            participants: new Set(),
            scores: [],
            totalMarks: toNumber(a.total_marks),
          };
        }
        const stat = attemptStats[a.quiz_id];
        stat.count += 1;
        stat.participants.add(a.user_id);
        stat.scores.push(toNumber(a.score));
      }
    }
  }

  const result = (quizzes ?? []).map((quiz: any) => {
    const section = quiz.section;
    const stats = attemptStats[quiz.id];
    const scores = stats?.scores ?? [];
    const totalMarks = toNumber(quiz.total_marks);
    const passingMarks = toNumber(quiz.passing_marks);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const passCount = scores.filter((s: number) => s >= passingMarks).length;
    const passRate =
      scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      courseName: section?.course?.name ?? "Unknown",
      sectionTitle: section?.title ?? "Unknown",
      totalMarks,
      passingMarks,
      timeLimitSec: quiz.time_limit_sec,
      isPublished: quiz.is_published,
      questionCount: questionCounts[quiz.id] ?? 0,
      attemptCount: stats?.count ?? 0,
      participantCount: stats?.participants.size ?? 0,
      averageScore: avgScore,
      highestScore: highest,
      passRate,
      createdAt: quiz.created_at,
    };
  });

  return NextResponse.json({ quizzes: result });
}
