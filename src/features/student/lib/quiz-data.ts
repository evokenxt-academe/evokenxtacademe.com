import type { SupabaseClient } from "@supabase/supabase-js";

/* ────────────────────────────────────────── */
/* Types                                      */
/* ────────────────────────────────────────── */

interface RowRecord {
  [key: string]: unknown;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  marks: number;
  position: number;
  options: QuizOption[];
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  sectionId: string;
  sectionTitle: string;
  courseName: string;
  courseSlug: string;
  questions: QuizQuestion[];
}

export interface QuizAttemptResult {
  attemptId: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  passed: boolean;
  status: string;
}

/* ────────────────────────────────────────── */
/* Helpers                                    */
/* ────────────────────────────────────────── */

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const p = Number.parseFloat(v);
    return Number.isFinite(p) ? p : 0;
  }
  return 0;
}

function int(v: unknown): number {
  return Math.max(0, Math.round(num(v)));
}

/* ────────────────────────────────────────── */
/* Fetch full quiz for the quiz-taking page   */
/* ────────────────────────────────────────── */

export async function fetchQuizForAttempt(
  supabase: SupabaseClient,
  userId: string,
  quizId: string,
): Promise<QuizDetail | null> {
  // 1. Get quiz + section + course
  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .select(
      "id, title, description, type, total_marks, passing_marks, time_limit_sec, is_published, section_id, sections!inner(id, title, course_id, courses!inner(id, name, slug))",
    )
    .eq("id", quizId)
    .eq("is_published", true)
    .maybeSingle();

  if (quizError) {
    console.error(`[quiz] fetch quiz: ${quizError.message}`);
  }

  if (!quizRow) return null;

  const row = quizRow as RowRecord;
  const sectionObj = row.sections as RowRecord | null;
  const courseObj = sectionObj?.courses as RowRecord | null;

  if (!sectionObj || !courseObj) return null;

  // 2. Verify the user is enrolled in the course
  const courseId = str(courseObj.id);
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) return null;

  // 3. Get questions + options (exclude is_correct for security)
  const { data: questionsData, error: qError } = await supabase
    .from("questions")
    .select("id, question, marks, position, options(id, text)")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (qError) {
    console.error(`[quiz] fetch questions: ${qError.message}`);
  }

  const questions: QuizQuestion[] = (
    Array.isArray(questionsData) ? (questionsData as RowRecord[]) : []
  )
    .map((q) => {
      const qId = str(q.id);
      const question = str(q.question);
      if (!qId || !question) return null;

      const opts = (Array.isArray(q.options) ? (q.options as RowRecord[]) : [])
        .map((o) => {
          const oId = str(o.id);
          const text = str(o.text);
          if (!oId || !text) return null;
          return { id: oId, text };
        })
        .filter((o): o is QuizOption => Boolean(o));

      return {
        id: qId,
        question,
        marks: int(q.marks),
        position: int(q.position),
        options: opts,
      };
    })
    .filter((q): q is QuizQuestion => Boolean(q));

  return {
    id: str(row.id),
    title: str(row.title),
    description: strOrNull(row.description),
    type: str(row.type),
    totalMarks: int(row.total_marks),
    passingMarks: int(row.passing_marks),
    timeLimitSec: row.time_limit_sec != null ? int(row.time_limit_sec) : null,
    sectionId: str(sectionObj.id),
    sectionTitle: str(sectionObj.title),
    courseName: str(courseObj.name),
    courseSlug: str(courseObj.slug),
    questions,
  };
}

/* ────────────────────────────────────────── */
/* Create a quiz attempt                      */
/* ────────────────────────────────────────── */

export async function createQuizAttempt(
  supabase: SupabaseClient,
  userId: string,
  quizId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[quiz] create attempt: ${error.message}`);
    return null;
  }

  return str((data as RowRecord).id);
}

/* ────────────────────────────────────────── */
/* Submit quiz answers                        */
/* ────────────────────────────────────────── */

export async function submitQuizAttempt(
  supabase: SupabaseClient,
  userId: string,
  attemptId: string,
  answers: Array<{ questionId: string; selectedOptionId: string }>,
): Promise<QuizAttemptResult | null> {
  // 1. Verify attempt belongs to user and is in_progress
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (attemptError || !attempt) {
    console.error(`[quiz] verify attempt: ${attemptError?.message ?? "not found"}`);
    return null;
  }

  const attemptRow = attempt as RowRecord;
  const quizId = str(attemptRow.quiz_id);

  // 2. Get quiz details and correct answers
  const { data: quizData } = await supabase
    .from("quizzes")
    .select("total_marks, passing_marks")
    .eq("id", quizId)
    .single();

  const quiz = quizData as RowRecord | null;
  if (!quiz) return null;

  const passingMarks = int(quiz.passing_marks);

  // 3. Get all questions and correct options
  const { data: questionsData } = await supabase
    .from("questions")
    .select("id, marks, options(id, is_correct)")
    .eq("quiz_id", quizId);

  const questions = Array.isArray(questionsData) ? (questionsData as RowRecord[]) : [];

  // Build map of question -> correct option IDs and marks
  const questionMap = new Map<string, { correctIds: Set<string>; marks: number }>();
  for (const q of questions) {
    const qId = str(q.id);
    const marks = int(q.marks);
    const options = Array.isArray(q.options) ? (q.options as RowRecord[]) : [];
    const correctIds = new Set(
      options.filter((o) => o.is_correct === true).map((o) => str(o.id)),
    );
    questionMap.set(qId, { correctIds, marks });
  }

  // 4. Calculate score
  let score = 0;
  for (const answer of answers) {
    const q = questionMap.get(answer.questionId);
    if (q && q.correctIds.has(answer.selectedOptionId)) {
      score += q.marks;
    }
  }

  // 5. Insert answers
  const answerRows = answers.map((a) => ({
    attempt_id: attemptId,
    question_id: a.questionId,
    selected_option_id: a.selectedOptionId,
  }));

  if (answerRows.length > 0) {
    const { error: answerError } = await supabase
      .from("quiz_answers")
      .insert(answerRows);

    if (answerError) {
      console.error(`[quiz] insert answers: ${answerError.message}`);
    }
  }

  // 6. Update attempt with score
  const totalMarks = int(quiz.total_marks);
  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      score,
      total_marks: totalMarks,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (updateError) {
    console.error(`[quiz] update attempt: ${updateError.message}`);
    return null;
  }

  return {
    attemptId,
    score,
    totalMarks,
    passingMarks,
    passed: score >= passingMarks,
    status: "submitted",
  };
}
