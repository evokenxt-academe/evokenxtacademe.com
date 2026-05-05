// Generated types are expected at `@/types/supabase`.
// This file is a minimal, strict-mode friendly Database definition aligned to
// Evoke EduGlobal Supabase schema v2.1.0 as used by student routes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EnrollmentStatus = "active" | "completed" | "expired" | "paused";
export type QuizAttemptStatus =
  | "in_progress"
  | "submitted"
  | "timed_out"
  | "abandoned";

export type QuizType = "practice" | "graded" | "mock";
export type QuestionType =
  | "mcq"
  | "multiple_select"
  | "true_false"
  | "fill_blank"
  | "subjective"
  | "assertion_reasoning"
  | "numerical";

export type ProgramBody = "ACCA" | "CFA" | "CMA";
export type LiveStreamStatus = "scheduled" | "live" | "ended" | "cancelled";
export type CertificateStatus = "issued" | "revoked";
export type InstalmentStatus = "pending" | "overdue" | "paid" | "waived" | "failed";
export type MaterialType = "pdf" | "video" | "document" | "spreadsheet" | "slide" | "zip";
export type MaterialAccess = "free" | "enrolled" | "premium";

type TableDef<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      users: TableDef<{
        id: string;
        name: string | null;
        avatar: string | null;
        email: string;
      }>;

      student_profiles: TableDef<{
        user_id: string;
        target_exam_body: ProgramBody | null;
        target_exam_level: string | null;
        target_exam_date: string | null;
        exam_attempt_number: number | null;
        city: string | null;
        country: string | null;
      }>;

      programs: TableDef<{
        id: string;
        body: ProgramBody;
      }>;

      program_levels: TableDef<{
        id: string;
        program_id: string;
        label: string;
      }>;

      subjects: TableDef<{
        id: string;
        program_level_id: string;
        name: string;
        code: string;
      }>;

      courses: TableDef<{
        id: string;
        title: string;
        slug: string;
        description: string | null;
        thumbnail_url: string | null;
        language: string | null;
        avg_rating: number | null;
        total_students: number | null;
        subject_id: string;
        instructor_id: string;
      }>;

      chapters: TableDef<{
        id: string;
        course_id: string;
        title: string;
        position: number;
        is_published: boolean;
      }>;

      lectures: TableDef<{
        id: string;
        chapter_id: string;
        title: string;
        description: string | null;
        duration_sec: number;
        yt_video_id: string | null;
        video_provider: "youtube" | "vimeo" | "internal" | null;
        position: number;
        is_preview: boolean;
        is_published: boolean;
      }>;

      lecture_resources: TableDef<{
        id: string;
        lecture_id: string;
        title: string;
        file_url: string;
        file_type: MaterialType;
        file_size_kb: number | null;
        position: number;
      }>;

      study_materials: TableDef<{
        id: string;
        course_id: string;
        chapter_id: string | null;
        title: string;
        description: string | null;
        type: MaterialType;
        access_level: MaterialAccess;
        file_url: string | null;
        file_size_kb: number | null;
        position: number;
        is_published: boolean;
      }>;

      enrollments: TableDef<{
        id: string;
        user_id: string;
        course_id: string;
        status: EnrollmentStatus;
        enrolled_at: string;
        expires_at: string | null;
      }>;

      instalment_schedule: TableDef<{
        id: string;
        enrollment_id: string;
        instalment_no: number;
        due_date: string;
        amount: number;
        status: InstalmentStatus;
      }>;

      lecture_progress: TableDef<{
        user_id: string;
        lecture_id: string;
        watched_seconds: number | null;
        resume_at_seconds: number | null;
        last_watched_at: string | null;
        is_completed: boolean;
        completed_at: string | null;
        watch_sessions: number | null;
      }>;

      watch_hours_daily: TableDef<{
        user_id: string;
        course_id: string;
        watch_date: string;
        seconds: number;
      }>;

      quizzes: TableDef<{
        id: string;
        course_id: string;
        chapter_id: string | null;
        title: string;
        description: string | null;
        instructions: string | null;
        type: QuizType;
        total_marks: number;
        passing_marks: number;
        time_limit_sec: number | null;
        shuffle_questions: boolean;
        shuffle_options: boolean;
        max_attempts: number | null;
        show_answers_after: "submit" | "pass" | "never";
        is_published: boolean;
      }>;

      questions: TableDef<{
        id: string;
        quiz_id: string;
        type: QuestionType;
        question_text: string;
        marks: number;
        negative_marks: number;
        position: number;
        blank_placeholder: string | null;
        assertion_text: string | null;
        reason_text: string | null;
        numerical_answer: number | null;
        numerical_tolerance: number | null;
        is_mandatory: boolean;
        explanation: string | null;
      }>;

      question_options: TableDef<{
        id: string;
        question_id: string;
        option_text: string;
        position: number;
        is_correct: boolean;
      }>;

      quiz_attempts: TableDef<{
        id: string;
        quiz_id: string;
        user_id: string;
        score: number | null;
        total_marks: number | null;
        percentage: number | null;
        passed: boolean | null;
        status: QuizAttemptStatus;
        started_at: string;
        submitted_at: string | null;
        attempt_number: number;
        time_spent_sec: number | null;
      }>;

      quiz_answers: TableDef<{
        id: string;
        attempt_id: string;
        question_id: string;
        selected_option_id: string | null;
        selected_option_ids: string[] | null;
        text_answer: string | null;
        blank_answer: string | null;
        numerical_answer: number | null;
        marks_awarded: number | null;
        is_correct: boolean | null;
      }>;

      live_streams: TableDef<{
        id: string;
        course_id: string;
        instructor_id: string;
        title: string;
        description: string | null;
        status: LiveStreamStatus;
        scheduled_at: string | null;
        started_at: string | null;
        yt_video_id: string | null;
        concurrent_viewers: number | null;
      }>;

      certificates: TableDef<{
        id: string;
        user_id: string;
        course_id: string;
        cert_number: string;
        cert_url: string;
        status: CertificateStatus;
        issued_at: string;
        completion_pct: number | null;
      }>;
    };
  };
};

