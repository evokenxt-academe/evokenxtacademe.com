import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";

export const dynamic = "force-dynamic";

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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
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
  time_spent_sec: number | null;
};

type QuizRow = {
  title: string | null;
  passing_marks: number | null;
};

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

    const role = await resolveUserRole(adminClient, user.id, user.email ?? undefined);
    const isAdmin = role === "admin" || role === "instructor";

    // Fetch attempt with administrative privileges to ensure we get all details
    const { data: attemptData, error: attemptError } = await adminClient
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, score, total_marks, status, started_at, submitted_at, time_spent_sec")
      .eq("id", attemptId)
      .maybeSingle();

    if (attemptError) {
      console.error(`[tests] Error fetching attempt ${attemptId}:`, attemptError);
      return NextResponse.json({ error: "Failed to load attempt details." }, { status: 500 });
    }

    const attempt = attemptData as AttemptRow | null;
    if (!attempt || (!isAdmin && attempt.user_id !== user.id)) {
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
      .select("id, type, question_text, explanation, marks, blank_placeholder, numerical_answer, numerical_tolerance, options:question_options(id, option_text, is_correct)")
      .eq("quiz_id", attempt.quiz_id)
      .order("position", { ascending: true });

    if (questionsError) {
      console.error(`[tests] Error fetching questions for quiz ${attempt.quiz_id}:`, questionsError);
      return NextResponse.json({ error: "Failed to load assessment questions." }, { status: 500 });
    }

    // Fetch user's answers
    const { data: answersData, error: answersError } = await adminClient
      .from("quiz_answers")
      .select("question_id, selected_option_id, selected_option_ids, text_answer, blank_answer, numerical_answer, is_correct, marks_awarded")
      .eq("attempt_id", attempt.id);

    if (answersError) {
      console.error(`[tests] Error fetching answers for attempt ${attempt.id}:`, answersError);
      return NextResponse.json({ error: "Failed to load student responses." }, { status: 500 });
    }

    const questions = (questionsData ?? []) as QuestionRow[];
    const answerMap = new Map<string, any>();
    for (const answer of answersData ?? []) {
      answerMap.set(answer.question_id, answer);
    }

    let derivedTotalMarks = 0;
    let derivedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const review = questions.map((question) => {
      const answer = answerMap.get(question.id) ?? null;
      const selectedOptionId = answer?.selected_option_id ?? null;
      const options = question.options ?? [];
      const selectedOption = options.find((option) => option.id === selectedOptionId);
      const correctOption = options.find((option) => option.is_correct === true);
      
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

      derivedTotalMarks += toNumber(question.marks);
      if (isAnswered) {
        if (isCorrect) {
          correctCount += 1;
          derivedScore += answer ? toNumber(answer.marks_awarded) : toNumber(question.marks);
        } else {
          incorrectCount += 1;
          derivedScore += answer ? toNumber(answer.marks_awarded) : 0;
        }
      }

      return {
        questionId: question.id,
        type: question.type ?? "mcq",
        question: question.question_text ?? "Question unavailable",
        explanation: question.explanation?.trim() ? question.explanation : null,
        marks: toNumber(question.marks),
        
        // Option-based answers
        selectedOptionId,
        selectedOptionText: selectedOption?.option_text ?? null,
        correctOptionId: correctOption?.id ?? null,
        correctOptionText: correctOption?.option_text ?? null,

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
      };
    });

    // Fallback to stored score if questions were not found (e.g. quiz structure changed)
    const resolvedScore = questions.length > 0 ? derivedScore : toNumber(attempt.score);
    const resolvedTotalMarks = toNumber(attempt.total_marks) || derivedTotalMarks;

    // Self-healing: if the DB score is wrong (e.g. from an old client-side submission bug), fix it
    if (questions.length > 0 && (attempt.score !== resolvedScore || attempt.total_marks !== resolvedTotalMarks)) {
      console.log(`[tests] Self-healing score for attempt ${attemptId}. DB had ${attempt.score}, calculated ${resolvedScore}.`);
      await adminClient
        .from("quiz_attempts")
        .update({ score: resolvedScore, total_marks: resolvedTotalMarks })
        .eq("id", attemptId);
    }

    // ── Compute rank ──────────────────────────────────────────────
    let rank: number | null = null;
    try {
      const { data: allAttempts } = await adminClient
        .from("quiz_attempts")
        .select("id, user_id, score")
        .eq("quiz_id", attempt.quiz_id)
        .in("status", ["submitted", "timed_out"]);

      if (allAttempts && allAttempts.length > 0) {
        // Best score per user
        const bestByUser = new Map<string, number>();
        for (const a of allAttempts) {
          const prev = bestByUser.get(a.user_id) ?? -1;
          if (toNumber(a.score) > prev) bestByUser.set(a.user_id, toNumber(a.score));
        }

        const myScore = bestByUser.get(user.id);
        if (myScore !== undefined) {
          // Standard Competition Ranking: 1 + number of users who scored higher
          let higherScores = 0;
          for (const [uid, score] of bestByUser.entries()) {
            if (uid !== user.id && score > myScore) {
              higherScores++;
            }
          }
          rank = higherScores + 1;
        }
      }
    } catch {
      // Rank is non-critical, proceed without it
    }

    return NextResponse.json({
      attemptId: attempt.id,
      userId: attempt.user_id,
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
      durationSec: attempt.time_spent_sec ?? null,
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
