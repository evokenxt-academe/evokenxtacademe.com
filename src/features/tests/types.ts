import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];

export type QuizRow = Tables["quizzes"]["Row"];
export type QuestionRow = Tables["questions"]["Row"];
export type OptionRow = Tables["options"]["Row"];
export type AttemptRow = Tables["quiz_attempts"]["Row"];
export type AnswerRow = Tables["quiz_answers"]["Row"];
export type CourseRow = Tables["courses"]["Row"];
export type SectionRow = Tables["sections"]["Row"];

export type AttemptStatusLabel = "not_attempted" | "in_progress" | "completed";

export interface QuizOptionLite {
  id: string;
  text: string;
}

export interface QuizQuestionLite {
  id: string;
  question: string;
  marks: number;
  position: number;
  options: QuizOptionLite[];
}

export interface QuizSummaryItem {
  id: string;
  title: string;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  courseId: string;
  courseName: string;
  sectionId: string;
  sectionTitle: string;
  status: AttemptStatusLabel;
  latestAttemptId: string | null;
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  courseId: string;
  courseName: string;
  courseSlug: string;
  sectionId: string;
  sectionTitle: string;
  questions: QuizQuestionLite[];
}

export interface AttemptWithAnswers {
  id: string;
  quizId: string;
  status: AttemptRow["status"];
  startedAt: string;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  answers: Record<string, string>;
}

export interface SubmitAttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  status: AttemptRow["status"];
  submittedAt: string;
  correctCount: number;
  incorrectCount: number;
}

export interface AttemptResultDetail {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  status: AttemptRow["status"];
  submittedAt: string | null;
  startedAt: string;
  correctCount: number;
  incorrectCount: number;
  review: Array<{
    questionId: string;
    question: string;
    explanation: string | null;
    marks: number;
    selectedOptionId: string | null;
    selectedOptionText: string | null;
    correctOptionId: string | null;
    correctOptionText: string | null;
    isCorrect: boolean;
  }>;
}
