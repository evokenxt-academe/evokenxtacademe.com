/**
 * ============================================================
 * Evoke EduGlobal LMS v2.0.0 - TypeScript Database Types
 * ============================================================
 * Generated from supabase-schema.sql
 * Strict typing with nullable handling and enums
 * DO NOT EDIT MANUALLY - regenerate from schema
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================
// ENUMERATIONS
// ============================================================

export enum UserRole {
    Student = "student",
    Instructor = "instructor",
    Admin = "admin",
}

export enum ProgramBody {
    ACCA = "ACCA",
    CFA = "CFA",
    CMA = "CMA",
}

export enum ProgramLevelLabel {
    AppliedKnowledge = "Applied Knowledge", // ACCA L1
    AppliedSkills = "Applied Skills", // ACCA L2
    StrategicProfessional = "Strategic Professional", // ACCA L3
    Level1 = "Level 1", // CFA L1, CMA Part 1
    Level2 = "Level 2", // CFA L2
    Level3 = "Level 3", // CFA L3
    Part2 = "Part 2", // CMA Part 2
}

export enum PublishStatus {
    Draft = "draft",
    Published = "published",
    Archived = "archived",
}

export enum MaterialType {
    PDF = "pdf",
    Video = "video",
    Document = "document",
    Spreadsheet = "spreadsheet",
    Slide = "slide",
    ZIP = "zip",
}

export enum MaterialAccess {
    Free = "free",
    Enrolled = "enrolled",
    Premium = "premium",
}

export enum EnrollStatus {
    Active = "active",
    Completed = "completed",
    Expired = "expired",
    Paused = "paused",
}

export enum PaymentStatus {
    Pending = "pending",
    Successful = "successful",
    Failed = "failed",
    Refunded = "refunded",
    PartiallPaid = "partially_paid",
}

export enum PlanType {
    OneTime = "one_time",
    Monthly = "monthly",
    Quarterly = "quarterly",
    Subscription = "subscription",
}

export enum InstalmentStatus {
    Pending = "pending",
    Paid = "paid",
    Failed = "failed",
    Waived = "waived",
}

export enum StreamStatus {
    Scheduled = "scheduled",
    Live = "live",
    Ended = "ended",
    Cancelled = "cancelled",
}

export enum QuestionType {
    MCQ = "mcq", // Single-correct
    MultipleSelect = "multiple_select", // Multiple correct
    Subjective = "subjective", // Long form
    FillBlank = "fill_blank", // Fill in the blanks
    TrueFalse = "true_false",
    AssertionReasoning = "assertion_reasoning",
    Numerical = "numerical", // Numeric answer
}

export enum QuizType {
    Practice = "practice",
    Graded = "graded",
    Exam = "final_exam",
}

export enum AttemptStatus {
    InProgress = "in_progress",
    Submitted = "submitted",
    TimedOut = "timed_out",
    Abandoned = "abandoned",
}

export enum CertificateStatus {
    Issued = "issued",
    Revoked = "revoked",
}

// ============================================================
// CORE TYPES
// ============================================================

/** Core user record (synced from auth.users) */
export interface User {
    id: string; // UUID
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
    role: UserRole;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
}

/** Extended profile for students (1:1 with users) */
export interface StudentProfile {
    user_id: string; // UUID (FK: users.id)
    date_of_birth?: string | null; // ISO date
    country?: string | null;
    city?: string | null;
    state?: string | null;
    timezone?: string | null;
    professional_background?: string | null;
    current_certification_target?: ProgramBody | null;
    target_exam_date?: string | null; // ISO date
    study_hours_per_week?: number | null;
    preferred_language?: string | null;
    notifications_enabled?: boolean;
    college_name?: string | null;
    university?: string | null;
    degree?: string | null;
    graduation_year?: number | null;
    field_of_study?: string | null;
    current_employer?: string | null;
    job_title?: string | null;
    years_of_experience?: number | null;
    target_exam_body?: string | null;
    target_exam_level?: string | null;
    exam_attempt_number?: number | null;
    linkedin_url?: string | null;
    bio?: string | null;
    gender?: string | null;
    notification_email?: boolean;
    notification_sms?: boolean;
    notification_whatsapp?: boolean;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// PROGRAM STRUCTURE
// ─────────────────────────────────────────────────────────

/** Top-level professional certification program */
export interface Program {
    id: string; // UUID
    body: ProgramBody;
    full_name: string;
    country: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Level within a program (e.g., ACCA L1/L2/L3) */
export interface ProgramLevel {
    id: string; // UUID
    program_id: string; // FK: programs.id
    label: ProgramLevelLabel;
    sequence_no: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

/** Subject/Paper within a level */
export interface Subject {
    id: string; // UUID
    program_level_id: string; // FK: program_levels.id
    code: string; // e.g., "BT" for ACCA Business & Technology
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// COURSE STRUCTURE
// ─────────────────────────────────────────────────────────

/** Course offering for a subject */
export interface Course {
    id: string; // UUID
    subject_id: string; // FK: subjects.id
    instructor_id: string; // FK: users.id (role='instructor')
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    overview_video_url: string | null;
    status: PublishStatus;
    language: string; // e.g., "en", "hi", "fr"
    total_duration_sec: number | null; // Computed from lectures
    total_lectures: number; // Count
    certification_body: ProgramBody;
    max_enrollment_capacity: number | null;
    current_enrollment_count: number; // Computed
    created_at: string;
    updated_at: string;
}

/** Chapter within a course */
export interface Chapter {
    id: string; // UUID
    course_id: string; // FK: courses.id
    title: string;
    description: string | null;
    position: number; // 1, 2, 3...
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/** Lecture within a chapter */
export interface Lecture {
    id: string; // UUID
    chapter_id: string; // FK: chapters.id
    title: string;
    description: string | null;
    video_url: string | null; // YouTube or Vimeo URL
    duration_sec: number;
    position: number;
    is_preview: boolean; // Free preview lecture
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/** Downloadable resources attached to a lecture */
export interface LectureResource {
    id: string; // UUID
    lecture_id: string; // FK: lectures.id
    title: string;
    file_url: string;
    file_type: MaterialType;
    file_size_bytes: number | null;
    position: number;
    created_at: string;
    updated_at: string;
}

/** Course-level study materials (not tied to specific lectures) */
export interface StudyMaterial {
    id: string; // UUID
    course_id: string; // FK: courses.id
    chapter_id: string | null; // FK: chapters.id (optional)
    title: string;
    description: string | null;
    material_type: MaterialType;
    file_url: string | null; // For downloadables
    content: string | null; // For inline content
    access_level: MaterialAccess;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// PRICING & PAYMENTS
// ─────────────────────────────────────────────────────────

/** Base pricing tier for a course */
export interface CoursePricing {
    id: string; // UUID
    course_id: string; // FK: courses.id
    label: string; // "standard", "early_bird", "corporate", etc.
    base_price: number; // In paise/cents (multiply by 100 for INR/USD)
    discount_percentage: number | null; // 0-100
    discount_end_date: string | null; // ISO date
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** EMI or subscription plan for a pricing tier */
export interface PaymentPlan {
    id: string; // UUID
    pricing_id: string; // FK: course_pricing.id
    plan_type: PlanType;
    num_installments: number | null; // For EMI
    installment_amount: number | null;
    total_amount: number;
    duration_days: number | null; // For subscription
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Discount/promo codes */
export interface Coupon {
    id: string; // UUID
    code: string;
    description: string | null;
    discount_type: "percentage" | "fixed"; // percentage or fixed amount
    discount_value: number;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    valid_from: string; // ISO date
    valid_until: string; // ISO date
    applicable_courses: string[] | null; // UUID[] or null for all
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// ENROLLMENTS & PAYMENTS
// ─────────────────────────────────────────────────────────

/** Student enrollment in a course */
export interface Enrollment {
    id: string; // UUID
    user_id: string; // FK: users.id
    course_id: string; // FK: courses.id
    pricing_id: string | null; // FK: course_pricing.id
    plan_id: string | null; // FK: payment_plans.id
    status: EnrollStatus;
    enrolled_at: string; // ISO timestamp
    expires_at: string | null; // ISO timestamp
    created_at: string;
    updated_at: string;
}

/** Individual payment transaction */
export interface Payment {
    id: string; // UUID
    user_id: string; // FK: users.id
    enrollment_id: string; // FK: enrollments.id
    amount: number; // In paise/cents
    gateway: string; // "razorpay", "stripe", etc.
    gateway_transaction_id: string | null;
    gateway_order_id: string | null;
    gateway_metadata: Json; // Flexible metadata object
    status: PaymentStatus;
    paid_at: string | null; // ISO timestamp
    created_at: string;
    updated_at: string;
}

/** Due-date schedule for EMI enrollments */
export interface InstalmentSchedule {
    id: string; // UUID
    enrollment_id: string; // FK: enrollments.id
    instalment_no: number;
    amount: number; // In paise/cents
    due_date: string; // ISO date
    paid_date: string | null; // ISO date
    status: InstalmentStatus;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// PROGRESS & ANALYTICS
// ─────────────────────────────────────────────────────────

/** Per-lecture watch progress */
export interface LectureProgress {
    id: string; // UUID
    user_id: string; // FK: users.id
    lecture_id: string; // FK: lectures.id
    resume_position_sec: number; // Where to resume from
    watch_time_sec: number; // Total watch time
    completion_percentage: number; // 0-100
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

/** Daily watch hours aggregation */
export interface WatchHoursDaily {
    id: string; // UUID
    user_id: string; // FK: users.id
    course_id: string; // FK: courses.id
    watch_date: string; // ISO date
    hours_watched: number;
    lectures_completed: number;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// ASSESSMENTS (7 QUESTION TYPES)
// ─────────────────────────────────────────────────────────

/** Quiz (attached to chapter or course) */
export interface Quiz {
    id: string; // UUID
    course_id: string | null; // FK: courses.id (for course-level exams)
    chapter_id: string | null; // FK: chapters.id (for chapter quizzes)
    title: string;
    description: string | null;
    quiz_type: QuizType;
    passing_score_percentage: number; // 0-100
    time_limit_minutes: number | null;
    show_answers_after_submission: boolean;
    allow_review_after_submission: boolean;
    shuffle_questions: boolean;
    negative_marking: boolean;
    negative_marking_percentage: number; // 0-50 (% per wrong answer)
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

/** Question in a quiz (supports 7 types) */
export interface Question {
    id: string; // UUID
    quiz_id: string; // FK: quizzes.id
    question_text: string;
    question_type: QuestionType;
    position: number;
    marks: number;
    negative_marks: number; // For wrong answer
    explanation: string | null;
    difficulty_level: "easy" | "medium" | "hard"; // For analytics
    // Type-specific fields
    fill_blank_answer: string | null; // For fill_blank type
    true_false_answer: boolean | null; // For true_false type
    numerical_answer: number | null; // For numerical type
    numerical_tolerance: number; // ±tolerance
    subjective_sample_answer: string | null; // For subjective type
    created_at: string;
    updated_at: string;
}

/** Answer option for objective questions */
export interface QuestionOption {
    id: string; // UUID
    question_id: string; // FK: questions.id
    option_text: string;
    is_correct: boolean; // For MCQ, multiple_select, true_false, assertion_reasoning
    explanation: string | null; // Per-option explanation
    position: number;
    created_at: string;
    updated_at: string;
}

/** Quiz attempt by a student */
export interface QuizAttempt {
    id: string; // UUID
    user_id: string; // FK: users.id
    quiz_id: string; // FK: quizzes.id
    status: AttemptStatus;
    started_at: string; // ISO timestamp
    submitted_at: string | null; // ISO timestamp
    score: number | null;
    total_marks: number | null;
    percentage: number | null;
    time_spent_sec: number;
    created_at: string;
    updated_at: string;
}

/** Student's answer to a question in an attempt */
export interface QuizAnswer {
    id: string; // UUID
    attempt_id: string; // FK: quiz_attempts.id
    question_id: string; // FK: questions.id
    // Type-specific answer storage
    selected_options: string[] | null; // UUID[] of selected option IDs (MCQ, multiple_select)
    text_answer: string | null; // For fill_blank, subjective
    numerical_answer: number | null; // For numerical
    boolean_answer: boolean | null; // For true_false
    is_correct: boolean | null; // null if not graded yet
    marks_awarded: number | null;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────────────────

/** Course completion certificate */
export interface Certificate {
    id: string; // UUID
    user_id: string; // FK: users.id
    course_id: string; // FK: courses.id
    certificate_number: string; // Unique identifier
    status: CertificateStatus;
    issued_date: string; // ISO date
    expiry_date: string | null; // ISO date
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// LIVE STREAMS & CHAT
// ─────────────────────────────────────────────────────────

/** Live class session */
export interface LiveStream {
    id: string; // UUID
    course_id: string; // FK: courses.id
    title: string;
    description: string | null;
    stream_url: string | null; // YouTube Live or Zoom URL
    scheduled_start: string; // ISO timestamp
    actual_start: string | null; // ISO timestamp
    actual_end: string | null; // ISO timestamp
    status: StreamStatus;
    max_participants: number | null;
    current_participants: number;
    created_at: string;
    updated_at: string;
}

/** Live stream chat message */
export interface ChatMessage {
    id: string; // UUID
    live_stream_id: string; // FK: live_streams.id
    user_id: string; // FK: users.id
    message: string;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────

/** Student course review */
export interface Review {
    id: string; // UUID
    user_id: string; // FK: users.id
    course_id: string; // FK: courses.id
    rating: number; // 1-5
    title: string;
    comment: string | null;
    is_verified_purchase: boolean;
    is_approved: boolean; // Moderated by admin
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────
// YOUTUBE OAUTH TOKENS (ADMIN ONLY)
// ─────────────────────────────────────────────────────────

/** YouTube/Google OAuth tokens (admin-only access) */
export interface YouTubeToken {
    user_id: string; // UUID (PK: users.id, admin user only)
    access_token: string;
    refresh_token: string;
    expires_at: string; // ISO timestamp
    scopes: string[]; // OAuth scopes granted
    created_at: string;
    updated_at: string;
}

// ============================================================
// COMPOSITE RESPONSE TYPES
// ============================================================

/** Full course with related data */
export interface CourseDetail extends Course {
    subject?: Subject & {
        program_level?: ProgramLevel & {
            program?: Program;
        };
    };
    instructor?: User;
    chapters?: Chapter[];
    pricing?: CoursePricing[];
    study_materials?: StudyMaterial[];
    reviews?: Review[];
}

/** Enrollment with related payment data */
export interface EnrollmentDetail extends Enrollment {
    course?: Course;
    pricing?: CoursePricing;
    plan?: PaymentPlan;
    payments?: Payment[];
    instalments?: InstalmentSchedule[];
}

/** Quiz with all questions and options */
export interface QuizDetail extends Quiz {
    questions?: (Question & {
        options?: QuestionOption[];
    })[];
}

/** Attempt with all answers */
export interface AttemptDetail extends QuizAttempt {
    answers?: QuizAnswer[];
    quiz?: Quiz;
}

// ============================================================
// DATABASE INTERFACE (for supabase-js client)
// ============================================================

export interface Database {
    public: {
        Tables: {
            users: { Row: User; Insert: Omit<User, "created_at" | "updated_at">; Update: Partial<User> };
            student_profiles: { Row: StudentProfile; Insert: Omit<StudentProfile, "created_at" | "updated_at">; Update: Partial<StudentProfile> };
            programs: { Row: Program; Insert: Omit<Program, "created_at" | "updated_at">; Update: Partial<Program> };
            program_levels: { Row: ProgramLevel; Insert: Omit<ProgramLevel, "created_at" | "updated_at">; Update: Partial<ProgramLevel> };
            subjects: { Row: Subject; Insert: Omit<Subject, "created_at" | "updated_at">; Update: Partial<Subject> };
            courses: { Row: Course; Insert: Omit<Course, "created_at" | "updated_at">; Update: Partial<Course> };
            chapters: { Row: Chapter; Insert: Omit<Chapter, "created_at" | "updated_at">; Update: Partial<Chapter> };
            lectures: { Row: Lecture; Insert: Omit<Lecture, "created_at" | "updated_at">; Update: Partial<Lecture> };
            lecture_resources: { Row: LectureResource; Insert: Omit<LectureResource, "created_at" | "updated_at">; Update: Partial<LectureResource> };
            study_materials: { Row: StudyMaterial; Insert: Omit<StudyMaterial, "created_at" | "updated_at">; Update: Partial<StudyMaterial> };
            course_pricing: { Row: CoursePricing; Insert: Omit<CoursePricing, "created_at" | "updated_at">; Update: Partial<CoursePricing> };
            payment_plans: { Row: PaymentPlan; Insert: Omit<PaymentPlan, "created_at" | "updated_at">; Update: Partial<PaymentPlan> };
            coupons: { Row: Coupon; Insert: Omit<Coupon, "created_at" | "updated_at">; Update: Partial<Coupon> };
            enrollments: { Row: Enrollment; Insert: Omit<Enrollment, "created_at" | "updated_at">; Update: Partial<Enrollment> };
            payments: { Row: Payment; Insert: Omit<Payment, "created_at" | "updated_at">; Update: Partial<Payment> };
            instalment_schedule: { Row: InstalmentSchedule; Insert: Omit<InstalmentSchedule, "created_at" | "updated_at">; Update: Partial<InstalmentSchedule> };
            lecture_progress: { Row: LectureProgress; Insert: Omit<LectureProgress, "created_at" | "updated_at">; Update: Partial<LectureProgress> };
            watch_hours_daily: { Row: WatchHoursDaily; Insert: Omit<WatchHoursDaily, "created_at" | "updated_at">; Update: Partial<WatchHoursDaily> };
            quizzes: { Row: Quiz; Insert: Omit<Quiz, "created_at" | "updated_at">; Update: Partial<Quiz> };
            questions: { Row: Question; Insert: Omit<Question, "created_at" | "updated_at">; Update: Partial<Question> };
            question_options: { Row: QuestionOption; Insert: Omit<QuestionOption, "created_at" | "updated_at">; Update: Partial<QuestionOption> };
            quiz_attempts: { Row: QuizAttempt; Insert: Omit<QuizAttempt, "created_at" | "updated_at">; Update: Partial<QuizAttempt> };
            quiz_answers: { Row: QuizAnswer; Insert: Omit<QuizAnswer, "created_at" | "updated_at">; Update: Partial<QuizAnswer> };
            certificates: { Row: Certificate; Insert: Omit<Certificate, "created_at" | "updated_at">; Update: Partial<Certificate> };
            live_streams: { Row: LiveStream; Insert: Omit<LiveStream, "created_at" | "updated_at">; Update: Partial<LiveStream> };
            chat_messages: { Row: ChatMessage; Insert: Omit<ChatMessage, "created_at" | "updated_at">; Update: Partial<ChatMessage> };
            reviews: { Row: Review; Insert: Omit<Review, "created_at" | "updated_at">; Update: Partial<Review> };
            youtube_tokens: { Row: YouTubeToken; Insert: Omit<YouTubeToken, "created_at" | "updated_at">; Update: Partial<YouTubeToken> };
        };
        Views: {
            [_ in never]: never
        };
        Functions: {
            [_ in never]: never
        };
        Enums: {
            [_ in never]: never
        };
        CompositeTypes: {
            [_ in never]: never
        };
    };
}
