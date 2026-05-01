"use client";

import { createClient } from "@/utils/supabase/client";
import type {
  AttemptResultDetail,
  AttemptWithAnswers,
  QuizDetail,
  QuizSummaryItem,
  SubmitAttemptResult,
} from "@/features/tests/types";

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export interface StudentQuizzesResponse {
  quizzes: QuizSummaryItem[];
  enrollmentCount: number;
}

async function getCurrentUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new Error("You must be logged in to access tests.");
  }
  return data.user.id;
}

export async function fetchStudentQuizzes(): Promise<StudentQuizzesResponse> {
  const response = await fetch("/api/student/tests", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let payload: { quizzes?: QuizSummaryItem[]; enrollmentCount?: number; error?: string } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error("Failed to parse tests response.");
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to load tests.");
  }

  return {
    quizzes: Array.isArray(payload.quizzes) ? payload.quizzes : [],
    enrollmentCount: toNumber(payload.enrollmentCount),
  };
}

export async function fetchEnrolledQuizzes(): Promise<QuizSummaryItem[]> {
  const result = await fetchStudentQuizzes();
  return result.quizzes;
}

export async function fetchQuiz(quizId: string): Promise<QuizDetail> {
  const response = await fetch(`/api/student/quiz/${quizId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let payload:
    | (QuizDetail & { error?: string })
    | { error?: string } = {};

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error("Failed to parse quiz response.");
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Quiz not found.");
  }

  const quiz = payload as QuizDetail;
  return {
    ...quiz,
    totalMarks: toNumber(quiz.totalMarks),
    passingMarks: toNumber(quiz.passingMarks),
    questions: (quiz.questions ?? [])
      .sort((a, b) => a.position - b.position)
      .map((question) => ({
        ...question,
        marks: toNumber(question.marks),
      })),
  };
}

export async function fetchAttempt(quizId: string): Promise<AttemptWithAnswers | null> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status, started_at, submitted_at, score, total_marks")
    .eq("quiz_id", quizId)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!attempt) return null;

  const { data: answerRows, error: answerError } = await supabase
    .from("quiz_answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", attempt.id);

  if (answerError) throw new Error(answerError.message);

  const answers: Record<string, string> = {};
  for (const row of answerRows ?? []) {
    if (row.selected_option_id) {
      answers[row.question_id] = row.selected_option_id;
    }
  }

  return {
    id: attempt.id,
    quizId: attempt.quiz_id,
    status: attempt.status,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,
    score: toNumber(attempt.score),
    totalMarks: toNumber(attempt.total_marks),
    answers,
  };
}

export async function createAttempt(quizId: string): Promise<{ attemptId: string }> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const existing = await fetchAttempt(quizId);
  if (existing) {
    return { attemptId: existing.id };
  }

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create attempt.");
  }

  return { attemptId: data.id };
}

export async function saveAnswer(payload: {
  attemptId: string;
  questionId: string;
  selectedOptionId: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.from("quiz_answers").upsert(
    {
      attempt_id: payload.attemptId,
      question_id: payload.questionId,
      selected_option_id: payload.selectedOptionId,
    },
    { onConflict: "attempt_id,question_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function submitAttempt(payload: {
  attemptId: string;
  timedOut?: boolean;
}): Promise<SubmitAttemptResult> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status, total_marks")
    .eq("id", payload.attemptId)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found or already submitted.");
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, total_marks, passing_marks")
    .eq("id", attempt.quiz_id)
    .maybeSingle();

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, marks, options(id, is_correct)")
    .eq("quiz_id", attempt.quiz_id);

  if (questionError) throw new Error(questionError.message);

  const { data: answerRows, error: answersError } = await supabase
    .from("quiz_answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", payload.attemptId);

  if (answersError) throw new Error(answersError.message);

  const selectedByQuestion = new Map<string, string>();
  for (const answer of answerRows ?? []) {
    if (answer.selected_option_id) {
      selectedByQuestion.set(answer.question_id, answer.selected_option_id);
    }
  }

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let derivedTotalMarks = 0;

  for (const question of questions ?? []) {
    derivedTotalMarks += toNumber(question.marks);
    const selectedOptionId = selectedByQuestion.get(question.id);
    const correctOption = (question.options ?? []).find((option) => option.is_correct);

    if (!selectedOptionId) continue;
    if (correctOption && selectedOptionId === correctOption.id) {
      score += toNumber(question.marks);
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  }

  const submittedAt = new Date().toISOString();
  const finalStatus = payload.timedOut ? "timed_out" : "submitted";
  const resolvedTotalMarks =
    toNumber(quiz?.total_marks) || toNumber(attempt.total_marks) || derivedTotalMarks;
  const resolvedPassingMarks = toNumber(quiz?.passing_marks);

  if (quizError || !quiz) {
    console.warn(
      `[tests] submitAttempt proceeding without quiz metadata for attempt ${payload.attemptId}`,
    );
  }

  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      score,
      total_marks: resolvedTotalMarks,
      status: finalStatus,
      submitted_at: submittedAt,
    })
    .eq("id", payload.attemptId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  return {
    attemptId: payload.attemptId,
    quizId: attempt.quiz_id,
    score,
    totalMarks: resolvedTotalMarks,
    passingMarks: resolvedPassingMarks,
    status: finalStatus,
    submittedAt,
    correctCount,
    incorrectCount,
  };
}

export async function fetchAttemptResult(attemptId: string): Promise<AttemptResultDetail> {
  const response = await fetch(`/api/student/tests/result/${attemptId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let payload: (AttemptResultDetail & { error?: string }) | { error?: string } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error("Failed to parse attempt result.");
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Result not found.");
  }

  return payload as AttemptResultDetail;
}
