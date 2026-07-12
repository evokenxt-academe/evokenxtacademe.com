import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

type OptionRow = {
  id: string;
  option_text: string | null;
  is_correct: boolean | null;
};

type QuestionRow = {
  id: string;
  type: string | null;
  question_text: string | null;
  explanation: string | null;
  marks: number | null;
  blank_placeholder: string | null;
  numerical_answer: number | null;
  numerical_tolerance: number | null;
  options: OptionRow[] | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  try {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
      return auth.error;
    }

    const { supabase } = auth;
    const { quizId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    // Find the best submitted attempt for this user + quiz
    const { data: attempts, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(
        "id, user_id, quiz_id, score, total_marks, status, started_at, submitted_at",
      )
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
      .in("status", ["submitted", "timed_out"])
      .order("score", { ascending: false })
      .limit(1);

    if (attemptError) {
      console.error(
        `[admin/student-result] Error fetching attempts:`,
        attemptError,
      );
      return NextResponse.json(
        { error: "Failed to fetch attempt." },
        { status: 500 },
      );
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json(
        { error: "No submitted attempt found for this student." },
        { status: 404 },
      );
    }

    const attempt = attempts[0];

    // Fetch quiz metadata
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("title, passing_marks")
      .eq("id", quizId)
      .maybeSingle();

    if (quizError) {
      console.error(
        `[admin/student-result] Error fetching quiz:`,
        quizError,
      );
    }

    // Fetch student info
    const { data: studentData } = await supabase
      .from("users")
      .select("id, name, email, avatar")
      .eq("id", userId)
      .maybeSingle();

    // Fetch questions and options
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select(
        "id, type, question_text, explanation, marks, blank_placeholder, numerical_answer, numerical_tolerance, options:question_options(id, option_text, is_correct)",
      )
      .eq("quiz_id", quizId)
      .order("position", { ascending: true });

    if (questionsError) {
      console.error(
        `[admin/student-result] Error fetching questions:`,
        questionsError,
      );
      return NextResponse.json(
        { error: "Failed to load assessment questions." },
        { status: 500 },
      );
    }

    // Fetch student's answers
    const { data: answersData, error: answersError } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_option_id, selected_option_ids, text_answer, blank_answer, numerical_answer, is_correct, marks_awarded")
      .eq("attempt_id", attempt.id);

    if (answersError) {
      console.error(
        `[admin/student-result] Error fetching answers:`,
        answersError,
      );
      return NextResponse.json(
        { error: "Failed to load student responses." },
        { status: 500 },
      );
    }

    const questions = (questionsData ?? []) as QuestionRow[];
    const answerMap = new Map<string, any>();
    for (const answer of answersData ?? []) {
      answerMap.set(answer.question_id, answer);
    }

    let derivedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const review = questions.map((question, index) => {
      const answer = answerMap.get(question.id) ?? null;
      const selectedOptionId = answer?.selected_option_id ?? null;
      const options = question.options ?? [];
      const correctOption = options.find(
        (option) => option.is_correct === true,
      );

      let isCorrect = false;
      let isAnswered = false;

      if (answer) {
        if (typeof answer.is_correct === "boolean") {
          isCorrect = answer.is_correct;
        }

        const type = question.type;
        if (type === "mcq" || type === "true_false" || type === "assertion_reasoning") {
          isAnswered = Boolean(answer.selected_option_id);
          if (typeof answer.is_correct !== "boolean") {
            isCorrect = Boolean(selectedOptionId && correctOption?.id && selectedOptionId === correctOption.id);
          }
        } else if (type === "multiple_select") {
          isAnswered = Array.isArray(answer.selected_option_ids) && answer.selected_option_ids.length > 0;
        } else if (type === "fill_blank") {
          isAnswered = typeof answer.blank_answer === "string" && answer.blank_answer.trim().length > 0;
        } else if (type === "numerical") {
          isAnswered = answer.numerical_answer !== null && answer.numerical_answer !== undefined;
        } else if (type === "subjective") {
          isAnswered = typeof answer.text_answer === "string" && answer.text_answer.trim().length > 0;
        }
      }

      if (!isAnswered) {
        unansweredCount += 1;
      } else if (isCorrect) {
        correctCount += 1;
        derivedScore += answer ? toNumber(answer.marks_awarded) : toNumber(question.marks);
      } else {
        incorrectCount += 1;
        derivedScore += answer ? toNumber(answer.marks_awarded) : 0;
      }

      return {
        questionNumber: index + 1,
        questionId: question.id,
        type: question.type ?? "mcq",
        question: question.question_text ?? "Question unavailable",
        explanation: question.explanation?.trim() ? question.explanation : null,
        marks: toNumber(question.marks),
        
        // Option-based answers
        selectedOptionId,
        correctOptionId: correctOption?.id ?? null,

        // Non-option answers
        numericalAnswer: answer?.numerical_answer ?? null,
        blankAnswer: answer?.blank_answer ?? null,
        textAnswer: answer?.text_answer ?? null,
        marksAwarded: answer ? toNumber(answer.marks_awarded) : 0,

        // Correct answer meta for display
        numericalCorrectAnswer: question.numerical_answer ?? null,
        numericalTolerance: question.numerical_tolerance ?? null,
        blankCorrectAnswer: question.blank_placeholder ?? null,

        isCorrect,
        isUnanswered: !isAnswered,
        options: options.map((opt) => ({
          id: opt.id,
          text: opt.option_text ?? "",
          isCorrect: opt.is_correct === true,
          isSelected: opt.id === selectedOptionId,
        })),
      };
    });

    // Duration
    let durationSec: number | null = null;
    if (attempt.started_at && attempt.submitted_at) {
      durationSec = Math.round(
        (new Date(attempt.submitted_at).getTime() -
          new Date(attempt.started_at).getTime()) /
          1000,
      );
    }

    const resolvedTotalMarks =
      toNumber(attempt.total_marks) ||
      questions.reduce((sum, q) => sum + toNumber(q.marks), 0);
    const resolvedScore =
      questions.length > 0 ? derivedScore : toNumber(attempt.score);
    const percentage =
      resolvedTotalMarks > 0
        ? Math.round((resolvedScore / resolvedTotalMarks) * 100)
        : 0;
    const passingMarks = toNumber(quizData?.passing_marks);
    const passed = resolvedScore >= passingMarks;

    return NextResponse.json({
      attemptId: attempt.id,
      quizTitle: quizData?.title ?? "Assessment Result",
      student: {
        id: studentData?.id ?? userId,
        name: studentData?.name ?? "Unknown",
        email: studentData?.email ?? "",
        avatar: studentData?.avatar ?? null,
      },
      score: resolvedScore,
      totalMarks: resolvedTotalMarks,
      percentage,
      passingMarks,
      passed,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions: questions.length,
      durationSec,
      submittedAt: attempt.submitted_at,
      startedAt: attempt.started_at,
      status: attempt.status,
      review,
    });
  } catch (error) {
    console.error(
      "[admin/student-result] Unhandled error:",
      error,
    );
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
