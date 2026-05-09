import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/adminClient";
import type { QuestionType } from "@/types/supabase";

type AnswerDraft =
  | { kind: "mcq"; selected_option_id: string | null }
  | { kind: "multiple_select"; selected_option_ids: string[] }
  | { kind: "true_false"; selected_option_id: string | null }
  | { kind: "fill_blank"; blank_answer: string }
  | { kind: "numerical"; numerical_answer: number | null }
  | { kind: "subjective"; text_answer: string }
  | { kind: "assertion_reasoning"; selected_option_id: string | null };

function lowerTrim(s: string): string {
  return s.trim().toLowerCase();
}

function safeNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await params;
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as
    | {
        action: "start";
      }
    | {
        action: "submit";
        attemptId: string;
        status?: "submitted" | "timed_out";
        timeSpentSec?: number;
        answers: Array<{ questionId: string; answer: AnswerDraft | null }>;
      };

  if (body.action === "start") {
    // If there's an existing in-progress attempt, return it (resume).
    const { data: existingAttempt, error: existingError } = await supabase
      .from("quiz_attempts")
      .select("id, attempt_number")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingAttempt?.id) {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        attemptNumber: existingAttempt.attempt_number,
      });
    }

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, max_attempts, course_id, is_published")
      .eq("id", quizId)
      .eq("is_published", true)
      .maybeSingle();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", quiz.course_id)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
    }

    const { data: lastAttempt } = await supabase
      .from("quiz_attempts")
      .select("attempt_number")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextAttemptNumber = (lastAttempt?.attempt_number ?? 0) + 1;
    const maxAttempts = quiz.max_attempts ?? null;
    if (maxAttempts != null && nextAttemptNumber > maxAttempts) {
      return NextResponse.json({ error: "Max attempts reached" }, { status: 403 });
    }

    const { data: created, error: createError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        attempt_number: nextAttemptNumber,
        status: "in_progress",
      })
      .select("id, attempt_number")
      .single();

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? "Could not create attempt" }, { status: 500 });
    }

    return NextResponse.json({ attemptId: created.id, attemptNumber: created.attempt_number });
  }

  if (body.action === "submit") {
    if (!body.attemptId || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Missing attemptId or answers" }, { status: 400 });
    }

    const attemptId = body.attemptId;
    const admin = createAdminClient() as any;

    // Verify attempt belongs to user and is in progress
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, status, score, total_marks, passed, time_spent_sec, submitted_at")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    const { data: quiz, error: quizError } = await admin
      .from("quizzes")
      .select("id, total_marks, passing_marks, show_answers_after")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (attempt.status !== "in_progress") {
      const totalMarks = safeNum(attempt.total_marks) || safeNum(quiz.total_marks);
      const score = safeNum(attempt.score);
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const passed =
        typeof attempt.passed === "boolean"
          ? attempt.passed
          : score >= safeNum(quiz.passing_marks);

      return NextResponse.json({
        attemptId: attempt.id,
        score,
        totalMarks,
        percentage,
        passed,
        status: attempt.status,
        timeSpentSec: safeNum(attempt.time_spent_sec),
        canReview: false,
        review: undefined,
      });
    }

    const { data: questions, error: qError } = await admin
      .from("questions")
      .select(
        `id, type, question_text, marks, negative_marks, position,
         blank_placeholder, numerical_answer, numerical_tolerance, explanation,
         options:question_options(id, is_correct, option_text)`,
      )
      .eq("quiz_id", quizId)
      .order("position", { ascending: true });

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    const byId = new Map<string, any>(
      (questions ?? []).map((q: any) => [
        q.id,
        q
      ]),
    );

    let score = 0;
    const answerRows: Array<Record<string, unknown>> = [];

    for (const item of body.answers) {
      const q = byId.get(item.questionId);
      if (!q) continue;

      const marks = safeNum(q.marks);
      const negative = safeNum(q.negative_marks);
      const ans = item.answer;

      let isCorrect: boolean | null = null;
      let marksAwarded = 0;

      const correctOptionIds = new Set(
        (q.options ?? []).filter((o) => o.is_correct === true).map((o) => o.id),
      );

      if (!ans) {
        isCorrect = false;
        marksAwarded = 0;
      } else {
        switch (q.type) {
          case "mcq":
          case "true_false":
          case "assertion_reasoning": {
            const selected = (ans as any).selected_option_id as string | null;
            isCorrect = selected ? correctOptionIds.has(selected) : false;
            marksAwarded = isCorrect ? marks : -negative;
            answerRows.push({
              attempt_id: attemptId,
              question_id: q.id,
              selected_option_id: selected,
              selected_option_ids: null,
              text_answer: null,
              blank_answer: null,
              numerical_answer: null,
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            });
            break;
          }
          case "multiple_select": {
            const selected = ((ans as any).selected_option_ids as string[]) ?? [];
            const selectedSet = new Set(selected);
            const totalCorrect = correctOptionIds.size;
            const correctSelected = selected.filter((id) => correctOptionIds.has(id)).length;
            const wrongSelected = selected.filter((id) => !correctOptionIds.has(id)).length;

            if (totalCorrect === 0) {
              isCorrect = false;
              marksAwarded = 0;
            } else if (wrongSelected > 0) {
              isCorrect = false;
              marksAwarded = -negative;
            } else {
              const fraction = correctSelected / totalCorrect;
              isCorrect = fraction === 1 && selectedSet.size === totalCorrect;
              marksAwarded = Math.round(marks * fraction);
            }
            answerRows.push({
              attempt_id: attemptId,
              question_id: q.id,
              selected_option_id: null,
              selected_option_ids: selected,
              text_answer: null,
              blank_answer: null,
              numerical_answer: null,
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            });
            break;
          }
          case "fill_blank": {
            const blank = String((ans as any).blank_answer ?? "");
            const expected = q.blank_placeholder ?? "";
            isCorrect = lowerTrim(blank) === lowerTrim(expected);
            marksAwarded = isCorrect ? marks : -negative;
            answerRows.push({
              attempt_id: attemptId,
              question_id: q.id,
              selected_option_id: null,
              selected_option_ids: null,
              text_answer: null,
              blank_answer: blank,
              numerical_answer: null,
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            });
            break;
          }
          case "numerical": {
            const n = (ans as any).numerical_answer as number | null;
            const expected = q.numerical_answer;
            const tol = q.numerical_tolerance ?? 0;
            if (typeof n !== "number" || expected == null) {
              isCorrect = false;
              marksAwarded = 0;
            } else {
              isCorrect = Math.abs(n - expected) <= tol;
              marksAwarded = isCorrect ? marks : -negative;
            }
            answerRows.push({
              attempt_id: attemptId,
              question_id: q.id,
              selected_option_id: null,
              selected_option_ids: null,
              text_answer: null,
              blank_answer: null,
              numerical_answer: n,
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            });
            break;
          }
          case "subjective": {
            const text = String((ans as any).text_answer ?? "");
            isCorrect = null;
            marksAwarded = 0;
            answerRows.push({
              attempt_id: attemptId,
              question_id: q.id,
              selected_option_id: null,
              selected_option_ids: null,
              text_answer: text,
              blank_answer: null,
              numerical_answer: null,
              is_correct: null,
              marks_awarded: 0,
            });
            break;
          }
        }
      }

      score += marksAwarded;
    }

    // Upsert answers (idempotent)
    for (const row of answerRows) {
      const { error } = await admin
        .from("quiz_answers")
        .upsert(row, { onConflict: "attempt_id,question_id" });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const totalMarks = safeNum(quiz.total_marks);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = score >= safeNum(quiz.passing_marks);

    const finalStatus = body.status === "timed_out" ? "timed_out" : "submitted";

    const { error: updError } = await supabase
      .from("quiz_attempts")
      .update({
        status: finalStatus,
        score,
        total_marks: totalMarks,
        passed,
        time_spent_sec: safeNum(body.timeSpentSec),
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("user_id", user.id);

    if (updError) {
      return NextResponse.json({ error: updError.message }, { status: 500 });
    }

    const canReview =
      quiz.show_answers_after === "submit" ||
      (quiz.show_answers_after === "pass" && passed);

    let review: unknown[] | undefined;
    if (canReview) {
      const { data: reviewData, error: reviewError } = await admin
        .from("quiz_answers")
        .select(
          `question_id, selected_option_id, selected_option_ids, text_answer, blank_answer, numerical_answer, marks_awarded, is_correct,
           question:questions(question_text, explanation, options:question_options(id, option_text, is_correct))`,
        )
        .eq("attempt_id", attemptId);

      if (reviewError) {
        return NextResponse.json({ error: reviewError.message }, { status: 500 });
      }

      review = (reviewData ?? []).map((r: any) => {
        const optionList = Array.isArray(r?.question?.options)
          ? r.question.options
          : [];

        return {
        question_id: r.question_id,
        question_text: r.question?.question_text ?? "",
        explanation: r.question?.explanation ?? null,
        is_correct: r.is_correct ?? null,
        marks_awarded: r.marks_awarded ?? null,
        selected_option_id: r.selected_option_id ?? null,
        selected_option_ids: r.selected_option_ids ?? null,
        blank_answer: r.blank_answer ?? null,
        text_answer: r.text_answer ?? null,
        numerical_answer: r.numerical_answer ?? null,
        options: optionList.map((o: any) => ({
          id: o.id,
          option_text: o.option_text,
          option_is_correct: o.is_correct ?? null,
        })),
      };
      });
    }

    return NextResponse.json({
      attemptId,
      score,
      totalMarks,
      percentage,
      passed,
      status: finalStatus,
      timeSpentSec: safeNum(body.timeSpentSec),
      canReview,
      review,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
