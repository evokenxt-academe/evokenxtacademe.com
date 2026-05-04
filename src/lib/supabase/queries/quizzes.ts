/**
 * Quizzes Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for quizzes, questions, attempts, and answers (7 question types)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  Quiz,
  Question,
  QuestionOption,
  QuizAttempt,
  QuizAnswer,
  QuizWithQuestions,
  AttemptWithAnswers,
  QuizType,
  QuestionType,
  AttemptStatus,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/quizzes] ${scope}: ${msg}`);
  return msg;
}

// ─── Quiz Queries ──────────────────────────────────────────────────

/**
 * Fetch published quizzes for a course
 */
export async function getCourseQuizzes(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<Quiz[]>> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  const errMsg = handleError("getCourseQuizzes", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch quizzes for a chapter
 */
export async function getChapterQuizzes(
  supabase: SupabaseClient<Database>,
  chapterId: string
): Promise<QueryResult<Quiz[]>> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  const errMsg = handleError("getChapterQuizzes", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch a quiz by ID with questions and options
 */
export async function getQuizById(
  supabase: SupabaseClient<Database>,
  quizId: string
): Promise<QueryResult<QuizWithQuestions>> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(`
      *,
      questions:questions!quiz_id(
        *,
        options:question_options!question_id(*)
      )
    `)
    .eq("id", quizId)
    .maybeSingle();

  const errMsg = handleError("getQuizById", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!data) return { data: null, error: null };

  // Sort questions by position and options within each question
  const sorted = {
    ...data,
    questions: (data.questions ?? [])
      .sort((a: Question, b: Question) => a.position - b.position)
      .map((question: Question & { options: QuestionOption[] }) => ({
        ...question,
        options: (question.options ?? []).sort(
          (a: QuestionOption, b: QuestionOption) => a.position - b.position
        ),
      })),
  };

  return { data: sorted as unknown as QuizWithQuestions, error: null };
}

/**
 * Fetch a quiz for taking (shuffled if configured)
 */
export async function getQuizForAttempt(
  supabase: SupabaseClient<Database>,
  quizId: string
): Promise<QueryResult<QuizWithQuestions>> {
  const result = await getQuizById(supabase, quizId);
  if (result.error || !result.data) return result;

  const quiz = result.data;

  // Shuffle questions if configured
  if (quiz.shuffle_questions) {
    quiz.questions = shuffleArray(quiz.questions);
  }

  // Shuffle options if configured
  if (quiz.shuffle_options) {
    quiz.questions = quiz.questions.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
  }

  return { data: quiz, error: null };
}

// ─── Question Queries ──────────────────────────────────────────────

/**
 * Fetch a question by ID with options
 */
export async function getQuestionById(
  supabase: SupabaseClient<Database>,
  questionId: string
): Promise<QueryResult<Question & { options: QuestionOption[] }>> {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      options:question_options!question_id(*)
    `)
    .eq("id", questionId)
    .maybeSingle();

  const errMsg = handleError("getQuestionById", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!data) return { data: null, error: null };

  // Sort options by position
  const sorted = {
    ...data,
    options: (data.options ?? []).sort(
      (a: QuestionOption, b: QuestionOption) => a.position - b.position
    ),
  };

  return { data: sorted as unknown as Question & { options: QuestionOption[] }, error: null };
}

/**
 * Fetch questions by type for a quiz
 */
export async function getQuestionsByType(
  supabase: SupabaseClient<Database>,
  quizId: string,
  type: QuestionType
): Promise<QueryResult<(Question & { options: QuestionOption[] })[]>> {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      options:question_options!question_id(*)
    `)
    .eq("quiz_id", quizId)
    .eq("type", type)
    .order("position", { ascending: true });

  const errMsg = handleError("getQuestionsByType", error);
  if (errMsg) return { data: null, error: errMsg };

  return {
    data: data as unknown as (Question & { options: QuestionOption[] })[],
    error: null,
  };
}

// ─── Attempt Queries ───────────────────────────────────────────────

/**
 * Get attempts for a quiz by a user
 */
export async function getUserQuizAttempts(
  supabase: SupabaseClient<Database>,
  userId: string,
  quizId: string
): Promise<QueryResult<QuizAttempt[]>> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("started_at", { ascending: false });

  const errMsg = handleError("getUserQuizAttempts", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Get an attempt by ID with answers
 */
export async function getAttemptById(
  supabase: SupabaseClient<Database>,
  attemptId: string
): Promise<QueryResult<AttemptWithAnswers>> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(`
      *,
      quiz:quizzes!quiz_id(*),
      answers:quiz_answers!attempt_id(
        *,
        question:questions!question_id(
          *,
          options:question_options!question_id(*)
        )
      )
    `)
    .eq("id", attemptId)
    .maybeSingle();

  const errMsg = handleError("getAttemptById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as AttemptWithAnswers, error: null };
}

/**
 * Get in-progress attempt for a user on a quiz
 */
export async function getInProgressAttempt(
  supabase: SupabaseClient<Database>,
  userId: string,
  quizId: string
): Promise<QueryResult<QuizAttempt>> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .eq("status", "in_progress")
    .maybeSingle();

  const errMsg = handleError("getInProgressAttempt", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as QuizAttempt | null, error: null };
}

/**
 * Get best attempt for a user on a quiz
 */
export async function getBestAttempt(
  supabase: SupabaseClient<Database>,
  userId: string,
  quizId: string
): Promise<QueryResult<QuizAttempt>> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .eq("status", "submitted")
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const errMsg = handleError("getBestAttempt", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as QuizAttempt | null, error: null };
}

/**
 * Check if user can attempt quiz (based on max_attempts)
 */
export async function canAttemptQuiz(
  supabase: SupabaseClient<Database>,
  userId: string,
  quizId: string
): Promise<QueryResult<{ canAttempt: boolean; attemptsUsed: number; maxAttempts: number | null; message: string }>> {
  // Get quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("max_attempts, is_published")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError) {
    const errMsg = handleError("canAttemptQuiz:quiz", quizError);
    return { data: null, error: errMsg };
  }

  if (!quiz || !quiz.is_published) {
    return {
      data: { canAttempt: false, attemptsUsed: 0, maxAttempts: null, message: "Quiz not available" },
      error: null,
    };
  }

  // Get attempt count
  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .in("status", ["submitted", "timed_out"]);

  if (attemptsError) {
    const errMsg = handleError("canAttemptQuiz:attempts", attemptsError);
    return { data: null, error: errMsg };
  }

  const attemptsUsed = (attempts ?? []).length;
  const maxAttempts = quiz.max_attempts;

  if (maxAttempts !== null && attemptsUsed >= maxAttempts) {
    return {
      data: {
        canAttempt: false,
        attemptsUsed,
        maxAttempts,
        message: `Maximum attempts (${maxAttempts}) reached`,
      },
      error: null,
    };
  }

  return {
    data: { canAttempt: true, attemptsUsed, maxAttempts, message: "Quiz available" },
    error: null,
  };
}

// ─── Answer Queries ────────────────────────────────────────────────

/**
 * Get answers for an attempt
 */
export async function getAttemptAnswers(
  supabase: SupabaseClient<Database>,
  attemptId: string
): Promise<QueryResult<QuizAnswer[]>> {
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  const errMsg = handleError("getAttemptAnswers", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Get a specific answer for a question in an attempt
 */
export async function getAnswer(
  supabase: SupabaseClient<Database>,
  attemptId: string,
  questionId: string
): Promise<QueryResult<QuizAnswer>> {
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();

  const errMsg = handleError("getAnswer", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as QuizAnswer | null, error: null };
}

// ─── Attempt Mutations ─────────────────────────────────────────────

/**
 * Start a new quiz attempt
 */
export async function startAttempt(
  supabase: SupabaseClient<Database>,
  userId: string,
  quizId: string
): Promise<QueryResult<QuizAttempt>> {
  // Check if can attempt
  const canAttempt = await canAttemptQuiz(supabase, userId, quizId);
  if (canAttempt.error) return { data: null, error: canAttempt.error };
  if (!canAttempt.data?.canAttempt) {
    return { data: null, error: canAttempt.data?.message ?? "Cannot start attempt" };
  }

  // Check for existing in-progress attempt
  const { data: existing } = await getInProgressAttempt(supabase, userId, quizId);
  if (existing) {
    return { data: existing, error: null };
  }

  // Get quiz total marks
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("total_marks")
    .eq("id", quizId)
    .single();

  if (quizError) {
    const errMsg = handleError("startAttempt:quiz", quizError);
    return { data: null, error: errMsg };
  }

  // Create new attempt
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      total_marks: quiz.total_marks,
      attempt_number: canAttempt.data.attemptsUsed + 1,
      status: "in_progress",
      score: 0,
    })
    .select()
    .single();

  const errMsg = handleError("startAttempt:insert", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as QuizAttempt, error: null };
}

/**
 * Submit a quiz attempt
 */
export async function submitAttempt(
  supabase: SupabaseClient<Database>,
  attemptId: string,
  timeSpentSec: number
): Promise<QueryResult<QuizAttempt>> {
  // Get attempt with answers
  const { data: attempt, error: attemptError } = await getAttemptById(supabase, attemptId);
  if (attemptError) return { data: null, error: attemptError };
  if (!attempt) return { data: null, error: "Attempt not found" };
  if (attempt.status !== "in_progress") {
    return { data: null, error: "Attempt already submitted" };
  }

  // Calculate score
  const score = calculateScore(attempt.answers);
  const totalMarks = attempt.total_marks;
  const passed = attempt.quiz.passing_marks > 0 ? score >= attempt.quiz.passing_marks : null;

  // Update attempt
  const { data, error } = await supabase
    .from("quiz_attempts")
    .update({
      status: "submitted",
      score,
      passed,
      time_spent_sec: timeSpentSec,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .select()
    .single();

  const errMsg = handleError("submitAttempt", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as QuizAttempt, error: null };
}

/**
 * Save an answer (upsert)
 */
export async function saveAnswer(
  supabase: SupabaseClient<Database>,
  attemptId: string,
  questionId: string,
  answer: {
    selected_option_id?: string;
    selected_option_ids?: string[];
    text_answer?: string;
    blank_answer?: string;
    numerical_answer?: number;
    is_marked_for_review?: boolean;
  }
): Promise<QueryResult<QuizAnswer>> {
  // Get question to validate answer type
  const { data: question, error: questionError } = await getQuestionById(supabase, questionId);
  if (questionError) return { data: null, error: questionError };
  if (!question) return { data: null, error: "Question not found" };

  // Validate and grade the answer
  const { is_correct, marks_awarded } = gradeAnswer(question, answer);

  // Check if answer exists
  const { data: existing } = await getAnswer(supabase, attemptId, questionId);

  const answerData = {
    ...answer,
    is_correct,
    marks_awarded,
    answered_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("quiz_answers")
      .update(answerData)
      .eq("id", existing.id)
      .select()
      .single();

    const errMsg = handleError("saveAnswer:update", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as QuizAnswer, error: null };
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("quiz_answers")
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        ...answerData,
      })
      .select()
      .single();

    const errMsg = handleError("saveAnswer:insert", error);
    if (errMsg) return { data: null, error: errMsg };

    return { data: data as QuizAnswer, error: null };
  }
}

// ─── Grading Helpers ───────────────────────────────────────────────

/**
 * Grade an answer based on question type
 */
function gradeAnswer(
  question: Question & { options: QuestionOption[] },
  answer: {
    selected_option_id?: string;
    selected_option_ids?: string[];
    text_answer?: string;
    blank_answer?: string;
    numerical_answer?: number;
  }
): { is_correct: boolean | null; marks_awarded: number } {
  const { type, marks, negative_marks } = question;

  switch (type) {
    case "mcq":
    case "true_false":
    case "assertion_reasoning": {
      const correctOption = question.options.find((o) => o.is_correct);
      if (!correctOption || !answer.selected_option_id) {
        return { is_correct: null, marks_awarded: 0 };
      }
      const isCorrect = answer.selected_option_id === correctOption.id;
      return {
        is_correct: isCorrect,
        marks_awarded: isCorrect ? marks : -negative_marks,
      };
    }

    case "multiple_select": {
      const correctOptionIds = new Set(
        question.options.filter((o) => o.is_correct).map((o) => o.id)
      );
      const selectedIds = new Set(answer.selected_option_ids ?? []);

      if (selectedIds.size === 0) {
        return { is_correct: null, marks_awarded: 0 };
      }

      // All selected must be correct, and all correct must be selected
      const allCorrectSelected = [...correctOptionIds].every((id) => selectedIds.has(id));
      const noIncorrectSelected = [...selectedIds].every((id) => correctOptionIds.has(id));
      const isCorrect = allCorrectSelected && noIncorrectSelected;

      // Partial credit: proportion of correct answers
      if (!isCorrect) {
        const correctSelected = [...selectedIds].filter((id) => correctOptionIds.has(id)).length;
        const incorrectSelected = [...selectedIds].filter((id) => !correctOptionIds.has(id)).length;
        const partialMarks = (correctSelected / correctOptionIds.size) * marks;
        const penalty = incorrectSelected * (negative_marks / question.options.length);
        return {
          is_correct: false,
          marks_awarded: Math.max(0, partialMarks - penalty),
        };
      }

      return { is_correct: true, marks_awarded: marks };
    }

    case "fill_blank": {
      if (!answer.blank_answer) {
        return { is_correct: null, marks_awarded: 0 };
      }
      // Get correct answer from options (first correct option)
      const correctOption = question.options.find((o) => o.is_correct);
      if (!correctOption) {
        return { is_correct: null, marks_awarded: 0 };
      }
      // Case-insensitive comparison
      const isCorrect =
        answer.blank_answer.trim().toLowerCase() ===
        correctOption.option_text.trim().toLowerCase();
      return {
        is_correct: isCorrect,
        marks_awarded: isCorrect ? marks : -negative_marks,
      };
    }

    case "numerical": {
      if (answer.numerical_answer === undefined || question.numerical_answer === null) {
        return { is_correct: null, marks_awarded: 0 };
      }
      const tolerance = question.numerical_tolerance ?? 0;
      const diff = Math.abs(answer.numerical_answer - question.numerical_answer);
      const isCorrect = diff <= tolerance;
      return {
        is_correct: isCorrect,
        marks_awarded: isCorrect ? marks : -negative_marks,
      };
    }

    case "subjective": {
      // Subjective answers require manual grading
      return { is_correct: null, marks_awarded: 0 };
    }

    default:
      return { is_correct: null, marks_awarded: 0 };
  }
}

/**
 * Calculate total score from answers
 */
function calculateScore(
  answers: Array<{ marks_awarded: number | null }>
): number {
  return answers.reduce((total, a) => total + (a.marks_awarded ?? 0), 0);
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Quiz Analytics ────────────────────────────────────────────────

/**
 * Get quiz statistics
 */
export async function getQuizStats(
  supabase: SupabaseClient<Database>,
  quizId: string
): Promise<QueryResult<{
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
}>> {
  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select("score, total_marks, passed, status, time_spent_sec")
    .eq("quiz_id", quizId)
    .in("status", ["submitted", "timed_out"]);

  const errMsg = handleError("getQuizStats", error);
  if (errMsg) return { data: null, error: errMsg };

  const completedAttempts = attempts ?? [];
  const totalAttempts = completedAttempts.length;

  if (totalAttempts === 0) {
    return {
      data: {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
      },
      error: null,
    };
  }

  const totalScore = completedAttempts.reduce((sum, a) => sum + a.score, 0);
  const passedCount = completedAttempts.filter((a) => a.passed === true).length;
  const totalTime = completedAttempts.reduce((sum, a) => sum + a.time_spent_sec, 0);

  return {
    data: {
      totalAttempts,
      completedAttempts: totalAttempts,
      averageScore: totalScore / totalAttempts,
      passRate: (passedCount / totalAttempts) * 100,
      averageTimeSpent: totalTime / totalAttempts,
    },
    error: null,
  };
}

/**
 * Get question performance stats
 */
export async function getQuestionStats(
  supabase: SupabaseClient<Database>,
  questionId: string
): Promise<QueryResult<{
  totalAnswers: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  correctRate: number;
}>> {
  const { data: answers, error } = await supabase
    .from("quiz_answers")
    .select("is_correct")
    .eq("question_id", questionId);

  const errMsg = handleError("getQuestionStats", error);
  if (errMsg) return { data: null, error: errMsg };

  const allAnswers = answers ?? [];
  const totalAnswers = allAnswers.length;

  if (totalAnswers === 0) {
    return {
      data: {
        totalAnswers: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        correctRate: 0,
      },
      error: null,
    };
  }

  const correctCount = allAnswers.filter((a) => a.is_correct === true).length;
  const incorrectCount = allAnswers.filter((a) => a.is_correct === false).length;
  const skippedCount = allAnswers.filter((a) => a.is_correct === null).length;

  return {
    data: {
      totalAnswers,
      correctCount,
      incorrectCount,
      skippedCount,
      correctRate: (correctCount / totalAnswers) * 100,
    },
    error: null,
  };
}
