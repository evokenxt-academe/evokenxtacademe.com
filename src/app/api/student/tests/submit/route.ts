import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId, timedOut } = await request.json();

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required." }, { status: 400 });
    }

    // 1. Fetch attempt and verify ownership
    const { data: attempt, error: attemptError } = await adminClient
      .from("quiz_attempts")
      .select("id, quiz_id, status, user_id")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    if (attempt.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json({ error: "Attempt already submitted." }, { status: 409 });
    }

    // 2. Fetch quiz details
    const { data: quiz, error: quizError } = await adminClient
      .from("quizzes")
      .select("id, total_marks, passing_marks")
      .eq("id", attempt.quiz_id)
      .maybeSingle();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    // 3. Fetch questions and options with correct answers
    const { data: questions, error: questionError } = await adminClient
      .from("questions")
      .select("id, marks, options(id, is_correct)")
      .eq("quiz_id", attempt.quiz_id);

    if (questionError) {
      return NextResponse.json({ error: "Failed to load assessment data." }, { status: 500 });
    }

    // 4. Fetch user answers
    const { data: answerRows, error: answersError } = await adminClient
      .from("quiz_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", attemptId);

    if (answersError) {
      return NextResponse.json({ error: "Failed to load responses." }, { status: 500 });
    }

    const selectedByQuestion = new Map<string, string>();
    for (const answer of answerRows ?? []) {
      if (answer.selected_option_id) {
        selectedByQuestion.set(answer.question_id, answer.selected_option_id);
      }
    }

    // 5. Calculate score
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let derivedTotalMarks = 0;

    for (const question of questions ?? []) {
      const marks = toNumber(question.marks);
      derivedTotalMarks += marks;
      
      const selectedOptionId = selectedByQuestion.get(question.id);
      const correctOption = (question.options ?? []).find((option) => option.is_correct);

      if (!selectedOptionId) continue;
      
      if (correctOption && selectedOptionId === correctOption.id) {
        score += marks;
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    }

    const submittedAt = new Date().toISOString();
    const finalStatus = timedOut ? "timed_out" : "submitted";
    const resolvedTotalMarks = toNumber(quiz.total_marks) || derivedTotalMarks;

    // 6. Update attempt record
    const { error: updateError } = await adminClient
      .from("quiz_attempts")
      .update({
        score,
        total_marks: resolvedTotalMarks,
        status: finalStatus,
        submitted_at: submittedAt,
      })
      .eq("id", attemptId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save result." }, { status: 500 });
    }

    return NextResponse.json({
      attemptId,
      quizId: attempt.quiz_id,
      score,
      totalMarks: resolvedTotalMarks,
      passingMarks: toNumber(quiz.passing_marks),
      status: finalStatus,
      submittedAt,
      correctCount,
      incorrectCount,
    });

  } catch (error) {
    console.error("[tests] Unhandled error in submit API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your submission." },
      { status: 500 },
    );
  }
}
