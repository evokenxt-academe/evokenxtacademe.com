/**
 * ============================================================
 * Evoke EduGlobal LMS v2.0.0 - Quiz Engine
 * ============================================================
 * Supports 7 question types with validation & scoring
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    Database,
    Quiz,
    Question,
    QuizAttempt,
    QuestionType,
} from "@/types/database.v2.types";

// ============================================================
// QUESTION TYPE VALIDATION
// ============================================================

export interface QuestionAnswer {
    questionId: string;
    questionType: QuestionType;
    answer: string | string[] | number | boolean | null;
}

export interface ScoredAnswer {
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
}

/**
 * Validate MCQ answer
 */
export function validateMCQ(
    question: Question & { options?: any[] },
    selectedOptionId: string,
): ScoredAnswer {
    const selected = question.options?.find((opt: any) => opt.id === selectedOptionId);

    if (!selected) {
        return {
            questionId: question.id,
            isCorrect: false,
            marksAwarded: question.negative_marks ? -question.negative_marks : 0,
        };
    }

    const isCorrect = selected.is_correct;

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
        explanation: selected.explanation,
    };
}

/**
 * Validate Multiple Select (multiple correct answers)
 */
export function validateMultipleSelect(
    question: Question & { options?: any[] },
    selectedOptionIds: string[],
): ScoredAnswer {
    const correctOptions = question.options?.filter((opt: any) => opt.is_correct) ?? [];
    const selectedCorrect = selectedOptionIds.every((id: string) =>
        correctOptions.some((opt: any) => opt.id === id),
    );
    const allSelected = selectedOptionIds.length === correctOptions.length;

    const isCorrect = selectedCorrect && allSelected;

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
    };
}

/**
 * Validate True/False
 */
export function validateTrueFalse(
    question: Question & { options?: any[] },
    answer: boolean,
): ScoredAnswer {
    const isCorrect = answer === question.true_false_answer;

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
    };
}

/**
 * Validate Assertion & Reasoning
 * (Statement + Reason; both must be correct AND reasoning explains statement)
 */
export function validateAssertionReasoning(
    question: Question & { options?: any[] },
    selectedOptionIds: string[],
): ScoredAnswer {
    // This typically has 4 options:
    // A: Both true and reasoning correct
    // B: Both true but reasoning incorrect
    // C: Statement true but reasoning false
    // D: Both false
    const selected = question.options?.find((opt: any) => opt.id === selectedOptionIds[0]);
    const isCorrect = selected?.is_correct ?? false;

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
        explanation: selected?.explanation,
    };
}

/**
 * Validate Fill in the Blank (text matching)
 */
export function validateFillBlank(
    question: Question,
    answer: string,
): ScoredAnswer {
    const expectedAnswer = question.fill_blank_answer ?? "";
    const userAnswer = answer.trim().toLowerCase();
    const isCorrect = userAnswer === expectedAnswer.toLowerCase();

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
    };
}

/**
 * Validate Numerical Answer (with tolerance)
 */
export function validateNumerical(
    question: Question,
    answer: number,
): ScoredAnswer {
    const correctAnswer = question.numerical_answer ?? 0;
    const tolerance = question.numerical_tolerance ?? 0;
    const isCorrect = Math.abs(answer - correctAnswer) <= tolerance;

    return {
        questionId: question.id,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : -question.negative_marks,
    };
}

/**
 * Validate Subjective Answer (manual grading needed)
 * Returns neutral marks initially; admin grades later
 */
export function validateSubjective(
    question: Question,
    answer: string,
): ScoredAnswer {
    if (!answer || answer.trim().length === 0) {
        return {
            questionId: question.id,
            isCorrect: false,
            marksAwarded: 0,
        };
    }

    // Mark for manual grading - awarding 0 until admin reviews
    return {
        questionId: question.id,
        isCorrect: false, // Will be set by admin
        marksAwarded: 0, // Will be updated by admin
    };
}

// ============================================================
// ANSWER VALIDATION DISPATCHER
// ============================================================

/**
 * Validate answer based on question type
 */
export function validateAnswer(
    question: Question & { options?: any[] },
    answer: QuestionAnswer,
): ScoredAnswer {
    switch (question.question_type) {
        case "mcq":
            return validateMCQ(question, answer.answer as string);

        case "multiple_select":
            return validateMultipleSelect(question, answer.answer as string[]);

        case "true_false":
            return validateTrueFalse(question, answer.answer as boolean);

        case "assertion_reasoning":
            return validateAssertionReasoning(question, answer.answer as string[]);

        case "fill_blank":
            return validateFillBlank(question, answer.answer as string);

        case "numerical":
            return validateNumerical(question, answer.answer as number);

        case "subjective":
            return validateSubjective(question, answer.answer as string);

        default:
            return {
                questionId: question.id,
                isCorrect: false,
                marksAwarded: 0,
            };
    }
}

// ============================================================
// QUIZ SCORING
// ============================================================

export interface QuizScoreResult {
    attemptId: string;
    totalMarks: number;
    scoredMarks: number;
    percentage: number;
    isPassed: boolean;
    answers: ScoredAnswer[];
}

/**
 * Calculate total quiz score
 */
export function calculateQuizScore(
    quiz: Quiz,
    scoredAnswers: ScoredAnswer[],
): QuizScoreResult {
    const totalMarks = 100; // Or sum of all question marks
    const scoredMarks = Math.max(
        0,
        scoredAnswers.reduce((sum, answer) => sum + answer.marksAwarded, 0),
    );
    const percentage = (scoredMarks / totalMarks) * 100;
    const isPassed = percentage >= (quiz.passing_score_percentage ?? 40);

    return {
        attemptId: "", // Set by caller
        totalMarks,
        scoredMarks,
        percentage: Math.round(percentage),
        isPassed,
        answers: scoredAnswers,
    };
}

// ============================================================
// SUBMISSION HANDLER
// ============================================================

export interface QuizSubmission {
    supabase: SupabaseClient<Database>;
    attemptId: string;
    answers: QuestionAnswer[];
    quizDetail: Quiz & { questions?: (Question & { options?: any[] })[] };
}

/**
 * Process quiz submission
 */
export async function submitQuizAnswers(options: QuizSubmission): Promise<{
    success: boolean;
    score?: QuizScoreResult;
    error?: string;
}> {
    const { supabase, attemptId, answers, quizDetail } = options;

    try {
        const scoredAnswers: ScoredAnswer[] = [];

        // Validate each answer
        for (const answer of answers) {
            const question = quizDetail.questions?.find((q) => q.id === answer.questionId);
            if (!question) continue;

            const scored = validateAnswer(question, answer);
            scoredAnswers.push(scored);

            // Save individual answer
            await supabase
                .from("quiz_answers")
                .upsert(
                    {
                        attempt_id: attemptId,
                        question_id: answer.questionId,
                        // Answer storage based on type
                        selected_options:
                            answer.questionType === "multiple_select" || answer.questionType === "assertion_reasoning"
                                ? (answer.answer as string[])
                                : null,
                        text_answer:
                            answer.questionType === "fill_blank" || answer.questionType === "subjective"
                                ? (answer.answer as string)
                                : null,
                        numerical_answer: answer.questionType === "numerical" ? (answer.answer as number) : null,
                        boolean_answer: answer.questionType === "true_false" ? (answer.answer as boolean) : null,
                        is_correct: scored.isCorrect,
                        marks_awarded: scored.marksAwarded,
                    } as any,
                    { onConflict: "attempt_id,question_id" },
                );
        }

        // Calculate score
        const scoreResult = calculateQuizScore(quizDetail, scoredAnswers);

        // Update attempt with score
        await supabase
            .from("quiz_attempts")
            .update({
                status: "submitted",
                submitted_at: new Date().toISOString(),
                score: scoreResult.scoredMarks,
                total_marks: scoreResult.totalMarks,
                percentage: scoreResult.percentage,
            })
            .eq("id", attemptId);

        return { success: true, score: scoreResult };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============================================================
// REVIEW & FEEDBACK
// ============================================================

/**
 * Get attempt details with answers and feedback
 */
export async function getAttemptReview(
    supabase: SupabaseClient<Database>,
    attemptId: string,
    showCorrectAnswers: boolean = false,
): Promise<{
    success: boolean;
    attempt?: any;
    error?: string;
}> {
    try {
        const { data: attempt, error } = await supabase
            .from("quiz_attempts")
            .select(
                `
        *,
        answers:quiz_answers(
          *,
          question:questions(
            *,
            options:question_options(*)
          )
        ),
        quiz:quizzes(*)
      `,
            )
            .eq("id", attemptId)
            .maybeSingle();

        if (error || !attempt) {
            return { success: false, error: error?.message || "Attempt not found" };
        }

        // Filter correct answers if not allowed to view
        if (!showCorrectAnswers) {
            attempt.answers = attempt.answers.map((ans: any) => ({
                ...ans,
                is_correct: null,
                marks_awarded: null,
            }));
        }

        return { success: true, attempt };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============================================================
// ANALYTICS
// ============================================================

export interface QuizAnalytics {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    questionAnalytics: {
        questionId: string;
        questionText: string;
        correctPercentage: number;
        averageMarks: number;
    }[];
}

/**
 * Calculate quiz analytics
 */
export async function getQuizAnalytics(
    supabase: SupabaseClient<Database>,
    quizId: string,
): Promise<{ success: boolean; analytics?: QuizAnalytics; error?: string }> {
    try {
        // Get all attempts
        const { data: attempts, error } = await supabase
            .from("quiz_attempts")
            .select(
                `
        *,
        answers:quiz_answers(
          question_id,
          is_correct,
          marks_awarded
        )
      `,
            )
            .eq("quiz_id", quizId)
            .eq("status", "submitted");

        if (error || !attempts) {
            return { success: false, error: error?.message };
        }

        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter((a: any) => a.percentage >= 40).length;
        const totalMarks = attempts.reduce((sum: number, a: any) => sum + (a.score ?? 0), 0);

        const questionStats: Record<string, any> = {};

        attempts.forEach((attempt: any) => {
            attempt.answers.forEach((answer: any) => {
                if (!questionStats[answer.question_id]) {
                    questionStats[answer.question_id] = {
                        questionId: answer.question_id,
                        correct: 0,
                        total: 0,
                        marksSum: 0,
                    };
                }
                if (answer.is_correct) questionStats[answer.question_id].correct++;
                questionStats[answer.question_id].total++;
                questionStats[answer.question_id].marksSum += answer.marks_awarded ?? 0;
            });
        });

        const analytics: QuizAnalytics = {
            totalAttempts,
            averageScore: totalAttempts > 0 ? Math.round(totalMarks / totalAttempts) : 0,
            passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            questionAnalytics: Object.values(questionStats).map((stat: any) => ({
                questionId: stat.questionId,
                questionText: "", // Would need to fetch question details
                correctPercentage:
                    stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
                averageMarks: stat.total > 0 ? Math.round(stat.marksSum / stat.total) : 0,
            })),
        };

        return { success: true, analytics };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
