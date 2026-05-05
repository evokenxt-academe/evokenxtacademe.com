/**
 * Quiz Builder & Question Bank — TypeScript Types
 * =================================================
 * Matches the Supabase DB schema exactly.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type QuestionType =
  | "mcq"
  | "multiple_select"
  | "subjective"
  | "fill_blank"
  | "true_false"
  | "assertion_reasoning"
  | "numerical";

export type QuizType = "practice" | "graded" | "mock_exam" | "final_exam";

export type BankImportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partial";

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export type PublishStatus = "draft" | "published" | "archived";

export type ShowAnswersAfter = "submit" | "never" | "pass";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "timed_out"
  | "abandoned";

// ─── Taxonomy ────────────────────────────────────────────────────────

export interface Program {
  id: string;
  body: "ACCA" | "CFA" | "CMA";
  full_name: string;
  country: string;
  is_active: boolean;
}

export interface ProgramLevel {
  id: string;
  program_id: string;
  label: string;
  sequence_no: number;
}

export interface Subject {
  id: string;
  program_level_id: string;
  code: string;
  name: string;
  sequence_no: number;
  is_active: boolean;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  is_active: boolean;
}

export interface SubTopic {
  id: string;
  topic_id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
}

export interface Course {
  id: string;
  subject_id: string;
  instructor_id: string;
  title: string;
  slug: string;
  status: string;
  total_students: number;
  avg_rating: number | null;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  position: number;
  is_published: boolean;
}

// ─── Quiz ────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  type: QuizType;
  total_marks: number;
  passing_marks: number | null;
  passing_marks_snapshot: number | null;
  time_limit_sec: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_attempts: number | null;
  show_answers_after: ShowAnswersAfter | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizWithRelations extends Quiz {
  course?: Course & {
    subject?: Subject & {
      program_level?: ProgramLevel & {
        program?: Program;
      };
    };
  };
  chapter?: Chapter | null;
  questions?: Question[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

// ─── Question ────────────────────────────────────────────────────────

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  question_text: string;
  question_image_url: string | null;
  explanation: string | null;
  explanation_image_url: string | null;
  source_ref: string | null;
  marks: number;
  negative_marks: number;
  position: number;
  is_mandatory: boolean;
  blank_placeholder: string | null;
  assertion_text: string | null;
  reason_text: string | null;
  numerical_answer: number | null;
  numerical_tolerance: number | null;
  model_answer: string | null;
  created_at: string;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
  bank_link?: QuizBankLink | null;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
  explanation: string | null;
}

// ─── Bank Question ───────────────────────────────────────────────────

export interface BankQuestion {
  id: string;
  subject_id: string;
  topic_id: string | null;
  sub_topic_id: string | null;
  type: QuestionType;
  question_text: string;
  question_image_url: string | null;
  difficulty: DifficultyLevel;
  marks: number;
  negative_marks: number;
  source_ref: string | null;
  year: number | null;
  session: string | null;
  tags: string[];
  assertion_text: string | null;
  reason_text: string | null;
  numerical_answer: number | null;
  numerical_tolerance: number | null;
  blank_answer: string | null;
  model_answer: string | null;
  explanation: string | null;
  explanation_image_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  usage_count: number;
  correct_rate: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankQuestionWithOptions extends BankQuestion {
  options: BankQuestionOption[];
  topic?: Topic | null;
  sub_topic?: SubTopic | null;
  subject?: Subject | null;
  stats?: BankQuestionStats | null;
}

export interface BankQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
  explanation: string | null;
}

// ─── Bank Import ─────────────────────────────────────────────────────

export interface BankImportJob {
  id: string;
  created_by: string | null;
  subject_id: string;
  topic_id: string | null;
  sub_topic_id: string | null;
  original_file_name: string;
  file_type: "pdf" | "docx" | "csv" | "xlsx" | "txt";
  r2_file_url: string | null;
  file_size_bytes: number | null;
  extracted_text: string | null;
  extracted_json: ParsedQuestion[] | null;
  status: BankImportStatus;
  error_message: string | null;
  parse_warnings: string[] | null;
  total_found: number | null;
  total_imported: number | null;
  total_failed: number | null;
  total_duplicates: number | null;
  detected_program: string | null;
  detected_level: string | null;
  detected_subject: string | null;
  detected_topics: string[] | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BankImportQuestionMap {
  id: string;
  import_job_id: string;
  bank_question_id: string;
  source_position: number;
  is_duplicate: boolean;
  duplicate_of: string | null;
}

export interface BankQuestionStats {
  question_id: string;
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  skip_count: number;
  correct_rate: number;
  avg_time_sec: number | null;
  last_used_at: string | null;
  updated_at: string;
}

// ─── Quiz Bank Link ──────────────────────────────────────────────────

export interface QuizBankLink {
  id: string;
  quiz_id: string;
  quiz_question_id: string;
  bank_question_id: string;
  is_synced: boolean;
  linked_at: string;
  last_synced_at: string | null;
}

// ─── Quiz Attempt ────────────────────────────────────────────────────

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  total_marks: number | null;
  passing_marks_snapshot: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: AttemptStatus;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  time_spent_sec: number | null;
  user?: { name: string; email: string };
}

// ─── Views ───────────────────────────────────────────────────────────

export interface QuizSummary {
  id: string;
  title: string;
  type: QuizType;
  is_published: boolean;
  question_count: number;
  total_marks: number;
  attempt_count: number;
  avg_score: number | null;
  pass_rate_pct: number | null;
  course_title: string | null;
  program_body: string | null;
  level_label: string | null;
}

// ─── Parsed (from AI / Regex) ────────────────────────────────────────

export interface ParsedQuestion {
  type: QuestionType;
  question_text: string;
  marks: number;
  options: { text: string; is_correct: boolean }[] | null;
  correct_answer: string | null;
  numerical_answer: number | null;
  numerical_tolerance: number;
  assertion_text: string | null;
  reason_text: string | null;
  blank_answer: string | null;
  model_answer: string | null;
  explanation: string | null;
  source_ref: string | null;
  position: number;
  // Bank-specific parsed fields
  difficulty?: DifficultyLevel;
  topic_name?: string | null;
  sub_topic_name?: string | null;
  year?: number | null;
  tags?: string[];
  // UI state
  _selected?: boolean;
  _error?: string | null;
  _isDuplicate?: boolean;
  _duplicateOf?: string | null;
}

// ─── Form Inputs ─────────────────────────────────────────────────────

export interface QuizFormData {
  title: string;
  description?: string;
  instructions?: string;
  course_id: string;
  chapter_id?: string | null;
  type: QuizType;
  passing_marks?: number | null;
  time_limit_sec?: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_attempts?: number | null;
  show_answers_after: ShowAnswersAfter;
}

export interface QuestionFormData {
  type: QuestionType;
  question_text: string;
  question_image_url?: string | null;
  marks: number;
  negative_marks: number;
  source_ref?: string | null;
  is_mandatory: boolean;
  explanation?: string | null;
  explanation_image_url?: string | null;
  // Type-specific
  blank_placeholder?: string | null;
  assertion_text?: string | null;
  reason_text?: string | null;
  numerical_answer?: number | null;
  numerical_tolerance?: number | null;
  model_answer?: string | null;
  // Options (for mcq, multiple_select, true_false, assertion_reasoning)
  options?: {
    option_text: string;
    is_correct: boolean;
    position: number;
    explanation?: string | null;
  }[];
}

export interface BankQuestionFormData extends QuestionFormData {
  subject_id: string;
  topic_id?: string | null;
  sub_topic_id?: string | null;
  difficulty: DifficultyLevel;
  year?: number | null;
  session?: string | null;
  tags?: string[];
  blank_answer?: string | null;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────

export interface QuizDashboardStats {
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  avgScore: number;
  weeklyQuizzes: number;
  weeklyQuestions: number;
  weeklyAttempts: number;
}

export interface BankDashboardStats {
  totalQuestions: number;
  verifiedCount: number;
  unverifiedCount: number;
  byType: Record<QuestionType, number>;
  byDifficulty: Record<DifficultyLevel, number>;
  topTopics: { name: string; count: number }[];
}
