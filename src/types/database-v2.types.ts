/**
 * Evoke EduGlobal LMS v2.0.0 — TypeScript Database Types
 * Generated from Supabase PostgreSQL Schema
 * Focus: ACCA (UK) · CFA (USA) · CMA (US)
 */

// ============================================================
// ENUMERATIONS
// ============================================================

/** User roles in the system */
export type UserRole = 'student' | 'instructor' | 'admin';

/** Professional certification bodies */
export type ProgramBody = 'ACCA' | 'CFA' | 'CMA';

/** Program levels across ACCA/CFA/CMA */
export type ProgramLevelLabel =
  | 'Applied Knowledge'      // ACCA L1
  | 'Applied Skills'         // ACCA L2
  | 'Strategic Professional' // ACCA L3
  | 'Level I'                // CFA L1
  | 'Level II'               // CFA L2
  | 'Level III'              // CFA L3
  | 'Part 1'                 // CMA Part 1
  | 'Part 2';                // CMA Part 2

/** Course/subject publish state */
export type PublishStatus = 'draft' | 'published' | 'archived';

/** Study material types */
export type MaterialType =
  | 'pdf'
  | 'video'
  | 'slide'
  | 'spreadsheet'
  | 'link'
  | 'image'
  | 'audio'
  | 'zip';

/** Material access level */
export type MaterialAccess = 'free' | 'enrolled' | 'premium';

/** Enrollment states */
export type EnrollStatus = 'active' | 'expired' | 'refunded' | 'paused';

/** Payment states */
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_paid';

/** Payment plan type */
export type PlanType = 'one_time' | 'emi' | 'subscription';

/** Instalment states */
export type InstalmentStatus = 'pending' | 'paid' | 'overdue' | 'waived';

/** Live stream states */
export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

/** Assessment question types (all 7 required) */
export type QuestionType =
  | 'mcq'                 // Single-correct MCQ
  | 'multiple_select'     // Multiple correct options
  | 'subjective'          // Long/short answer
  | 'fill_blank'          // Fill in the blank
  | 'true_false'          // True / False
  | 'assertion_reasoning' // Assertion & Reasoning
  | 'numerical';          // Numeric answer entry

/** Quiz classification */
export type QuizType = 'practice' | 'graded' | 'mock_exam' | 'final_exam';

/** Quiz attempt states */
export type AttemptStatus = 'in_progress' | 'submitted' | 'timed_out' | 'abandoned';

/** Certificate states */
export type CertStatus = 'issued' | 'revoked';

/** Gender options for student profile */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/** Video provider options */
export type VideoProvider = 'youtube' | 'cloudfront' | 'bunny' | 'vimeo';

/** Discount type for coupons */
export type DiscountType = 'flat' | 'percent';

/** Show answers setting for quizzes */
export type ShowAnswersAfter = 'submit' | 'never' | 'pass';

// ============================================================
// DATABASE TABLE TYPES
// ============================================================

/**
 * Core user record (mirrors auth.users)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended profile for students (1:1 with users where role = student)
 */
export interface StudentProfile {
  user_id: string;
  // Academic background
  college_name: string | null;
  university: string | null;
  degree: string | null;
  graduation_year: number | null;
  field_of_study: string | null;
  // Professional background
  current_employer: string | null;
  job_title: string | null;
  years_of_experience: number | null;
  // Exam targeting
  target_exam_body: ProgramBody | null;
  target_exam_level: string | null;
  target_exam_date: string | null;
  exam_attempt_number: number | null;
  // Location
  city: string | null;
  state: string | null;
  country: string | null;
  // Social / misc
  linkedin_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  // Preferences
  preferred_language: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Top-level program definition (ACCA, CFA, CMA)
 */
export interface Program {
  id: string;
  body: ProgramBody;
  full_name: string;
  country: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Program levels (e.g., ACCA → Applied Knowledge, Applied Skills, Strategic Professional)
 */
export interface ProgramLevel {
  id: string;
  program_id: string;
  label: ProgramLevelLabel;
  sequence_no: number;
  description: string | null;
}

/**
 * Subject/Paper within a level
 */
export interface Subject {
  id: string;
  program_level_id: string;
  code: string;
  name: string;
  description: string | null;
  sequence_no: number;
  thumbnail_url: string | null;
  is_active: boolean;
}

/**
 * Course offering for a subject
 */
export interface Course {
  id: string;
  subject_id: string;
  instructor_id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  what_you_learn: string[] | null;
  requirements: string[] | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  language: string;
  status: PublishStatus;
  is_featured: boolean;
  total_students: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
}

/**
 * Chapter within a course
 */
export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
}

/**
 * Lecture within a chapter
 */
export interface Lecture {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: VideoProvider | null;
  yt_video_id: string | null;
  duration_sec: number;
  position: number;
  is_preview: boolean;
  is_published: boolean;
  transcript_url: string | null;
  notes_url: string | null;
  created_at: string;
}

/**
 * Downloadable resources attached to a lecture
 */
export interface LectureResource {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
  file_type: MaterialType;
  file_size_kb: number | null;
  position: number;
}

/**
 * Course-level study materials
 */
export interface StudyMaterial {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  type: MaterialType;
  access_level: MaterialAccess;
  file_url: string;
  file_size_kb: number | null;
  is_published: boolean;
  position: number;
  created_at: string;
}

/**
 * Base pricing for a course
 */
export interface CoursePricing {
  id: string;
  course_id: string;
  label: string;
  currency: string;
  base_price: number;
  discounted_price: number | null;
  discount_pct: number; // Generated column
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

/**
 * Instalment / EMI plans attached to a pricing tier
 */
export interface PaymentPlan {
  id: string;
  pricing_id: string;
  plan_type: PlanType;
  label: string;
  total_instalments: number;
  instalment_amount: number;
  frequency_days: number;
  is_active: boolean;
}

/**
 * Coupon / discount codes
 */
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Enrollment record
 */
export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  pricing_id: string | null;
  plan_id: string | null;
  coupon_id: string | null;
  status: EnrollStatus;
  enrolled_at: string;
  expires_at: string | null;
}

/**
 * Payment transaction record
 */
export interface Payment {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  amount_paid: number;
  currency: string;
  status: PaymentStatus;
  gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  gateway_signature: string | null;
  instalment_number: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Instalment schedule for EMI-based enrollments
 */
export interface InstalmentSchedule {
  id: string;
  enrollment_id: string;
  instalment_no: number;
  due_date: string;
  amount: number;
  status: InstalmentStatus;
  payment_id: string | null;
  paid_at: string | null;
}

/**
 * Per-lecture watch progress
 */
export interface LectureProgress {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: boolean;
  watched_seconds: number;
  resume_at_seconds: number;
  watch_sessions: number;
  last_watched_at: string | null;
  completed_at: string | null;
}

/**
 * Daily watch-time rollup per user/course
 */
export interface WatchHoursDaily {
  id: string;
  user_id: string;
  course_id: string;
  watch_date: string;
  seconds: number;
}

/**
 * Quiz attached to a chapter or course
 */
export interface Quiz {
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
  show_answers_after: ShowAnswersAfter | null;
  is_published: boolean;
  created_at: string;
}

/**
 * Question bank supporting all 7 question types
 */
export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  question_text: string;
  explanation: string | null;
  source_ref: string | null;
  marks: number;
  negative_marks: number;
  position: number;
  is_mandatory: boolean;
  // For fill_blank
  blank_placeholder: string | null;
  // For assertion_reasoning
  assertion_text: string | null;
  reason_text: string | null;
  // For numerical
  numerical_answer: number | null;
  numerical_tolerance: number | null;
}

/**
 * Answer options for objective question types
 */
export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
  explanation: string | null;
}

/**
 * Quiz attempt header
 */
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_marks: number;
  percentage: number; // Generated column
  passed: boolean | null;
  status: AttemptStatus;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  time_spent_sec: number;
}

/**
 * Per-question answer within an attempt
 */
export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  // For MCQ / True-False / Assertion-Reasoning
  selected_option_id: string | null;
  // For Multiple Select
  selected_option_ids: string[] | null;
  // For Subjective
  text_answer: string | null;
  // For Fill in the Blank
  blank_answer: string | null;
  // For Numerical
  numerical_answer: number | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  is_marked_for_review: boolean;
  answered_at: string | null;
}

/**
 * Course completion certificates
 */
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  cert_number: string;
  cert_url: string;
  status: CertStatus;
  completion_pct: number;
  issued_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
}

/**
 * Live class sessions
 */
export interface LiveStream {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  yt_video_id: string | null;
  yt_stream_key: string | null;
  status: StreamStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  viewer_count: number;
  created_at: string;
}

/**
 * Live stream chat messages
 */
export interface ChatMessage {
  id: string;
  live_stream_id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

/**
 * Student course reviews
 */
export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * YouTube OAuth tokens (admin only)
 */
export interface YoutubeToken {
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  expires_at: string | null;
  scopes: string | null;
  updated_at: string;
}

// ============================================================
// COMPOSITE TYPES FOR NESTED QUERIES
// ============================================================

/** Course with full hierarchy (Program → Level → Subject → Course) */
export interface CourseWithHierarchy extends Course {
  subject: Subject & {
    program_level: ProgramLevel & {
      program: Program;
    };
  };
  instructor: Pick<User, 'id' | 'name' | 'avatar'>;
}

/** Course with chapters and lectures */
export interface CourseWithContent extends Course {
  chapters: (Chapter & {
    lectures: Lecture[];
  })[];
}

/** Course with pricing options */
export interface CourseWithPricing extends Course {
  pricing: (CoursePricing & {
    payment_plans: PaymentPlan[];
  })[];
}

/** Full course details for course page */
export interface CourseDetails extends CourseWithHierarchy {
  chapters: (Chapter & {
    lectures: (Lecture & {
      resources: LectureResource[];
    })[];
  })[];
  pricing: (CoursePricing & {
    payment_plans: PaymentPlan[];
  })[];
  study_materials: StudyMaterial[];
  reviews: (Review & {
    user: Pick<User, 'id' | 'name' | 'avatar'>;
  })[];
}

/** Enrollment with full details */
export interface EnrollmentWithDetails extends Enrollment {
  course: CourseWithHierarchy;
  pricing: CoursePricing | null;
  plan: PaymentPlan | null;
  coupon: Coupon | null;
  payments: Payment[];
  instalment_schedule: InstalmentSchedule[];
}

/** Quiz with questions and options */
export interface QuizWithQuestions extends Quiz {
  questions: (Question & {
    options: QuestionOption[];
  })[];
}

/** Attempt with answers for review */
export interface AttemptWithAnswers extends QuizAttempt {
  quiz: Quiz;
  answers: (QuizAnswer & {
    question: Question & {
      options: QuestionOption[];
    };
  })[];
}

/** Student progress for a course */
export interface CourseProgress {
  course_id: string;
  total_lectures: number;
  completed_lectures: number;
  progress_percentage: number;
  total_watch_seconds: number;
  last_watched_at: string | null;
}

/** User with profile */
export interface UserWithProfile extends User {
  student_profile: StudentProfile | null;
}

/** Program with levels and subjects */
export interface ProgramWithStructure extends Program {
  levels: (ProgramLevel & {
    subjects: Subject[];
  })[];
}

// ============================================================
// INSERT TYPES (for creating new records)
// ============================================================

export type UserInsert = Omit<User, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type StudentProfileInsert = Omit<StudentProfile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type CourseInsert = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'total_students' | 'avg_rating'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  total_students?: number;
  avg_rating?: number;
};

export type ChapterInsert = Omit<Chapter, 'id'> & {
  id?: string;
};

export type LectureInsert = Omit<Lecture, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type LectureResourceInsert = Omit<LectureResource, 'id'> & {
  id?: string;
};

export type StudyMaterialInsert = Omit<StudyMaterial, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CoursePricingInsert = Omit<CoursePricing, 'id' | 'discount_pct'> & {
  id?: string;
};

export type PaymentPlanInsert = Omit<PaymentPlan, 'id'> & {
  id?: string;
};

export type CouponInsert = Omit<Coupon, 'id' | 'created_at' | 'used_count'> & {
  id?: string;
  created_at?: string;
  used_count?: number;
};

export type EnrollmentInsert = Omit<Enrollment, 'id' | 'enrolled_at'> & {
  id?: string;
  enrolled_at?: string;
};

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type InstalmentScheduleInsert = Omit<InstalmentSchedule, 'id'> & {
  id?: string;
};

export type LectureProgressInsert = Omit<LectureProgress, 'id'> & {
  id?: string;
};

export type WatchHoursDailyInsert = Omit<WatchHoursDaily, 'id'> & {
  id?: string;
};

export type QuizInsert = Omit<Quiz, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type QuestionInsert = Omit<Question, 'id'> & {
  id?: string;
};

export type QuestionOptionInsert = Omit<QuestionOption, 'id'> & {
  id?: string;
};

export type QuizAttemptInsert = Omit<QuizAttempt, 'id' | 'started_at' | 'percentage'> & {
  id?: string;
  started_at?: string;
};

export type QuizAnswerInsert = Omit<QuizAnswer, 'id'> & {
  id?: string;
};

export type CertificateInsert = Omit<Certificate, 'id' | 'issued_at'> & {
  id?: string;
  issued_at?: string;
};

export type LiveStreamInsert = Omit<LiveStream, 'id' | 'created_at' | 'viewer_count'> & {
  id?: string;
  created_at?: string;
  viewer_count?: number;
};

export type ChatMessageInsert = Omit<ChatMessage, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ReviewInsert = Omit<Review, 'id' | 'created_at' | 'updated_at' | 'is_approved'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  is_approved?: boolean;
};

// ============================================================
// UPDATE TYPES (for updating existing records)
// ============================================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type StudentProfileUpdate = Partial<Omit<StudentProfile, 'user_id' | 'created_at'>>;
export type CourseUpdate = Partial<Omit<Course, 'id' | 'created_at'>>;
export type ChapterUpdate = Partial<Omit<Chapter, 'id' | 'course_id'>>;
export type LectureUpdate = Partial<Omit<Lecture, 'id' | 'chapter_id' | 'created_at'>>;
export type LectureResourceUpdate = Partial<Omit<LectureResource, 'id' | 'lecture_id'>>;
export type StudyMaterialUpdate = Partial<Omit<StudyMaterial, 'id' | 'course_id' | 'created_at'>>;
export type CoursePricingUpdate = Partial<Omit<CoursePricing, 'id' | 'course_id' | 'discount_pct'>>;
export type PaymentPlanUpdate = Partial<Omit<PaymentPlan, 'id' | 'pricing_id'>>;
export type CouponUpdate = Partial<Omit<Coupon, 'id' | 'created_at'>>;
export type EnrollmentUpdate = Partial<Omit<Enrollment, 'id' | 'user_id' | 'course_id' | 'enrolled_at'>>;
export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'enrollment_id' | 'user_id' | 'course_id' | 'created_at'>>;
export type InstalmentScheduleUpdate = Partial<Omit<InstalmentSchedule, 'id' | 'enrollment_id' | 'instalment_no'>>;
export type LectureProgressUpdate = Partial<Omit<LectureProgress, 'id' | 'user_id' | 'lecture_id'>>;
export type WatchHoursDailyUpdate = Partial<Omit<WatchHoursDaily, 'id' | 'user_id' | 'course_id' | 'watch_date'>>;
export type QuizUpdate = Partial<Omit<Quiz, 'id' | 'course_id' | 'created_at'>>;
export type QuestionUpdate = Partial<Omit<Question, 'id' | 'quiz_id'>>;
export type QuestionOptionUpdate = Partial<Omit<QuestionOption, 'id' | 'question_id'>>;
export type QuizAttemptUpdate = Partial<Omit<QuizAttempt, 'id' | 'quiz_id' | 'user_id' | 'started_at' | 'percentage'>>;
export type QuizAnswerUpdate = Partial<Omit<QuizAnswer, 'id' | 'attempt_id' | 'question_id'>>;
export type CertificateUpdate = Partial<Omit<Certificate, 'id' | 'user_id' | 'course_id' | 'cert_number' | 'issued_at'>>;
export type LiveStreamUpdate = Partial<Omit<LiveStream, 'id' | 'course_id' | 'instructor_id' | 'created_at'>>;
export type ChatMessageUpdate = Partial<Omit<ChatMessage, 'id' | 'live_stream_id' | 'user_id' | 'created_at'>>;
export type ReviewUpdate = Partial<Omit<Review, 'id' | 'user_id' | 'course_id' | 'created_at'>>;

// ============================================================
// SUPABASE DATABASE TYPE (for use with Supabase client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      student_profiles: {
        Row: StudentProfile;
        Insert: StudentProfileInsert;
        Update: StudentProfileUpdate;
      };
      programs: {
        Row: Program;
        Insert: Omit<Program, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Program, 'id' | 'created_at'>>;
      };
      program_levels: {
        Row: ProgramLevel;
        Insert: Omit<ProgramLevel, 'id'> & { id?: string };
        Update: Partial<Omit<ProgramLevel, 'id' | 'program_id'>>;
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id'> & { id?: string };
        Update: Partial<Omit<Subject, 'id' | 'program_level_id'>>;
      };
      courses: {
        Row: Course;
        Insert: CourseInsert;
        Update: CourseUpdate;
      };
      chapters: {
        Row: Chapter;
        Insert: ChapterInsert;
        Update: ChapterUpdate;
      };
      lectures: {
        Row: Lecture;
        Insert: LectureInsert;
        Update: LectureUpdate;
      };
      lecture_resources: {
        Row: LectureResource;
        Insert: LectureResourceInsert;
        Update: LectureResourceUpdate;
      };
      study_materials: {
        Row: StudyMaterial;
        Insert: StudyMaterialInsert;
        Update: StudyMaterialUpdate;
      };
      course_pricing: {
        Row: CoursePricing;
        Insert: CoursePricingInsert;
        Update: CoursePricingUpdate;
      };
      payment_plans: {
        Row: PaymentPlan;
        Insert: PaymentPlanInsert;
        Update: PaymentPlanUpdate;
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      enrollments: {
        Row: Enrollment;
        Insert: EnrollmentInsert;
        Update: EnrollmentUpdate;
      };
      payments: {
        Row: Payment;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
      };
      instalment_schedule: {
        Row: InstalmentSchedule;
        Insert: InstalmentScheduleInsert;
        Update: InstalmentScheduleUpdate;
      };
      lecture_progress: {
        Row: LectureProgress;
        Insert: LectureProgressInsert;
        Update: LectureProgressUpdate;
      };
      watch_hours_daily: {
        Row: WatchHoursDaily;
        Insert: WatchHoursDailyInsert;
        Update: WatchHoursDailyUpdate;
      };
      quizzes: {
        Row: Quiz;
        Insert: QuizInsert;
        Update: QuizUpdate;
      };
      questions: {
        Row: Question;
        Insert: QuestionInsert;
        Update: QuestionUpdate;
      };
      question_options: {
        Row: QuestionOption;
        Insert: QuestionOptionInsert;
        Update: QuestionOptionUpdate;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: QuizAttemptInsert;
        Update: QuizAttemptUpdate;
      };
      quiz_answers: {
        Row: QuizAnswer;
        Insert: QuizAnswerInsert;
        Update: QuizAnswerUpdate;
      };
      certificates: {
        Row: Certificate;
        Insert: CertificateInsert;
        Update: CertificateUpdate;
      };
      live_streams: {
        Row: LiveStream;
        Insert: LiveStreamInsert;
        Update: LiveStreamUpdate;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: ChatMessageInsert;
        Update: ChatMessageUpdate;
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
      };
      youtube_tokens: {
        Row: YoutubeToken;
        Insert: Omit<YoutubeToken, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<YoutubeToken, 'user_id'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      program_body: ProgramBody;
      program_level_label: ProgramLevelLabel;
      publish_status: PublishStatus;
      material_type: MaterialType;
      material_access: MaterialAccess;
      enroll_status: EnrollStatus;
      payment_status: PaymentStatus;
      plan_type: PlanType;
      instalment_status: InstalmentStatus;
      stream_status: StreamStatus;
      question_type: QuestionType;
      quiz_type: QuizType;
      attempt_status: AttemptStatus;
      cert_status: CertStatus;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_instructor: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      generate_cert_number: {
        Args: { p_course_id: string };
        Returns: string;
      };
    };
  };
}
