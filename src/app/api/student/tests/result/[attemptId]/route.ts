import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

type AttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number | null;
  total_marks: number | null;
  status: "in_progress" | "submitted" | "timed_out" | null;
  started_at: string;
  submitted_at: string | null;
};

type QuizRow = {
  title: string | null;
  passing_marks: number | null;
};

type OptionRow = {
  id: string;
  text: string | null;
  is_correct: boolean | null;
};

type QuestionRow = {
  id: string;
  question: string | null;
  source: string | null;
  marks: number | null;
  options: OptionRow[] | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch attempt with administrative privileges to ensure we get all details
    const { data: attemptData, error: attemptError } = await adminClient
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, score, total_marks, status, started_at, submitted_at")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError) {
      console.error(`[tests] Error fetching attempt ${attemptId}:`, attemptError);
      return NextResponse.json({ error: "Failed to load attempt details." }, { status: 500 });
    }

    const attempt = attemptData as AttemptRow | null;
    if (!attempt || attempt.user_id !== user.id) {
      return NextResponse.json({ error: "Result not found or access denied." }, { status: 404 });
    }

    if (attempt.status === "in_progress") {
      return NextResponse.json(
        { error: "This assessment has not been submitted yet." },
        { status: 409 },
      );
    }

    // Fetch quiz metadata
    const { data: quizData, error: quizError } = await adminClient
      .from("quizzes")
      .select("title, passing_marks")
      .eq("id", attempt.quiz_id)
      .maybeSingle();

    if (quizError) {
      console.error(`[tests] Error fetching quiz metadata for ${attempt.quiz_id}:`, quizError);
    }

    const quiz = quizData as QuizRow | null;

    // Fetch questions and options
    const { data: questionsData, error: questionsError } = await adminClient
      .from("questions")
      .select("id, question, source, marks, options(id, text, is_correct)")
      .eq("quiz_id", attempt.quiz_id)
      .order("position", { ascending: true });

    if (questionsError) {
      console.error(`[tests] Error fetching questions for quiz ${attempt.quiz_id}:`, questionsError);
      return NextResponse.json({ error: "Failed to load assessment questions." }, { status: 500 });
    }

    // Fetch user's answers
    const { data: answersData, error: answersError } = await adminClient
      .from("quiz_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", attempt.id);

    if (answersError) {
      console.error(`[tests] Error fetching answers for attempt ${attempt.id}:`, answersError);
      return NextResponse.json({ error: "Failed to load student responses." }, { status: 500 });
    }

    const questions = (questionsData ?? []) as QuestionRow[];
    const answerMap = new Map<string, string | null>();
    for (const answer of answersData ?? []) {
      answerMap.set(answer.question_id, answer.selected_option_id);
    }

    let derivedTotalMarks = 0;
    let derivedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const review = questions.map((question) => {
      const selectedOptionId = answerMap.get(question.id) ?? null;
      const options = question.options ?? [];
      const selectedOption = options.find((option) => option.id === selectedOptionId);
      const correctOption = options.find((option) => option.is_correct === true);
      const isCorrect = Boolean(
        selectedOptionId && correctOption?.id && selectedOptionId === correctOption.id,
      );

      derivedTotalMarks += toNumber(question.marks);
      if (selectedOptionId) {
        if (isCorrect) {
          correctCount += 1;
          derivedScore += toNumber(question.marks);
        } else {
          incorrectCount += 1;
        }
      }

      return {
        questionId: question.id,
        question: question.question ?? "Question unavailable",
        explanation: question.source?.trim() ? question.source : null,
        marks: toNumber(question.marks),
        selectedOptionId,
        selectedOptionText: selectedOption?.text ?? null,
        correctOptionId: correctOption?.id ?? null,
        correctOptionText: correctOption?.text ?? null,
        isCorrect,
      };
    });

    // Fallback to stored score if questions were not found (e.g. quiz structure changed)
    const resolvedScore = questions.length > 0 ? derivedScore : toNumber(attempt.score);
    const resolvedTotalMarks = toNumber(attempt.total_marks) || derivedTotalMarks;

    // ── Compute rank ──────────────────────────────────────────────
    let rank: number | null = null;
    try {
      const { data: allAttempts } = await adminClient
        .from("quiz_attempts")
        .select("id, user_id, score")
        .eq("quiz_id", attempt.quiz_id)
        .in("status", ["submitted", "timed_out"])
        .order("score", { ascending: false });

      if (allAttempts && allAttempts.length > 0) {
        // Best score per user, then find rank
        const bestByUser = new Map<string, number>();
        for (const a of allAttempts) {
          const prev = bestByUser.get(a.user_id) ?? -1;
          if (toNumber(a.score) > prev) bestByUser.set(a.user_id, toNumber(a.score));
        }
        const sorted = [...bestByUser.entries()].sort((a, b) => b[1] - a[1]);
        const idx = sorted.findIndex(([uid]) => uid === user.id);
        if (idx !== -1) rank = idx + 1;
      }
    } catch {
      // Rank is non-critical, proceed without it
    }

    return NextResponse.json({
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      quizTitle: quiz?.title ?? "Assessment Result",
      score: resolvedScore,
      totalMarks: resolvedTotalMarks,
      passingMarks: toNumber(quiz?.passing_marks),
      status: attempt.status,
      submittedAt: attempt.submitted_at,
      startedAt: attempt.started_at,
      correctCount,
      incorrectCount,
      rank,
      review,
    });
  } catch (error) {
    console.error("[tests] Unhandled error in result API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your result." },
      { status: 500 },
    );
  }
}
