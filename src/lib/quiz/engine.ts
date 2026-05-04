/**
 * Quiz Engine
 * Supports 7 question types with grading logic
 */

import type {
  Quiz,
  QuizQuestion,
  QuestionType,
  QuizAttempt,
  QuestionResponse,
} from "@/types/database-v2.types";

export interface QuizGradingResult {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  feedback?: string;
}

export interface QuizSubmissionResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  results: QuizGradingResult[];
  timeSpent: number;
}

/**
 * Grade a single question response based on question type
 */
export function gradeQuestion(
  question: QuizQuestion,
  response: QuestionResponse
): QuizGradingResult {
  const maxPoints = question.points || 1;

  switch (question.question_type) {
    case "multiple_choice":
      return gradeMultipleChoice(question, response, maxPoints);

    case "true_false":
      return gradeTrueFalse(question, response, maxPoints);

    case "short_answer":
      return gradeShortAnswer(question, response, maxPoints);

    case "essay":
      return gradeEssay(question, response, maxPoints);

    case "matching":
      return gradeMatching(question, response, maxPoints);

    case "fill_blanks":
      return gradeFillBlanks(question, response, maxPoints);

    case "multi_select":
      return gradeMultiSelect(question, response, maxPoints);

    default:
      return {
        questionId: question.id,
        isCorrect: false,
        earnedPoints: 0,
        maxPoints,
      };
  }
}

/**
 * Grade multiple choice question
 */
function gradeMultipleChoice(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const correctAnswer = question.correct_answer;
  const isCorrect = response.answer === correctAnswer;

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints: isCorrect ? maxPoints : 0,
    maxPoints,
    feedback: isCorrect
      ? "Correct!"
      : `The correct answer is ${correctAnswer}`,
  };
}

/**
 * Grade true/false question
 */
function gradeTrueFalse(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const correctAnswer = question.correct_answer === "true";
  const userAnswer = response.answer === "true";
  const isCorrect = userAnswer === correctAnswer;

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints: isCorrect ? maxPoints : 0,
    maxPoints,
    feedback: isCorrect ? "Correct!" : `The correct answer is ${correctAnswer}`,
  };
}

/**
 * Grade short answer question (case-insensitive exact match)
 */
function gradeShortAnswer(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const correctAnswers = (question.correct_answer || "")
    .split("|")
    .map((a) => a.trim().toLowerCase());
  const userAnswer = (response.answer || "").trim().toLowerCase();

  const isCorrect = correctAnswers.includes(userAnswer);

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints: isCorrect ? maxPoints : 0,
    maxPoints,
    feedback: isCorrect
      ? "Correct!"
      : `Expected answers: ${correctAnswers.join(", ")}`,
  };
}

/**
 * Grade essay question (manual grading flag)
 */
function gradeEssay(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const minWords = question.metadata?.minWords || 50;
  const wordCount = (response.answer || "").split(/\s+/).length;

  const meetsMinimum = wordCount >= minWords;

  return {
    questionId: question.id,
    isCorrect: meetsMinimum,
    earnedPoints: 0, // Essays require manual grading
    maxPoints,
    feedback: meetsMinimum
      ? `Your essay meets the minimum ${minWords} words. Awaiting instructor review.`
      : `Please write at least ${minWords} words.`,
  };
}

/**
 * Grade matching question
 */
function gradeMatching(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const pairs = question.metadata?.pairs || [];
  const userMatches = response.answer || {};

  let correctCount = 0;
  for (const pair of pairs) {
    if (userMatches[pair.left] === pair.right) {
      correctCount++;
    }
  }

  const isCorrect = correctCount === pairs.length;
  const earnedPoints = Math.round((correctCount / pairs.length) * maxPoints);

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints,
    maxPoints,
    feedback: `Matched ${correctCount} of ${pairs.length} correctly.`,
  };
}

/**
 * Grade fill in the blanks question
 */
function gradeFillBlanks(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const blanks = question.metadata?.blanks || [];
  const userAnswers = response.answer || {};

  let correctCount = 0;
  for (const blank of blanks) {
    const userAnswer = (userAnswers[blank.id] || "").trim().toLowerCase();
    const correctAnswer = (blank.answer || "").trim().toLowerCase();

    if (userAnswer === correctAnswer) {
      correctCount++;
    }
  }

  const isCorrect = correctCount === blanks.length;
  const earnedPoints = Math.round((correctCount / blanks.length) * maxPoints);

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints,
    maxPoints,
    feedback: `Filled ${correctCount} of ${blanks.length} correctly.`,
  };
}

/**
 * Grade multi-select question
 */
function gradeMultiSelect(
  question: QuizQuestion,
  response: QuestionResponse,
  maxPoints: number
): QuizGradingResult {
  const correctAnswers = question.correct_answer || "";
  const correctSet = new Set(correctAnswers.split("|").map((a) => a.trim()));
  const userSet = new Set(response.answer || []);

  // Check if sets are equal
  const isCorrect =
    correctSet.size === userSet.size &&
    Array.from(correctSet).every((item) => userSet.has(item));

  return {
    questionId: question.id,
    isCorrect,
    earnedPoints: isCorrect ? maxPoints : 0,
    maxPoints,
    feedback: isCorrect
      ? "All selections are correct!"
      : "Some selections are incorrect.",
  };
}

/**
 * Grade an entire quiz submission
 */
export function gradeQuizSubmission(
  questions: QuizQuestion[],
  responses: QuestionResponse[],
  startTime: number,
  endTime: number
): QuizSubmissionResult {
  const responseMap = new Map(responses.map((r) => [r.questionId, r]));
  const results: QuizGradingResult[] = [];
  let totalEarned = 0;
  let totalMax = 0;

  for (const question of questions) {
    const response = responseMap.get(question.id);
    if (!response) continue;

    const result = gradeQuestion(question, response);
    results.push(result);
    totalEarned += result.earnedPoints;
    totalMax += result.maxPoints;
  }

  const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const passingPercentage = 60; // Default passing score

  return {
    score: totalEarned,
    maxScore: totalMax,
    percentage: Math.round(percentage),
    passed: percentage >= passingPercentage,
    results,
    timeSpent: Math.round((endTime - startTime) / 1000), // in seconds
  };
}

/**
 * Check if quiz is available for user
 */
export async function isQuizAvailable(
  supabase: any,
  quizId: string,
  userId: string
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Get quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, chapter_id, is_released")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return { available: false, reason: "Quiz not found" };
    }

    if (!quiz.is_released) {
      return { available: false, reason: "Quiz not yet released" };
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", quiz.chapter_id) // Assuming chapter has course_id
      .eq("status", "active")
      .single();

    if (!enrollment) {
      return { available: false, reason: "Not enrolled in course" };
    }

    return { available: true };
  } catch (err) {
    return { available: false, reason: (err as Error).message };
  }
}
