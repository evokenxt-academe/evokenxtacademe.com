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
  latestScore: number | null;
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
  userId: string;
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
  rank: number | null;
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

export interface QuizInsightsAbout {
  quizId: string;
  title: string;
  description: string | null;
  courseName: string;
  sectionTitle: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  questionCount: number;
}

export interface QuizInsightsReport {
  participants: number;
  attempts: number;
  averageScore: number;
  highestScore: number;
  passRate: number;
  averageAccuracy: number;
  distribution: Array<{
    label: string;
    count: number;
  }>;
}

export interface QuizRankingItem {
  rank: number;
  userId: string;
  name: string;
  initials: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string | null;
  durationSec: number | null;
  attempts: number;
}

export interface QuizHistoryItem {
  attemptId: string;
  status: AttemptRow["status"];
  score: number;
  totalMarks: number;
  percentage: number;
  startedAt: string;
  submittedAt: string | null;
  durationSec: number | null;
  rank: number | null;
}

export interface QuizInsightsDetail {
  about: QuizInsightsAbout;
  report: QuizInsightsReport;
  ranking: QuizRankingItem[];
  history: QuizHistoryItem[];
}

// ── Admin Types ────────────────────────────────────────────────

export interface AdminQuizListItem {
  id: string;
  title: string;
  description: string | null;
  courseName: string;
  sectionTitle: string;
  totalMarks: number;
  passingMarks: number;
  timeLimitSec: number | null;
  isPublished: boolean;
  questionCount: number;
  attemptCount: number;
  participantCount: number;
  averageScore: number;
  highestScore: number;
  passRate: number;
  createdAt: string;
}

export interface AdminRankingEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  score: number;
  totalMarks: number;
  percentage: number;
  durationSec: number | null;
  submittedAt: string | null;
  status: AttemptRow["status"];
}
