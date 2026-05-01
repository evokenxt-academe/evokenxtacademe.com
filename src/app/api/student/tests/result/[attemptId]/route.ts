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

  const { data: attemptData, error: attemptError } = await adminClient
    .from("quiz_attempts")
    .select("id, user_id, quiz_id, score, total_marks, status, started_at, submitted_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError) {
    console.error(`[tests] failed to fetch attempt ${attemptId}: ${attemptError.message}`);
    return NextResponse.json({ error: "Failed to load result." }, { status: 500 });
  }

  const attempt = (attemptData ?? null) as AttemptRow | null;
  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  if (attempt.status === "in_progress") {
    return NextResponse.json(
      { error: "Result is not available until the quiz is submitted." },
      { status: 409 },
    );
  }

  const { data: quizData, error: quizError } = await adminClient
    .from("quizzes")
    .select("title, passing_marks")
    .eq("id", attempt.quiz_id)
    .maybeSingle();

  if (quizError) {
    console.error(`[tests] failed to fetch quiz ${attempt.quiz_id}: ${quizError.message}`);
  }

  const quiz = (quizData ?? null) as QuizRow | null;

  const { data: questionsData, error: questionsError } = await adminClient
    .from("questions")
    .select("id, question, source, marks, options(id, text, is_correct)")
    .eq("quiz_id", attempt.quiz_id)
    .order("position", { ascending: true });

  if (questionsError) {
    console.error(
      `[tests] failed to fetch questions for quiz ${attempt.quiz_id}: ${questionsError.message}`,
    );
    return NextResponse.json({ error: "Failed to load result details." }, { status: 500 });
  }

  const { data: answersData, error: answersError } = await adminClient
    .from("quiz_answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", attempt.id);

  if (answersError) {
    console.error(`[tests] failed to fetch answers for attempt ${attempt.id}: ${answersError.message}`);
    return NextResponse.json({ error: "Failed to load result answers." }, { status: 500 });
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

  const resolvedScore = questions.length > 0 ? derivedScore : toNumber(attempt.score);

  return NextResponse.json({
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    quizTitle: quiz?.title ?? "Quiz Result",
    score: resolvedScore,
    totalMarks: toNumber(attempt.total_marks) || derivedTotalMarks,
    passingMarks: toNumber(quiz?.passing_marks),
    status: attempt.status,
    submittedAt: attempt.submitted_at,
    startedAt: attempt.started_at,
    correctCount,
    incorrectCount,
    review,
  });
}
