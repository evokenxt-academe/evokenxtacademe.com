-- ============================================================
--  ███████╗██╗   ██╗ ██████╗ ██╗  ██╗███████╗
--  ██╔════╝██║   ██║██╔═══██╗██║ ██╔╝██╔════╝
--  █████╗  ██║   ██║██║   ██║█████╔╝ █████╗
--  ██╔══╝  ╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══╝
--  ███████╗ ╚████╔╝ ╚██████╔╝██║  ██╗███████╗
--  ╚══════╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝
--  ███████╗██████╗ ██╗   ██╗ ██████╗ ██╗      ██████╗ ██████╗  █████╗ ██╗
--  ██╔════╝██╔══██╗██║   ██║██╔════╝ ██║     ██╔═══██╗██╔══██╗██╔══██╗██║
--  █████╗  ██║  ██║██║   ██║██║  ███╗██║     ██║   ██║██████╔╝███████║██║
--  ██╔══╝  ██║  ██║██║   ██║██║   ██║██║     ██║   ██║██╔══██╗██╔══██║██║
--  ███████╗██████╔╝╚██████╔╝╚██████╔╝███████╗╚██████╔╝██████╔╝██║  ██║███████╗
--  ╚══════╝╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
-- ============================================================
--  Evoke EduGlobal — Production-Ready LMS Schema
--  Target:     Supabase (PostgreSQL 15+)
--  Author:     Evoke EduGlobal Platform
--  Version:    2.0.0
--  Focus:      ACCA (UK) · CFA (USA) · CMA (US)
-- ============================================================
--
--  TABLE OF CONTENTS
--  ─────────────────────────────────────────────────────────
--  §01  Extensions
--  §02  Enumerations
--  §03  Users & Student Profiles
--  §04  Professional Courses (ACCA / CFA / CMA)
--  §05  Course Structure  (Levels → Subjects → Chapters → Lectures)
--  §06  Study Materials
--  §07  Fees & Payment Plans
--  §08  Enrollments & Payments
--  §09  Learning Progress  (Resume, Watch Hours)
--  §10  Assessments  (7 Question Types)
--  §11  Certificates
--  §12  Live Streams & Chat
--  §13  Reviews
--  §14  YouTube OAuth Tokens
--  §15  Indexes
--  §16  Auth Trigger + Backfill
--  §17  Row-Level Security (Admin CRUD + User Policies)
-- ============================================================

-- ============================================================
-- §01  EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- for full-text search on names/titles

-- ============================================================
-- §02  ENUMERATIONS
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM (
  'student',
  'instructor',
  'admin'
);

-- Professional certification bodies
CREATE TYPE program_body AS ENUM (
  'ACCA',   -- Association of Chartered Certified Accountants (UK)
  'CFA',    -- Chartered Financial Analyst (USA)
  'CMA'     -- Certified Management Accountant (US)
);

-- ACCA has 3 levels; CFA has 3 levels; CMA has 2 parts
CREATE TYPE program_level_label AS ENUM (
  'Applied Knowledge',     -- ACCA L1
  'Applied Skills',        -- ACCA L2
  'Strategic Professional',-- ACCA L3
  'Level I',               -- CFA L1
  'Level II',              -- CFA L2
  'Level III',             -- CFA L3
  'Part 1',                -- CMA Part 1
  'Part 2'                 -- CMA Part 2
);

-- Course / subject publish state
CREATE TYPE publish_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Study material types
CREATE TYPE material_type AS ENUM (
  'pdf',
  'video',
  'slide',
  'spreadsheet',
  'link',
  'image',
  'audio',
  'zip'
);

-- Material access level
CREATE TYPE material_access AS ENUM (
  'free',         -- visible without enrollment
  'enrolled',     -- requires active enrollment
  'premium'       -- requires premium plan
);

-- Enrollment states
CREATE TYPE enroll_status AS ENUM (
  'active',
  'expired',
  'refunded',
  'paused'
);

-- Payment states
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_paid'
);

-- Payment plan type
CREATE TYPE plan_type AS ENUM (
  'one_time',
  'emi',          -- Equal Monthly Instalments
  'subscription'
);

-- Instalment states
CREATE TYPE instalment_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'waived'
);

-- Live stream states
CREATE TYPE stream_status AS ENUM (
  'scheduled',
  'live',
  'ended',
  'cancelled'
);

-- Assessment question types (all 7 required)
CREATE TYPE question_type AS ENUM (
  'mcq',                  -- Single-correct MCQ
  'multiple_select',      -- Multiple correct options
  'subjective',           -- Long/short answer
  'fill_blank',           -- Fill in the blank
  'true_false',           -- True / False
  'assertion_reasoning',  -- Assertion & Reasoning
  'numerical'             -- Numeric answer entry
);

-- Quiz classification
CREATE TYPE quiz_type AS ENUM (
  'practice',
  'graded',
  'mock_exam',
  'final_exam'
);

-- Quiz attempt states
CREATE TYPE attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'timed_out',
  'abandoned'
);

-- Certificate states
CREATE TYPE cert_status AS ENUM (
  'issued',
  'revoked'
);

-- ============================================================
-- §03  USERS & STUDENT PROFILES
-- ============================================================

-- Core user record (mirrors auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'User',
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Core user identity synced from auth.users via trigger.';

-- Extended profile for students (1:1 with users where role = student)
CREATE TABLE public.student_profiles (
  user_id              UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

-- Academic background
college_name TEXT,
university TEXT,
degree TEXT,
graduation_year INT,
field_of_study TEXT,

-- Professional background
current_employer TEXT,
job_title TEXT,
years_of_experience SMALLINT DEFAULT 0,

-- Exam targeting
target_exam_body program_body, -- ACCA / CFA / CMA
target_exam_level TEXT, -- e.g., 'Level I', 'Part 1'
target_exam_date DATE,
exam_attempt_number SMALLINT DEFAULT 1,

-- Location
city TEXT, state TEXT, country TEXT DEFAULT 'India',

-- Social / misc
linkedin_url TEXT,
bio TEXT,
date_of_birth DATE,
gender TEXT CHECK (
    gender IN (
        'male',
        'female',
        'other',
        'prefer_not_to_say'
    )
),

-- Preferences

preferred_language   TEXT        DEFAULT 'en',
  notification_email   BOOLEAN     NOT NULL DEFAULT TRUE,
  notification_sms     BOOLEAN     NOT NULL DEFAULT FALSE,
  notification_whatsapp BOOLEAN    NOT NULL DEFAULT FALSE,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.student_profiles IS 'Extended student-specific profile data (1-to-1 with users).';

-- ============================================================
-- §04  PROFESSIONAL COURSES  (ACCA / CFA / CMA)
-- ============================================================

-- Top-level program definition (e.g., "ACCA", "CFA", "CMA")
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    body program_body NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.programs IS 'Top-level professional certification programs (ACCA, CFA, CMA).';

-- Seed data for programs
INSERT INTO
    public.programs (
        body,
        full_name,
        country,
        description
    )
VALUES (
        'ACCA',
        'Association of Chartered Certified Accountants',
        'United Kingdom',
        'Global professional accounting qualification with 13 exams across 3 levels.'
    ),
    (
        'CFA',
        'Chartered Financial Analyst',
        'United States of America',
        'Investment management designation with 3 progressive exam levels.'
    ),
    (
        'CMA',
        'Certified Management Accountant',
        'United States of America',
        'Financial management & strategy qualification with 2-part exam.'
    );

-- Program levels (e.g., ACCA → Applied Knowledge, Applied Skills, Strategic Professional)
CREATE TABLE public.program_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    program_id UUID NOT NULL REFERENCES public.programs (id) ON DELETE CASCADE,
    label program_level_label NOT NULL,
    sequence_no SMALLINT NOT NULL, -- ordering within program
    description TEXT,
    UNIQUE (program_id, label)
);

COMMENT ON TABLE public.program_levels IS 'Levels within each program (e.g., ACCA L1/L2/L3, CFA L1/L2/L3, CMA Part1/Part2).';

-- Seed program levels
INSERT INTO
    public.program_levels (
        program_id,
        label,
        sequence_no
    )
VALUES
    -- ACCA
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Applied Knowledge',
        1
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Applied Skills',
        2
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Strategic Professional',
        3
    ),
    -- CFA
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'CFA'
        ),
        'Level I',
        1
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'CFA'
        ),
        'Level II',
        2
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'CFA'
        ),
        'Level III',
        3
    ),
    -- CMA
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'CMA'
        ),
        'Part 1',
        1
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'CMA'
        ),
        'Part 2',
        2
    );

-- Subject / Paper within a level
--   ACCA: Business & Technology (BT), Management Accounting (MA), etc.
--   CFA:  Ethical & Professional Standards, Quantitative Methods, etc.
--   CMA:  Financial Planning, Strategic Financial Management, etc.
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    program_level_id UUID NOT NULL REFERENCES public.program_levels (id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g., 'BT', 'MA', 'FA' for ACCA
    name TEXT NOT NULL,
    description TEXT,
    sequence_no SMALLINT NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (program_level_id, code)
);

COMMENT ON TABLE public.subjects IS 'Individual papers/subjects within each program level.';

-- Course offering for a subject
--   One subject can have multiple course offerings (e.g., June vs December session,
--   Weekday vs Weekend batch, Hindi vs English medium)
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    subject_id UUID NOT NULL REFERENCES public.subjects (id) ON DELETE RESTRICT,
    instructor_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    what_you_learn TEXT [], -- bullet-point outcomes
    requirements TEXT [], -- prerequisites
    thumbnail_url TEXT,
    preview_video_url TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    status publish_status NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    total_students INT NOT NULL DEFAULT 0, -- denormalised counter
    avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0, -- denormalised
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS 'Course offerings tied to a specific subject/paper. Multiple offerings per subject possible.';

-- ============================================================
-- §05  COURSE STRUCTURE  (Chapters → Lectures)
--      A course can have chapters (1–N).
--      Each chapter can have lectures AND course-level quizzes.
-- ============================================================

-- Chapter (equivalent to your "Section"; renamed for professional feel)
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position SMALLINT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE public.chapters IS 'Chapters within a course. Each chapter holds lectures and/or quizzes.';

-- Lecture within a chapter
CREATE TABLE public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    chapter_id UUID NOT NULL REFERENCES public.chapters (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT, -- CDN or YouTube URL
    video_provider TEXT DEFAULT 'youtube' CHECK (
        video_provider IN (
            'youtube',
            'cloudfront',
            'bunny',
            'vimeo'
        )
    ),
    yt_video_id TEXT, -- extracted YouTube ID
    duration_sec INT NOT NULL DEFAULT 0,
    position SMALLINT NOT NULL DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT FALSE, -- free preview before enrollment
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    transcript_url TEXT,
    notes_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lectures IS 'Individual video lectures within a chapter.';

-- Downloadable resources attached to a lecture
CREATE TABLE public.lecture_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    lecture_id UUID NOT NULL REFERENCES public.lectures (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type material_type NOT NULL DEFAULT 'pdf',
    file_size_kb INT,
    position SMALLINT NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.lecture_resources IS 'Downloadable files attached to individual lectures.';

-- ============================================================
-- §06  STUDY MATERIALS
--      Course-level materials (not tied to a lecture):
--      question banks, revision kits, mock exams, formula sheets
-- ============================================================

CREATE TABLE public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters (id) ON DELETE SET NULL, -- optional chapter scope
    title TEXT NOT NULL,
    description TEXT,
    type material_type NOT NULL DEFAULT 'pdf',
    access_level material_access NOT NULL DEFAULT 'enrolled',
    file_url TEXT NOT NULL,
    file_size_kb INT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    position SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.study_materials IS 'Course-level study materials: question banks, revision kits, formula sheets, mock papers, etc.';

-- ============================================================
-- §07  FEES & PAYMENT PLANS
-- ============================================================

-- Base pricing for a course
CREATE TABLE public.course_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g., 'Standard', 'Early Bird', 'Corporate'
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    base_price NUMERIC(10, 2) NOT NULL,
    discounted_price NUMERIC(10, 2),
    discount_pct NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN base_price > 0
            AND discounted_price IS NOT NULL THEN ROUND(
                (
                    (base_price - discounted_price) / base_price
                ) * 100,
                2
            )
            ELSE 0
        END
    ) STORED,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (course_id, label)
);

COMMENT ON TABLE public.course_pricing IS 'Pricing tiers per course (standard, early bird, corporate, etc.).';

-- Instalment / EMI plans attached to a pricing tier
CREATE TABLE public.payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    pricing_id UUID NOT NULL REFERENCES public.course_pricing (id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL DEFAULT 'one_time',
    label TEXT NOT NULL, -- e.g., '3-Month EMI', '6-Month EMI'
    total_instalments SMALLINT NOT NULL DEFAULT 1,
    instalment_amount NUMERIC(10, 2) NOT NULL,
    frequency_days SMALLINT NOT NULL DEFAULT 30, -- days between instalments
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE public.payment_plans IS 'EMI and subscription payment plans for each pricing tier.';

-- Coupon / discount codes
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (
        discount_type IN ('flat', 'percent')
    ),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.coupons IS 'Discount / promo codes applicable at checkout.';

-- ============================================================
-- §08  ENROLLMENTS & PAYMENTS
-- ============================================================

-- Enrollment record (created after successful payment)
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    pricing_id UUID REFERENCES public.course_pricing (id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.payment_plans (id) ON DELETE SET NULL,
    coupon_id UUID REFERENCES public.coupons (id) ON DELETE SET NULL,
    status enroll_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = lifetime access
    UNIQUE (user_id, course_id)
);

COMMENT ON TABLE public.enrollments IS 'Student enrollment record per course.';

-- Payment transaction record
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    instalment_number SMALLINT, -- which instalment (NULL for one-time)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Individual payment transactions (one-time or per instalment).';

-- Instalment schedule (generated when plan_id is set)
CREATE TABLE public.instalment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
    instalment_no SMALLINT NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status instalment_status NOT NULL DEFAULT 'pending',
    payment_id UUID REFERENCES public.payments (id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    UNIQUE (enrollment_id, instalment_no)
);

COMMENT ON TABLE public.instalment_schedule IS 'Due-date schedule for EMI-based enrollments.';

-- ============================================================
-- §09  LEARNING PROGRESS  (Resume Video + Watch Hours)
-- ============================================================

CREATE TABLE public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures (id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    watched_seconds INT NOT NULL DEFAULT 0,
    resume_at_seconds INT NOT NULL DEFAULT 0, -- resume point for video player
    watch_sessions INT NOT NULL DEFAULT 0, -- how many times opened
    last_watched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, lecture_id)
);

COMMENT ON TABLE public.lecture_progress IS 'Per-lecture watch progress including resume position and watch hours.';

-- Aggregated daily watch hours per user per course (for analytics)
CREATE TABLE public.watch_hours_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    watch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    seconds INT NOT NULL DEFAULT 0,
    UNIQUE (
        user_id,
        course_id,
        watch_date
    )
);

COMMENT ON TABLE public.watch_hours_daily IS 'Daily watch-time rollup per user/course for analytics dashboards.';

-- ============================================================
-- §10  ASSESSMENTS  (7 Question Types)
--
--  Quiz can be attached to:
--    • a chapter  (chapter-level quiz — e.g., Chapter 3 Quiz)
--    • a course   (course-level exam — e.g., Full Mock Exam)
--  Both supported via nullable FKs.
-- ============================================================

CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters (id) ON DELETE CASCADE, -- NULL = course-wide
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    type quiz_type NOT NULL DEFAULT 'practice',
    total_marks INT NOT NULL DEFAULT 0,
    passing_marks INT NOT NULL DEFAULT 0,
    time_limit_sec INT, -- NULL = untimed
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
    max_attempts SMALLINT DEFAULT NULL, -- NULL = unlimited
    show_answers_after TEXT DEFAULT 'submit' CHECK (
        show_answers_after IN ('submit', 'never', 'pass')
    ),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.quizzes IS 'Quizzes scoped to a chapter or the whole course. NULL chapter_id = course-level exam.';

-- Question bank
CREATE TABLE public.questions (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID          NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type           question_type NOT NULL DEFAULT 'mcq',
  question_text  TEXT          NOT NULL,
  explanation    TEXT,          -- shown after submission
  source_ref     TEXT,          -- textbook / chapter reference
  marks          NUMERIC(5,2)   NOT NULL DEFAULT 1,
  negative_marks NUMERIC(5,2)   NOT NULL DEFAULT 0,
  position       SMALLINT       NOT NULL DEFAULT 0,
  is_mandatory   BOOLEAN        NOT NULL DEFAULT TRUE,

-- For fill_blank: the blank placeholder
blank_placeholder TEXT,

-- For assertion_reasoning: stores assertion and reason as separate fields
assertion_text TEXT, reason_text TEXT,

-- For numerical: accepted range
numerical_answer       NUMERIC(15,5),
  numerical_tolerance    NUMERIC(15,5)  DEFAULT 0   -- ± tolerance
);

COMMENT ON TABLE public.questions IS 'Question bank supporting all 7 question types.';

-- Options for MCQ, Multiple Select, True/False, Assertion & Reasoning
CREATE TABLE public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    question_id UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    position SMALLINT NOT NULL DEFAULT 0,
    explanation TEXT -- per-option explanation (optional)
);

COMMENT ON TABLE public.question_options IS 'Answer options for objective question types.';

-- Quiz attempt header
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    quiz_id UUID NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    score NUMERIC(8, 2) NOT NULL DEFAULT 0,
    total_marks NUMERIC(8, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN total_marks > 0 THEN ROUND(
                (score / total_marks) * 100,
                2
            )
            ELSE 0
        END
    ) STORED,
    passed BOOLEAN,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    attempt_number SMALLINT NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent_sec INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.quiz_attempts IS 'Each quiz attempt by a student.';

-- Per-question answer within an attempt
CREATE TABLE public.quiz_answers (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id            UUID    NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id           UUID    NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,

-- For MCQ / True-False / Assertion-Reasoning: single selected option
selected_option_id UUID REFERENCES public.question_options (id) ON DELETE SET NULL,

-- For Multiple Select: array of selected option IDs
selected_option_ids UUID [],

-- For Subjective: free text answer
text_answer TEXT,

-- For Fill in the Blank
blank_answer TEXT,

-- For Numerical

numerical_answer      NUMERIC(15,5),

  marks_awarded         NUMERIC(5,2),
  is_correct            BOOLEAN,
  is_marked_for_review  BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at           TIMESTAMPTZ,

  UNIQUE (attempt_id, question_id)
);

COMMENT ON TABLE public.quiz_answers IS 'Student answers per question supporting all 7 answer types.';

-- ============================================================
-- §11  CERTIFICATES
-- ============================================================

CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    cert_number TEXT NOT NULL UNIQUE, -- human-readable cert ID: EVK-ACCA-2024-00001
    cert_url TEXT NOT NULL, -- PDF URL on CDN
    status cert_status NOT NULL DEFAULT 'issued',
    completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 100,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    UNIQUE (user_id, course_id)
);

COMMENT ON TABLE public.certificates IS 'Course completion certificates with unique cert numbers.';

-- Certificate number sequence function
CREATE SEQUENCE IF NOT EXISTS cert_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_cert_number(p_course_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_body TEXT;
  v_year TEXT;
  v_seq  TEXT;
BEGIN
  SELECT p.body::TEXT INTO v_body
  FROM public.courses c
  JOIN public.subjects s ON s.id = c.subject_id
  JOIN public.program_levels pl ON pl.id = s.program_level_id
  JOIN public.programs p ON p.id = pl.program_id
  WHERE c.id = p_course_id;

  v_year := TO_CHAR(NOW(), 'YYYY');
  v_seq  := LPAD(NEXTVAL('cert_seq')::TEXT, 5, '0');
  RETURN CONCAT('EVK-', COALESCE(v_body, 'GEN'), '-', v_year, '-', v_seq);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- §12  LIVE STREAMS & CHAT
-- ============================================================

CREATE TABLE public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT [], -- stream tags
    notes TEXT, -- admin notes
    status stream_status NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    yt_broadcast_id TEXT, -- YouTube liveBroadcast ID
    yt_stream_id TEXT, -- YouTube liveStream ID
    yt_video_id TEXT, -- YouTube video ID for embed
    yt_rtmp_url TEXT, -- RTMP ingestion URL
    yt_stream_key TEXT, -- Stream key (sensitive)
    yt_live_chat_id TEXT, -- YouTube live chat ID
    recording_url TEXT, -- Post-stream recording URL
    concurrent_viewers INT NOT NULL DEFAULT 0,
    peak_viewers INT NOT NULL DEFAULT 0,
    total_chat_msgs INT NOT NULL DEFAULT 0,
    duration_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.live_streams IS 'Live class sessions with YouTube integration and analytics.';

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    author_name TEXT, -- From user or YouTube
    author_avatar TEXT, -- Avatar URL
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'message', -- message|question|announcement|system
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE, -- Moderation flag
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Soft delete
    yt_message_id TEXT, -- YouTube message ID (dedup)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_messages IS 'Live stream chat with moderation and YouTube sync.';

-- Analytics snapshots (periodic polling of live stream viewer stats)
CREATE TABLE public.stream_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    concurrent_viewers INT NOT NULL,
    messages_total INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stream_analytics IS 'Periodic snapshots of live stream metrics';

-- Polls during live streams
CREATE TABLE public.stream_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    anonymous_votes BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.stream_polls IS 'Live polls created during streams';

-- Poll answer options
CREATE TABLE public.stream_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    poll_id UUID NOT NULL REFERENCES public.stream_polls (id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    position SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (poll_id, position)
);

COMMENT ON TABLE public.stream_poll_options IS 'Answer options for a poll';

-- Poll votes
CREATE TABLE public.stream_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    option_id UUID NOT NULL REFERENCES public.stream_poll_options (id) ON DELETE CASCADE,
    poll_id UUID NOT NULL REFERENCES public.stream_polls (id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (poll_id, user_id)
);

COMMENT ON TABLE public.stream_poll_votes IS 'Individual poll votes';

-- ============================================================
-- §13  REVIEWS
-- ============================================================

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

COMMENT ON TABLE public.reviews IS 'Student course reviews (moderated by admin before display).';

-- ============================================================
-- §14  YOUTUBE OAUTH TOKENS
--      Only amarbiradar147@gmail.com can access this table.
-- ============================================================

CREATE TABLE public.youtube_tokens (
    user_id UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.youtube_tokens IS 'YouTube/Google OAuth refresh tokens. Admin-only access.';

-- Per-admin OBS encoder settings for live streaming control room
CREATE TABLE IF NOT EXISTS public.stream_encoder_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    obs_host TEXT NOT NULL DEFAULT 'localhost',
    obs_port INT NOT NULL DEFAULT 4455,
    obs_password TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stream_encoder_settings IS 'Per-admin OBS/encoder connection preferences for live streaming.';

ALTER TABLE public.stream_encoder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_own_encoder_settings_select"
  ON public.stream_encoder_settings FOR SELECT TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_insert"
  ON public.stream_encoder_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_update"
  ON public.stream_encoder_settings FOR UPDATE TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ())
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_delete"
  ON public.stream_encoder_settings FOR DELETE TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ());

-- ============================================================
-- §15  INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON public.users (email);

CREATE INDEX idx_users_role ON public.users (role);

-- Programs & structure
CREATE INDEX idx_program_levels_prog ON public.program_levels (program_id);

CREATE INDEX idx_subjects_level ON public.subjects (program_level_id);

CREATE INDEX idx_courses_subject ON public.courses (subject_id);

CREATE INDEX idx_courses_instructor ON public.courses (instructor_id);

CREATE INDEX idx_courses_status ON public.courses (status);

CREATE INDEX idx_courses_slug ON public.courses (slug);

-- Chapters & lectures
CREATE INDEX idx_chapters_course ON public.chapters (course_id);

CREATE INDEX idx_lectures_chapter ON public.lectures (chapter_id);

-- Study materials
CREATE INDEX idx_study_mat_course ON public.study_materials (course_id);

CREATE INDEX idx_study_mat_chapter ON public.study_materials (chapter_id);

-- Pricing & plans
CREATE INDEX idx_pricing_course ON public.course_pricing (course_id);

CREATE INDEX idx_plans_pricing ON public.payment_plans (pricing_id);

-- Enrollments & payments
CREATE INDEX idx_enrollments_user ON public.enrollments (user_id);

CREATE INDEX idx_enrollments_course ON public.enrollments (course_id);

CREATE INDEX idx_payments_user ON public.payments (user_id);

CREATE INDEX idx_payments_enroll ON public.payments (enrollment_id);

CREATE INDEX idx_instalments_enroll ON public.instalment_schedule (enrollment_id);

-- Progress
CREATE INDEX idx_progress_user ON public.lecture_progress (user_id);

CREATE INDEX idx_progress_lecture ON public.lecture_progress (lecture_id);

CREATE INDEX idx_watch_user_course ON public.watch_hours_daily (user_id, course_id);

-- Assessments
CREATE INDEX idx_quizzes_course ON public.quizzes (course_id);

CREATE INDEX idx_quizzes_chapter ON public.quizzes (chapter_id);

CREATE INDEX idx_questions_quiz ON public.questions (quiz_id);

CREATE INDEX idx_options_question ON public.question_options (question_id);

CREATE INDEX idx_attempts_user ON public.quiz_attempts (user_id);

CREATE INDEX idx_attempts_quiz ON public.quiz_attempts (quiz_id);

CREATE INDEX idx_answers_attempt ON public.quiz_answers (attempt_id);

-- Certificates
CREATE INDEX idx_certs_user ON public.certificates (user_id);

CREATE INDEX idx_certs_course ON public.certificates (course_id);

-- Live streams
CREATE INDEX idx_streams_course ON public.live_streams (course_id);

CREATE INDEX idx_streams_status ON public.live_streams (status);

CREATE INDEX idx_streams_scheduled ON public.live_streams (scheduled_at);

CREATE INDEX idx_chat_stream ON public.chat_messages (live_stream_id);

CREATE INDEX idx_chat_user ON public.chat_messages (user_id);

CREATE INDEX idx_chat_type            ON public.chat_messages(type);

CREATE INDEX idx_analytics_stream ON public.stream_analytics (live_stream_id);

CREATE INDEX idx_polls_stream ON public.stream_polls (live_stream_id);

CREATE INDEX idx_poll_options_poll ON public.stream_poll_options (poll_id);

CREATE INDEX idx_poll_votes_poll ON public.stream_poll_votes (poll_id);

CREATE INDEX idx_poll_votes_user ON public.stream_poll_votes (user_id);

-- Reviews
CREATE INDEX idx_reviews_course ON public.reviews (course_id);

-- Full-text search indexes (trigram)
CREATE INDEX idx_courses_title_trgm ON public.courses USING gin (title gin_trgm_ops);

CREATE INDEX idx_subjects_name_trgm ON public.subjects USING gin (name gin_trgm_ops);

-- ============================================================
-- §16  AUTH TRIGGER + BACKFILL
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name   TEXT;
  v_email  TEXT;
  v_avatar TEXT;
  v_role   user_role;
BEGIN
  -- Normalise email
  v_email := LOWER(TRIM(
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '')
  ));
  IF v_email = '' THEN
    v_email := CONCAT(NEW.id::TEXT, '@no-email.local');
  END IF;

  -- Derive display name
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),      ''),
    split_part(v_email, '@', 1),
    'User'
  );

  -- Derive avatar
  v_avatar := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'),    '')
  );

  -- Assign role
  v_role := CASE
    WHEN v_email = 'amarbiradar147@gmail.com' THEN 'admin'::user_role
    ELSE 'student'::user_role
  END;

  -- Upsert user row
  INSERT INTO public.users (id, name, email, avatar, role)
  VALUES (NEW.id, v_name, v_email, v_avatar, v_role)
  ON CONFLICT (id) DO UPDATE
    SET name   = EXCLUDED.name,
        email  = EXCLUDED.email,
        avatar = EXCLUDED.avatar;

  -- Auto-create student_profile for non-admins
  IF v_role = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email collision: update existing row
    UPDATE public.users
    SET
      name   = COALESCE(v_name,   public.users.name),
      avatar = COALESCE(v_avatar, public.users.avatar)
    WHERE LOWER(public.users.email) = v_email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at auto-update trigger (reusable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill existing auth.users
INSERT INTO
    public.users (id, name, email, avatar, role)
SELECT
    au.id,
    COALESCE(
        NULLIF(
            TRIM(
                au.raw_user_meta_data ->> 'full_name'
            ),
            ''
        ),
        NULLIF(
            TRIM(
                au.raw_user_meta_data ->> 'name'
            ),
            ''
        ),
        split_part(au.email, '@', 1),
        'User'
    ),
    LOWER(TRIM(au.email)),
    COALESCE(
        au.raw_user_meta_data ->> 'avatar_url',
        au.raw_user_meta_data ->> 'picture'
    ),
    CASE
        WHEN au.email = 'amarbiradar147@gmail.com' THEN 'admin'::user_role
        ELSE 'student'::user_role
    END
FROM auth.users au
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.users pu
        WHERE
            pu.id = au.id
    );

-- ============================================================
-- §17  ROW-LEVEL SECURITY
-- ============================================================
--  Convention:
--    • Admin (amarbiradar147@gmail.com) gets full CRUD on all tables.
--    • Other users get the minimum access needed for their role.
-- ============================================================

-- Helper: returns TRUE if the current JWT belongs to the admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() ->> 'email') = 'amarbiradar147@gmail.com';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: returns TRUE if the current JWT belongs to an instructor
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'instructor'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_users" ON public.users FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "users_read_own" ON public.users FOR
SELECT TO authenticated USING (id = auth.uid ());

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE
    TO authenticated USING (id = auth.uid ())
WITH
    CHECK (id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- student_profiles
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_student_profiles" ON public.student_profiles FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "student_read_own_profile" ON public.student_profiles FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "student_update_own_profile" ON public.student_profiles
FOR UPDATE
    TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- programs  (public read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_programs" ON public.programs FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_programs" ON public.programs FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- program_levels  (public read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.program_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_program_levels" ON public.program_levels FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_program_levels" ON public.program_levels FOR
SELECT TO anon, authenticated USING (TRUE);

-- ────────────────────────────────────────────────────────────
-- subjects  (public read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_subjects" ON public.subjects FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- courses  (public read published, admin + instructor write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "instructor_own_courses" ON public.courses FOR ALL TO authenticated USING (
    instructor_id = auth.uid ()
    AND public.is_instructor ()
)
WITH
    CHECK (
        instructor_id = auth.uid ()
        AND public.is_instructor ()
    );

CREATE POLICY "public_read_published_courses" ON public.courses FOR
SELECT TO anon, authenticated USING (status = 'published');

-- ────────────────────────────────────────────────────────────
-- chapters  (enrolled read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_chapters" ON public.chapters FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_chapters" ON public.chapters FOR
SELECT TO authenticated USING (
        is_published = TRUE
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.user_id = auth.uid ()
                AND e.course_id = chapters.course_id
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- lectures  (preview free, enrolled read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_lectures" ON public.lectures FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_preview_lectures" ON public.lectures FOR
SELECT TO anon, authenticated USING (
        is_preview = TRUE
        AND is_published = TRUE
    );

CREATE POLICY "enrolled_read_lectures" ON public.lectures FOR
SELECT TO authenticated USING (
        is_published = TRUE
        AND EXISTS (
            SELECT 1
            FROM public.chapters ch
                JOIN public.enrollments e ON e.course_id = ch.course_id
            WHERE
                ch.id = lectures.chapter_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- lecture_resources  (enrolled read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.lecture_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_lecture_resources" ON public.lecture_resources FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_lecture_resources" ON public.lecture_resources FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.lectures l
                JOIN public.chapters ch ON ch.id = l.chapter_id
                JOIN public.enrollments e ON e.course_id = ch.course_id
            WHERE
                l.id = lecture_resources.lecture_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- study_materials  (access_level-aware, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_study_materials" ON public.study_materials FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_free_materials" ON public.study_materials FOR
SELECT TO anon, authenticated USING (
        access_level = 'free'
        AND is_published = TRUE
    );

CREATE POLICY "enrolled_read_enrolled_materials" ON public.study_materials FOR
SELECT TO authenticated USING (
        is_published = TRUE
        AND access_level IN ('enrolled', 'premium')
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.user_id = auth.uid ()
                AND e.course_id = study_materials.course_id
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- course_pricing  (public read active, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.course_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pricing" ON public.course_pricing FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_active_pricing" ON public.course_pricing FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- payment_plans  (public read, admin write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payment_plans" ON public.payment_plans FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_active_plans" ON public.payment_plans FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- coupons  (admin only)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

-- ────────────────────────────────────────────────────────────
-- enrollments  (user reads own, admin full, instructor reads their courses)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_read_own_enrollments" ON public.enrollments FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "user_insert_own_enrollment" ON public.enrollments FOR INSERT TO authenticated
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- payments  (user reads own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payments" ON public.payments FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_read_own_payments" ON public.payments FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- instalment_schedule  (user reads own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.instalment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_instalments" ON public.instalment_schedule FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_read_own_instalments" ON public.instalment_schedule FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.id = instalment_schedule.enrollment_id
                AND e.user_id = auth.uid ()
        )
    );

-- ────────────────────────────────────────────────────────────
-- lecture_progress  (user own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_progress" ON public.lecture_progress FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_own_progress" ON public.lecture_progress FOR ALL TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- watch_hours_daily  (user own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.watch_hours_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_watch_hours" ON public.watch_hours_daily FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_own_watch_hours" ON public.watch_hours_daily FOR ALL TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- quizzes  (enrolled read, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_quizzes" ON public.quizzes FOR
SELECT TO authenticated USING (
        is_published = TRUE
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.user_id = auth.uid ()
                AND e.course_id = quizzes.course_id
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- questions  (enrolled read, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_questions" ON public.questions FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_questions" ON public.questions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.quizzes qz
                JOIN public.enrollments e ON e.course_id = qz.course_id
            WHERE
                qz.id = questions.quiz_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- question_options  (enrolled read, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_options" ON public.question_options FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_options" ON public.question_options FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.questions q
                JOIN public.quizzes qz ON qz.id = q.quiz_id
                JOIN public.enrollments e ON e.course_id = qz.course_id
            WHERE
                q.id = question_options.question_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- quiz_attempts  (user own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_own_attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- quiz_answers  (user own attempt, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_answers" ON public.quiz_answers FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_own_quiz_answers" ON public.quiz_answers FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.quiz_attempts qa
        WHERE
            qa.id = quiz_answers.attempt_id
            AND qa.user_id = auth.uid ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.quiz_attempts qa
            WHERE
                qa.id = quiz_answers.attempt_id
                AND qa.user_id = auth.uid ()
        )
    );

-- ────────────────────────────────────────────────────────────
-- certificates  (user reads own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "user_read_own_cert" ON public.certificates FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- live_streams  (enrolled read published, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_streams" ON public.live_streams FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_streams" ON public.live_streams FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.user_id = auth.uid ()
                AND e.course_id = live_streams.course_id
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- chat_messages  (enrolled read/insert own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_chat" ON public.chat_messages FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_chat" ON public.chat_messages FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.live_streams ls
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                ls.id = chat_messages.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

CREATE POLICY "enrolled_insert_chat" ON public.chat_messages FOR INSERT TO authenticated
WITH
    CHECK (
        user_id = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.live_streams ls
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                ls.id = chat_messages.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- stream_analytics  (enrolled read, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_analytics" ON public.stream_analytics FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_analytics" ON public.stream_analytics FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.live_streams ls
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                ls.id = stream_analytics.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- stream_polls  (enrolled read/vote, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.stream_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_polls" ON public.stream_polls FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_polls" ON public.stream_polls FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.live_streams ls
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                ls.id = stream_polls.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- stream_poll_options  (enrolled read, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.stream_poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_poll_options" ON public.stream_poll_options FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_poll_options" ON public.stream_poll_options FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.stream_polls sp
                JOIN public.live_streams ls ON ls.id = sp.live_stream_id
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                sp.id = stream_poll_options.poll_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- stream_poll_votes  (user insert own, enrolled read all, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.stream_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_poll_votes" ON public.stream_poll_votes FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "enrolled_read_poll_votes" ON public.stream_poll_votes FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.stream_polls sp
                JOIN public.live_streams ls ON ls.id = sp.live_stream_id
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                sp.id = stream_poll_votes.poll_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

CREATE POLICY "enrolled_insert_poll_vote" ON public.stream_poll_votes FOR INSERT TO authenticated
WITH
    CHECK (
        COALESCE(user_id, auth.uid ()) = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.stream_polls sp
                JOIN public.live_streams ls ON ls.id = sp.live_stream_id
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                sp.id = stream_poll_votes.poll_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- ────────────────────────────────────────────────────────────
-- reviews  (public read approved, user insert/update own, admin full)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_reviews" ON public.reviews FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "public_read_approved_reviews" ON public.reviews FOR
SELECT TO anon, authenticated USING (is_approved = TRUE);

CREATE POLICY "enrolled_insert_review" ON public.reviews FOR INSERT TO authenticated
WITH
    CHECK (
        user_id = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE
                e.user_id = auth.uid ()
                AND e.course_id = reviews.course_id
                AND e.status = 'active'
        )
    );

CREATE POLICY "user_update_own_review" ON public.reviews
FOR UPDATE
    TO authenticated USING (user_id = auth.uid ())
WITH
    CHECK (user_id = auth.uid ());

-- ────────────────────────────────────────────────────────────
-- youtube_tokens  (ADMIN ONLY — amarbiradar147@gmail.com)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_yt_select" ON public.youtube_tokens FOR
SELECT TO authenticated USING (
        (auth.jwt () ->> 'email') = 'amarbiradar147@gmail.com'
    );

CREATE POLICY "admin_only_yt_insert" ON public.youtube_tokens FOR INSERT TO authenticated
WITH
    CHECK (
        (auth.jwt () ->> 'email') = 'amarbiradar147@gmail.com'
    );

CREATE POLICY "admin_only_yt_update" ON public.youtube_tokens
FOR UPDATE
    TO authenticated USING (
        (auth.jwt () ->> 'email') = 'amarbiradar147@gmail.com'
    );

CREATE POLICY "admin_only_yt_delete" ON public.youtube_tokens FOR DELETE TO authenticated USING (
    (auth.jwt () ->> 'email') = 'amarbiradar147@gmail.com'
);

-- ================================================================
-- EVOKE EDUGLOBAL — Question Bank Schema  v1.0
-- Run AFTER the Quiz Builder Schema (v3.0)
-- ================================================================

-- ── New Enum ─────────────────────────────────────────────────────

CREATE TYPE bank_import_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'partial'   -- some questions imported, some failed
);

CREATE TYPE difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard',
  'expert'
);

-- ── Topic Taxonomy ────────────────────────────────────────────────
-- Mirrors: Program → Level → Subject (already in main schema)
-- Adds:    Topic → Sub-Topic (new)

CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    subject_id UUID NOT NULL REFERENCES public.subjects (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    position SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (subject_id, slug)
);

COMMENT ON TABLE public.topics IS 'Topics within a subject/paper. e.g., ACCA BT → "The Business Organisation", "Leadership".';

CREATE TABLE public.sub_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    topic_id UUID NOT NULL REFERENCES public.topics (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    position SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (topic_id, slug)
);

COMMENT ON TABLE public.sub_topics IS 'Optional granular sub-topics within a topic.';

-- ── Bank Questions ────────────────────────────────────────────────
-- Independent questions NOT tied to any quiz

CREATE TABLE public.bank_questions (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

-- Taxonomy (all required for proper organisation)
subject_id UUID NOT NULL REFERENCES public.subjects (id) ON DELETE RESTRICT,
topic_id UUID NOT NULL REFERENCES public.topics (id) ON DELETE RESTRICT,
sub_topic_id UUID REFERENCES public.sub_topics (id) ON DELETE SET NULL,

-- Question content
type question_type NOT NULL DEFAULT 'mcq',
question_text TEXT NOT NULL,
question_image_url TEXT, -- Cloudflare R2

-- Metadata
difficulty difficulty_level NOT NULL DEFAULT 'medium',
marks NUMERIC(5, 2) NOT NULL DEFAULT 1,
negative_marks NUMERIC(5, 2) NOT NULL DEFAULT 0,
source_ref TEXT, -- e.g., "ACCA BT Past Paper Jun 2019 Q12"
year SMALLINT, -- exam year if from past paper
session TEXT, -- e.g., "June", "December", "Q1"
tags TEXT [], -- free-form tags for search

-- Type-specific fields (same as quiz questions)
assertion_text TEXT,
reason_text TEXT,
numerical_answer NUMERIC(15, 5),
numerical_tolerance NUMERIC(15, 5) DEFAULT 0,
blank_answer TEXT,
model_answer TEXT, -- for subjective

-- Explanation
explanation TEXT,
explanation_image_url TEXT, -- Cloudflare R2

-- Status & quality
is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- admin-reviewed
is_active BOOLEAN NOT NULL DEFAULT TRUE,
usage_count INT NOT NULL DEFAULT 0, -- denorm: how many quizzes use it
correct_rate NUMERIC(5, 2), -- denorm: % students who got it right (updated by trigger)

-- Audit
created_by            UUID            NOT NULL REFERENCES public.users(id),
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bank_questions IS 'Central question bank — reusable questions independent of any quiz.';

-- ── Bank Question Options ─────────────────────────────────────────

CREATE TABLE public.bank_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    question_id UUID NOT NULL REFERENCES public.bank_questions (id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    position SMALLINT NOT NULL DEFAULT 0,
    explanation TEXT
);

COMMENT ON TABLE public.bank_question_options IS 'Options for bank questions (MCQ, Multiple Select, True/False, A&R).';

-- ── Quiz ↔ Bank Link ──────────────────────────────────────────────
-- When a quiz "uses" a bank question, this junction table records the link.
-- The quiz still stores its own copy in public.questions for independence,
-- but this link allows "sync from bank" later.

CREATE TABLE public.quiz_bank_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    quiz_id UUID NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
    quiz_question_id UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
    bank_question_id UUID NOT NULL REFERENCES public.bank_questions (id) ON DELETE RESTRICT,
    is_synced BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = quiz version diverged from bank
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, bank_question_id)
);

COMMENT ON TABLE public.quiz_bank_links IS 'Tracks which quiz questions originated from the bank. Enables sync-from-bank.';

-- ── Bank Import Jobs ──────────────────────────────────────────────
-- Separate from quiz import jobs — these import INTO the bank, not a specific quiz

CREATE TABLE public.bank_import_jobs (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by          UUID               NOT NULL REFERENCES public.users(id),

-- Target taxonomy (admin selects before uploading)
subject_id UUID NOT NULL REFERENCES public.subjects (id),
topic_id UUID REFERENCES public.topics (id), -- optional pre-selection
sub_topic_id UUID REFERENCES public.sub_topics (id), -- optional

-- File info
original_file_name TEXT NOT NULL,
file_type TEXT NOT NULL, -- 'pdf','docx','csv','xlsx','txt'
r2_file_url TEXT NOT NULL,
file_size_bytes INT,

-- Processing
extracted_text TEXT,
extracted_json JSONB, -- Gemini output: array of parsed questions
status bank_import_status NOT NULL DEFAULT 'pending',
error_message TEXT,
parse_warnings JSONB, -- array of { line, warning } for partial failures

-- Results
total_found INT NOT NULL DEFAULT 0,
total_imported INT NOT NULL DEFAULT 0,
total_failed INT NOT NULL DEFAULT 0,
total_duplicates INT NOT NULL DEFAULT 0,

-- Topic auto-detection from file

detected_program    TEXT,              -- what Gemini detected from file header
  detected_level      TEXT,
  detected_subject    TEXT,
  detected_topics     TEXT[],            -- all topics Gemini found in the file

  created_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

COMMENT ON TABLE public.bank_import_jobs IS 'Import pipeline jobs for bulk importing questions into the question bank.';

-- ── Bank Question Import Map ──────────────────────────────────────
-- Tracks which bank_question was created from which import job line

CREATE TABLE public.bank_import_question_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    import_job_id UUID NOT NULL REFERENCES public.bank_import_jobs (id) ON DELETE CASCADE,
    bank_question_id UUID NOT NULL REFERENCES public.bank_questions (id) ON DELETE CASCADE,
    source_position INT, -- position in the source file (1-indexed)
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of UUID REFERENCES public.bank_questions (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.bank_import_question_map IS 'Maps each imported question back to its source import job and position.';

-- ── Bank Question Stats (for analytics) ──────────────────────────

CREATE TABLE public.bank_question_stats (
    question_id UUID PRIMARY KEY REFERENCES public.bank_questions (id) ON DELETE CASCADE,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    skip_count INT NOT NULL DEFAULT 0,
    correct_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN total_attempts > 0 THEN ROUND(
                (
                    correct_count::NUMERIC / total_attempts
                ) * 100,
                2
            )
            ELSE NULL
        END
    ) STORED,
    avg_time_sec NUMERIC(8, 2),
    last_used_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bank_question_stats IS 'Running performance stats per bank question (updated after each quiz attempt).';

-- ── Indexes ───────────────────────────────────────────────────────

CREATE INDEX idx_topics_subject ON public.topics (subject_id);

CREATE INDEX idx_subtopics_topic ON public.sub_topics (topic_id);

CREATE INDEX idx_bank_q_subject ON public.bank_questions (subject_id);

CREATE INDEX idx_bank_q_topic ON public.bank_questions (topic_id);

CREATE INDEX idx_bank_q_subtopic ON public.bank_questions (sub_topic_id);

CREATE INDEX idx_bank_q_type            ON public.bank_questions(type);

CREATE INDEX idx_bank_q_difficulty ON public.bank_questions (difficulty);

CREATE INDEX idx_bank_q_verified ON public.bank_questions (is_verified);

CREATE INDEX idx_bank_q_tags ON public.bank_questions USING gin (tags);

CREATE INDEX idx_bank_q_year ON public.bank_questions (year);

-- Full-text search on question text
CREATE INDEX idx_bank_q_text_search ON public.bank_questions USING gin (
    to_tsvector('english', question_text)
);

CREATE INDEX idx_bank_opts_question ON public.bank_question_options (question_id);

CREATE INDEX idx_bank_import_subject ON public.bank_import_jobs (subject_id);

CREATE INDEX idx_quiz_bank_links_quiz ON public.quiz_bank_links (quiz_id);

CREATE INDEX idx_quiz_bank_links_bank ON public.quiz_bank_links (bank_question_id);

-- ── Triggers ─────────────────────────────────────────────────────

CREATE TRIGGER trg_bank_questions_updated_at
  BEFORE UPDATE ON public.bank_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-update bank_question_stats.correct_rate when quiz_answers submitted
CREATE OR REPLACE FUNCTION public.update_bank_question_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_bank_question_id UUID;
BEGIN
  -- Find the bank question linked to this quiz question (if any)
  SELECT bank_question_id INTO v_bank_question_id
  FROM public.quiz_bank_links
  WHERE quiz_question_id = NEW.question_id
  LIMIT 1;

  IF v_bank_question_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert stats
  INSERT INTO public.bank_question_stats (
    question_id, total_attempts, correct_count, incorrect_count, last_used_at
  )
  VALUES (
    v_bank_question_id, 1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (question_id) DO UPDATE SET
    total_attempts  = bank_question_stats.total_attempts + 1,
    correct_count   = bank_question_stats.correct_count + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    incorrect_count = bank_question_stats.incorrect_count + CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END,
    last_used_at    = NOW(),
    updated_at      = NOW();

  -- Sync correct_rate back to bank_questions
  UPDATE public.bank_questions bq
  SET correct_rate = (
    SELECT correct_rate FROM public.bank_question_stats WHERE question_id = v_bank_question_id
  )
  WHERE bq.id = v_bank_question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bank_stats
  AFTER INSERT OR UPDATE ON public.quiz_answers
  FOR EACH ROW
  WHEN (NEW.is_correct IS NOT NULL)
  EXECUTE FUNCTION public.update_bank_question_stats();

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sub_topics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_questions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_question_options ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_import_jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_import_question_map ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_question_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quiz_bank_links ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "admin_all_topics" ON public.topics FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_subtopics" ON public.sub_topics FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_questions" ON public.bank_questions FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_options" ON public.bank_question_options FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_imports" ON public.bank_import_jobs FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_import_map" ON public.bank_import_question_map FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_stats" ON public.bank_question_stats FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_bank_links" ON public.quiz_bank_links FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

-- Enrolled students can read verified active bank questions for their program
CREATE POLICY "student_read_bank_questions" ON public.bank_questions FOR
SELECT TO authenticated USING (
        is_active = TRUE
        AND is_verified = TRUE
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
                JOIN public.courses c ON c.id = e.course_id
            WHERE
                e.user_id = auth.uid ()
                AND e.status = 'active'
                AND c.subject_id = bank_questions.subject_id
        )
    );

-- Topics/sub-topics are public (needed for navigation)
CREATE POLICY "public_read_topics" ON public.topics FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

CREATE POLICY "public_read_subtopics" ON public.sub_topics FOR
SELECT TO anon, authenticated USING (is_active = TRUE);

-- Realtime for admin
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_questions;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.bank_import_jobs;

ALTER PUBLICATION supabase_realtime ADD TABLE public.topics;

-- ============================================================
--  Seed: programs + program_levels
--  Evoke EduGlobal — ACCA / CFA / CMA
--  UUIDs: auto-generated by gen_random_uuid()
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- §1  PROGRAMS
-- ────────────────────────────────────────────────────────────

INSERT INTO
    public.programs (
        body,
        full_name,
        country,
        description,
        is_active
    )
VALUES (
        'ACCA',
        'Association of Chartered Certified Accountants',
        'United Kingdom',
        'Global professional accounting qualification with 13 exams across 3 levels.',
        TRUE
    ),
    (
        'CFA',
        'Chartered Financial Analyst',
        'United States of America',
        'Investment management designation with 3 progressive exam levels.',
        TRUE
    ),
    (
        'CMA',
        'Certified Management Accountant',
        'United States of America',
        'Financial management & strategy qualification with 2-part exam.',
        TRUE
    )
ON CONFLICT (body) DO
UPDATE
SET
    full_name = EXCLUDED.full_name,
    country = EXCLUDED.country,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- ────────────────────────────────────────────────────────────
-- §2  PROGRAM LEVELS
--     Uses subquery to resolve program_id by body name
--     so no UUIDs needed anywhere
-- ────────────────────────────────────────────────────────────

INSERT INTO
    public.program_levels (
        program_id,
        label,
        sequence_no
    )
VALUES
    -- ACCA
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Applied Knowledge',
        1
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Applied Skills',
        2
    ),
    (
        (
            SELECT id
            FROM public.programs
            WHERE
                body = 'ACCA'
        ),
        'Strategic Professional',
        3
    ),

-- CFA
(
    (
        SELECT id
        FROM public.programs
        WHERE
            body = 'CFA'
    ),
    'Level I',
    1
),
(
    (
        SELECT id
        FROM public.programs
        WHERE
            body = 'CFA'
    ),
    'Level II',
    2
),
(
    (
        SELECT id
        FROM public.programs
        WHERE
            body = 'CFA'
    ),
    'Level III',
    3
),

-- CMA
(
    (
        SELECT id
        FROM public.programs
        WHERE
            body = 'CMA'
    ),
    'Part 1',
    1
),
(
    (
        SELECT id
        FROM public.programs
        WHERE
            body = 'CMA'
    ),
    'Part 2',
    2
)
ON CONFLICT (program_id, label) DO
UPDATE
SET
    sequence_no = EXCLUDED.sequence_no;

-- ============================================================
--  Seed: subjects
--  Evoke EduGlobal — ACCA / CFA / CMA
--  All official papers/subjects per program level
--  UUIDs: auto-generated | program_level_id resolved by subquery
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ACCA — Applied Knowledge (Level 1)  →  3 papers
-- ────────────────────────────────────────────────────────────

INSERT INTO
    public.subjects (
        program_level_id,
        code,
        name,
        description,
        sequence_no,
        is_active
    )
VALUES (
        (
            SELECT pl.id
            FROM public.program_levels pl
                JOIN public.programs p ON p.id = pl.program_id
            WHERE
                p.body = 'ACCA'
                AND pl.label = 'Applied Knowledge'
        ),
        'BT',
        'Business and Technology',
        'Covers the business environment, organisational structure, governance, and the role of the accountant in business.',
        1,
        TRUE
    ),
    (
        (
            SELECT pl.id
            FROM public.program_levels pl
                JOIN public.programs p ON p.id = pl.program_id
            WHERE
                p.body = 'ACCA'
                AND pl.label = 'Applied Knowledge'
        ),
        'MA',
        'Management Accounting',
        'Introduces costing, budgeting, and management accounting techniques used for internal decision-making.',
        2,
        TRUE
    ),
    (
        (
            SELECT pl.id
            FROM public.program_levels pl
                JOIN public.programs p ON p.id = pl.program_id
            WHERE
                p.body = 'ACCA'
                AND pl.label = 'Applied Knowledge'
        ),
        'FA',
        'Financial Accounting',
        'Covers the fundamentals of double-entry bookkeeping, preparation of financial statements for sole traders and companies.',
        3,
        TRUE
    ),

-- ────────────────────────────────────────────────────────────
-- ACCA — Applied Skills (Level 2)  →  6 papers
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'LW',
    'Corporate and Business Law',
    'Covers the global legal framework, contract law, company law, and employment law relevant to accountants.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'PM',
    'Performance Management',
    'Advanced management accounting: performance measurement, decision-making, budgeting, and control systems.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'TX',
    'Taxation',
    'Covers UK taxation including income tax, corporation tax, VAT, capital gains tax, and inheritance tax.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'FR',
    'Financial Reporting',
    'Preparation and interpretation of financial statements under IFRS for single entities and groups.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'AA',
    'Audit and Assurance',
    'Principles of external auditing, audit procedures, evidence, internal controls, and audit reporting.',
    5,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Applied Skills'
    ),
    'FM',
    'Financial Management',
    'Financial management decisions: investment appraisal, financing, working capital, and risk management.',
    6,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- ACCA — Strategic Professional (Level 3)  →  4 papers
--   Essentials (2 compulsory) + Options (2 from 4)
--   All 6 listed; Options marked in description
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'SBL',
    'Strategic Business Leader',
    '[Compulsory] Integrated case-study paper covering strategy, leadership, governance, risk, technology, and professional skills.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'SBR',
    'Strategic Business Reporting',
    '[Compulsory] Advanced financial reporting under IFRS, group accounting, and current developments in reporting.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'AFM',
    'Advanced Financial Management',
    '[Optional] Advanced corporate finance: M&A, treasury, risk management, and international finance.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'APM',
    'Advanced Performance Management',
    '[Optional] Strategic performance measurement, advanced budgeting, and organisational performance frameworks.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'ATX',
    'Advanced Taxation',
    '[Optional] Complex UK tax planning, inheritance tax, trusts, overseas aspects, and tax in business decisions.',
    5,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'ACCA'
            AND pl.label = 'Strategic Professional'
    ),
    'AAA',
    'Advanced Audit and Assurance',
    '[Optional] Complex audit engagements, quality management, forensic audit, and professional & ethical issues.',
    6,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- CFA — Level I  →  10 topic areas
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'EPS-L1',
    'Ethical and Professional Standards',
    'CFA Institute Code of Ethics, Standards of Professional Conduct, and Global Investment Performance Standards (GIPS).',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'QM-L1',
    'Quantitative Methods',
    'Time value of money, statistics, probability, sampling, hypothesis testing, and regression analysis.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'ECO-L1',
    'Economics',
    'Microeconomics, macroeconomics, monetary and fiscal policy, international trade, and currency exchange rates.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'FRA-L1',
    'Financial Statement Analysis',
    'Analysis of income statements, balance sheets, cash flow statements, and financial ratios.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'CF-L1',
    'Corporate Issuers',
    'Corporate governance, capital structure, leverage, dividends, and working capital management.',
    5,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'EQ-L1',
    'Equity Investments',
    'Market organisation, security valuation, industry analysis, and equity valuation models.',
    6,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'FI-L1',
    'Fixed Income',
    'Bond features, pricing, yield measures, duration, convexity, and credit analysis.',
    7,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'DER-L1',
    'Derivatives',
    'Forwards, futures, options, swaps — pricing, valuation, and hedging strategies.',
    8,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'AI-L1',
    'Alternative Investments',
    'Hedge funds, private equity, real estate, commodities, infrastructure, and other alternatives.',
    9,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level I'
    ),
    'PM-L1',
    'Portfolio Management',
    'Portfolio theory, CAPM, risk and return, behavioural finance, and investment policy statements.',
    10,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- CFA — Level II  →  10 topic areas (application & analysis)
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'EPS-L2',
    'Ethical and Professional Standards',
    'Application of the Code and Standards with emphasis on analysis and investment research scenarios.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'QM-L2',
    'Quantitative Methods',
    'Multiple regression, time-series analysis, machine learning basics, and big data concepts.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'ECO-L2',
    'Economics',
    'Currency exchange rate forecasting, economic growth theories, and regulation.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'FRA-L2',
    'Financial Statement Analysis',
    'Intercorporate investments, employee benefits, multinational operations, and quality of earnings.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'CF-L2',
    'Corporate Issuers',
    'Capital budgeting, capital structure, M&A, corporate restructuring, and ESG considerations.',
    5,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'EQ-L2',
    'Equity Investments',
    'DCF, DDM, residual income, and market-based valuation; industry and competitive analysis.',
    6,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'FI-L2',
    'Fixed Income',
    'Term structure of interest rates, credit analysis models, MBS, ABS, and structured products.',
    7,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'DER-L2',
    'Derivatives',
    'Option valuation (BSM, binomial), swaps pricing, credit derivatives, and interest rate models.',
    8,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'AI-L2',
    'Alternative Investments',
    'Real estate valuation, private equity/VC, hedge fund strategies, and commodities pricing.',
    9,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level II'
    ),
    'PM-L2',
    'Portfolio Management',
    'Multi-factor models, active vs passive strategies, algorithmic trading, and risk management.',
    10,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- CFA — Level III  →  7 topic areas (synthesis & portfolio)
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'EPS-L3',
    'Ethical and Professional Standards',
    'Synthesis of the Code and Standards in portfolio management and institutional/individual client contexts.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'PM-IND',
    'Portfolio Management — Individual Investors',
    'IPS for individuals, life cycle investing, tax efficiency, and estate planning in portfolio context.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'PM-INST',
    'Portfolio Management — Institutional Investors',
    'IPS for pension funds, endowments, foundations, insurance companies, banks, and sovereign wealth funds.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'AA-L3',
    'Asset Allocation and Related Decisions',
    'Strategic and tactical asset allocation, liability-relative and goals-based approaches, and rebalancing.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'FI-L3',
    'Fixed Income Portfolio Management',
    'Liability-driven investing, yield curve strategies, credit strategies, and global multi-sector portfolios.',
    5,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'EQ-L3',
    'Equity Portfolio Management',
    'Passive, active, and factor strategies; equity portfolio construction, monitoring, and evaluation.',
    6,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CFA'
            AND pl.label = 'Level III'
    ),
    'RISK-L3',
    'Risk Management and Derivatives in Portfolio',
    'Enterprise risk management, derivatives overlay strategies, currency risk, and tail risk management.',
    7,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- CMA — Part 1  →  5 topic areas
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 1'
    ),
    'ECA',
    'External Financial Reporting Decisions',
    'Financial statements, revenue recognition, leases, income taxes, and fair value under US GAAP and IFRS.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 1'
    ),
    'PBA',
    'Planning, Budgeting, and Forecasting',
    'Strategic planning, budgeting methods, forecasting techniques, and annual profit plans.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 1'
    ),
    'PVA',
    'Performance Management',
    'Cost and variance analysis, responsibility accounting, balanced scorecard, and transfer pricing.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 1'
    ),
    'CMA',
    'Cost Management',
    'Costing systems (job, process, ABC), overhead allocation, lean manufacturing, and supply chain.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 1'
    ),
    'ICA',
    'Internal Controls and Technology',
    'Internal control frameworks (COSO), data governance, cybersecurity, and system controls.',
    5,
    TRUE
),

-- ────────────────────────────────────────────────────────────
-- CMA — Part 2  →  5 topic areas
-- ────────────────────────────────────────────────────────────

(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 2'
    ),
    'FA',
    'Financial Statement Analysis',
    'Ratio analysis, earnings quality, off-balance-sheet items, and pro-forma financials.',
    1,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 2'
    ),
    'CFA2',
    'Corporate Finance',
    'Capital structure, leverage, dividend policy, working capital management, and mergers & acquisitions.',
    2,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 2'
    ),
    'DMA',
    'Decision Analysis',
    'Cost-volume-profit analysis, marginal analysis, make-or-buy, pricing decisions, and linear programming.',
    3,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 2'
    ),
    'RMA',
    'Risk Management',
    'Enterprise risk management, financial risk (market, credit, liquidity), and hedging with derivatives.',
    4,
    TRUE
),
(
    (
        SELECT pl.id
        FROM public.program_levels pl
            JOIN public.programs p ON p.id = pl.program_id
        WHERE
            p.body = 'CMA'
            AND pl.label = 'Part 2'
    ),
    'IMA',
    'Investment Decisions',
    'Capital budgeting methods (NPV, IRR, payback), risk-adjusted returns, and real options.',
    5,
    TRUE
)
ON CONFLICT (program_level_id, code) DO
UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sequence_no = EXCLUDED.sequence_no,
    is_active = EXCLUDED.is_active;

-- ============================================================
--  END — Total subjects seeded:
--  ACCA  →  3 (L1) + 6 (L2) + 6 (L3)  = 15
--  CFA   →  10 (L1) + 10 (L2) + 7 (L3) = 27
--  CMA   →  5 (P1)  + 5 (P2)            = 10
--  Grand Total: 52 subjects
-- ============================================================

-- ============================================================
--  EVOKE EDUGLOBAL — Schema Fix & Normalization Patch
--  Version:    2.1.0  (applies on top of v2.0.0)
--  Focus:      Remove all hardcoded / stale denormalised columns;
--              replace with GENERATED columns + live triggers.
-- ============================================================
--
--  PROBLEMS FIXED
--  ──────────────
--  F1  quiz.total_marks         — hardcoded INT; must equal SUM(questions.marks)
--  F2  quiz_attempts.total_marks — copied at insert time, stales when marks change
--  F3  quiz_attempts.passed     — nullable BOOLEAN; must be GENERATED from score
--  F4  courses.total_students   — manual counter; must be driven by enrollments
--  F5  courses.avg_rating       — manual counter; must be driven by reviews
--  F6  bank_questions.usage_count — manual counter; must be driven by quiz_bank_links
--  F7  bank_questions.correct_rate — duplicated with bank_question_stats.correct_rate
--  F8  question_options — no constraint: MCQ must have exactly 1 correct option;
--      true_false must have exactly 2 options
--  F9  instalment_schedule — no auto-generation when EMI plan selected
--  F10 Missing updated_at triggers on several tables
-- ============================================================

-- ============================================================
-- F1 + F2  quiz.total_marks & quiz_attempts.total_marks
--          Both must be COMPUTED, never written by application.
-- ============================================================

-- Step 1: drop the old plain columns
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS total_marks;

ALTER TABLE public.quiz_attempts DROP COLUMN IF EXISTS total_marks;

-- Step 2: add computed column on quizzes (sum of all question marks)
--   NOTE: PostgreSQL does not allow GENERATED cols referencing other tables.
--   We keep total_marks as a cached column maintained by trigger instead.

ALTER TABLE public.quizzes
ADD COLUMN total_marks NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.quiz_attempts
ADD COLUMN total_marks NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Trigger: recalculate quiz.total_marks when questions are inserted/updated/deleted
CREATE OR REPLACE FUNCTION public.sync_quiz_total_marks()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_id UUID;
BEGIN
  v_quiz_id := COALESCE(OLD.quiz_id, NEW.quiz_id);

  UPDATE public.quizzes
  SET total_marks = (
    SELECT COALESCE(SUM(marks), 0)
    FROM public.questions
    WHERE quiz_id = v_quiz_id
  )
  WHERE id = v_quiz_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_sync_quiz_marks ON public.questions;

CREATE TRIGGER trg_questions_sync_quiz_marks
  AFTER INSERT OR UPDATE OF marks OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.sync_quiz_total_marks();

-- Trigger: when a quiz_attempt is STARTED, copy the current quiz.total_marks
--          and quiz.passing_marks into the attempt row (snapshot at attempt time).
CREATE OR REPLACE FUNCTION public.snapshot_attempt_marks()
RETURNS TRIGGER AS $$
BEGIN
  SELECT total_marks, passing_marks
  INTO NEW.total_marks, NEW.passing_marks_snapshot
  FROM public.quizzes
  WHERE id = NEW.quiz_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add snapshot column for passing marks (avoids re-computing "did student pass" if
-- instructor later changes passing_marks on the quiz).
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS passing_marks_snapshot NUMERIC(8, 2) NOT NULL DEFAULT 0;

DROP TRIGGER IF EXISTS trg_attempt_snapshot_marks ON public.quiz_attempts;

CREATE TRIGGER trg_attempt_snapshot_marks
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_attempt_marks();

-- ============================================================
-- F3  quiz_attempts.passed  — GENERATED via trigger
--     Cannot use SQL GENERATED ALWAYS because it references
--     another column that changes (score), so we use a trigger.
-- ============================================================

-- The column already exists as nullable BOOLEAN.
-- We make it NOT NULL DEFAULT FALSE and maintain it via trigger.
ALTER TABLE public.quiz_attempts
ALTER COLUMN passed
SET DEFAULT FALSE,
ALTER COLUMN passed
SET NOT NULL;

CREATE OR REPLACE FUNCTION public.compute_attempt_passed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only compute on submit
  IF NEW.status = 'submitted' OR NEW.status = 'timed_out' THEN
    NEW.passed := (NEW.score >= NEW.passing_marks_snapshot);
    IF NEW.submitted_at IS NULL THEN
      NEW.submitted_at := NOW();
    END IF;
  ELSE
    NEW.passed := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attempt_compute_passed ON public.quiz_attempts;

CREATE TRIGGER trg_attempt_compute_passed
  BEFORE INSERT OR UPDATE OF score, status ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.compute_attempt_passed();

-- ============================================================
-- F4  courses.total_students  — drive from enrollments
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_course_student_count()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  v_course_id := COALESCE(NEW.course_id, OLD.course_id);

  UPDATE public.courses
  SET total_students = (
    SELECT COUNT(*)
    FROM public.enrollments
    WHERE course_id = v_course_id
      AND status = 'active'
  )
  WHERE id = v_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrollments_student_count ON public.enrollments;

CREATE TRIGGER trg_enrollments_student_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.sync_course_student_count();

-- Backfill existing data
UPDATE public.courses c
SET
    total_students = (
        SELECT COUNT(*)
        FROM public.enrollments e
        WHERE
            e.course_id = c.id
            AND e.status = 'active'
    );

-- ============================================================
-- F5  courses.avg_rating  — drive from approved reviews
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_course_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  v_course_id := COALESCE(NEW.course_id, OLD.course_id);

  UPDATE public.courses
  SET avg_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
    FROM public.reviews
    WHERE course_id = v_course_id
      AND is_approved = TRUE
  )
  WHERE id = v_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_avg_rating ON public.reviews;

CREATE TRIGGER trg_reviews_avg_rating
  AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_course_avg_rating();

-- Backfill
UPDATE public.courses c
SET
    avg_rating = COALESCE(
        (
            SELECT ROUND(AVG(rating)::NUMERIC, 2)
            FROM public.reviews r
            WHERE
                r.course_id = c.id
                AND r.is_approved = TRUE
        ),
        0
    );

-- ============================================================
-- F6  bank_questions.usage_count  — drive from quiz_bank_links
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_bank_question_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_bank_q_id UUID;
BEGIN
  v_bank_q_id := COALESCE(NEW.bank_question_id, OLD.bank_question_id);

  UPDATE public.bank_questions
  SET usage_count = (
    SELECT COUNT(*)
    FROM public.quiz_bank_links
    WHERE bank_question_id = v_bank_q_id
  )
  WHERE id = v_bank_q_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bank_links_usage_count ON public.quiz_bank_links;

CREATE TRIGGER trg_bank_links_usage_count
  AFTER INSERT OR DELETE ON public.quiz_bank_links
  FOR EACH ROW EXECUTE FUNCTION public.sync_bank_question_usage();

-- Backfill
UPDATE public.bank_questions bq
SET
    usage_count = (
        SELECT COUNT(*)
        FROM public.quiz_bank_links l
        WHERE
            l.bank_question_id = bq.id
    );

-- ============================================================
-- F7  bank_questions.correct_rate — deduplicate with stats table
--     Single source of truth: bank_question_stats.correct_rate (GENERATED)
--     bank_questions.correct_rate is now a synced cache updated by trigger.
--     (already in v2.0.0's update_bank_question_stats trigger — just ensure
--      the trigger also fires on DELETE of quiz_answers)
-- ============================================================

-- The existing trigger only handles INSERT OR UPDATE.
-- Add DELETE handling so skips/abandoned answers don't leave stale stats.
DROP TRIGGER IF EXISTS trg_update_bank_stats ON public.quiz_answers;

CREATE OR REPLACE FUNCTION public.update_bank_question_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_bank_q_id  UUID;
  v_is_correct BOOLEAN;
  v_delta      INT;
BEGIN
  -- Resolve bank question from quiz question link
  SELECT bank_question_id INTO v_bank_q_id
  FROM public.quiz_bank_links
  WHERE quiz_question_id = COALESCE(NEW.question_id, OLD.question_id)
  LIMIT 1;

  IF v_bank_q_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'DELETE' THEN
    -- Roll back this answer from the stats
    IF OLD.is_correct IS NOT NULL THEN
      UPDATE public.bank_question_stats SET
        total_attempts  = GREATEST(total_attempts - 1, 0),
        correct_count   = GREATEST(correct_count   - CASE WHEN OLD.is_correct THEN 1 ELSE 0 END, 0),
        incorrect_count = GREATEST(incorrect_count - CASE WHEN NOT OLD.is_correct THEN 1 ELSE 0 END, 0),
        updated_at = NOW()
      WHERE question_id = v_bank_q_id;
    END IF;
  ELSE
    -- INSERT or UPDATE: upsert the stat row
    INSERT INTO public.bank_question_stats (
      question_id, total_attempts, correct_count, incorrect_count, last_used_at
    ) VALUES (
      v_bank_q_id, 1,
      CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      CASE WHEN NOT COALESCE(NEW.is_correct, FALSE) THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (question_id) DO UPDATE SET
      total_attempts  = bank_question_stats.total_attempts  + 1,
      correct_count   = bank_question_stats.correct_count   + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      incorrect_count = bank_question_stats.incorrect_count + CASE WHEN NOT COALESCE(NEW.is_correct, FALSE) THEN 1 ELSE 0 END,
      last_used_at    = NOW(),
      updated_at      = NOW();
  END IF;

  -- Sync correct_rate cache back to bank_questions
  UPDATE public.bank_questions bq
  SET correct_rate = (
    SELECT bqs.correct_rate
    FROM public.bank_question_stats bqs
    WHERE bqs.question_id = v_bank_q_id
  )
  WHERE bq.id = v_bank_q_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bank_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_answers
  FOR EACH ROW
  WHEN (
    (TG_OP = 'DELETE' AND OLD.is_correct IS NOT NULL) OR
    (TG_OP <> 'DELETE' AND NEW.is_correct IS NOT NULL)
  )
  EXECUTE FUNCTION public.update_bank_question_stats();

-- ============================================================
-- F8  question_options integrity constraints
--     MCQ   → exactly 1 correct option
--     true_false → exactly 2 options, exactly 1 correct
--     multiple_select → at least 1 correct option
--     assertion_reasoning → exactly 1 correct option
-- ============================================================

-- Deferred constraint check function (runs after a full set of options is saved)
CREATE OR REPLACE FUNCTION public.validate_question_options()
RETURNS TRIGGER AS $$
DECLARE
  v_type        question_type;
  v_opt_count   INT;
  v_correct_cnt INT;
BEGIN
  SELECT type INTO v_type FROM public.questions WHERE id = NEW.question_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct)
  INTO v_opt_count, v_correct_cnt
  FROM public.question_options
  WHERE question_id = NEW.question_id;

  CASE v_type
    WHEN 'mcq' THEN
      IF v_correct_cnt > 1 THEN
        RAISE EXCEPTION 'MCQ question % must have exactly 1 correct option (found %)',
          NEW.question_id, v_correct_cnt;
      END IF;

    WHEN 'true_false' THEN
      IF v_opt_count > 2 THEN
        RAISE EXCEPTION 'True/False question % must have exactly 2 options (found %)',
          NEW.question_id, v_opt_count;
      END IF;
      IF v_correct_cnt > 1 THEN
        RAISE EXCEPTION 'True/False question % must have exactly 1 correct option (found %)',
          NEW.question_id, v_correct_cnt;
      END IF;

    WHEN 'multiple_select' THEN
      -- At least 1 correct option required once options exist
      IF v_opt_count > 0 AND v_correct_cnt = 0 THEN
        RAISE EXCEPTION 'Multiple-select question % must have at least 1 correct option',
          NEW.question_id;
      END IF;

    WHEN 'assertion_reasoning' THEN
      IF v_correct_cnt > 1 THEN
        RAISE EXCEPTION 'Assertion-Reasoning question % must have exactly 1 correct option (found %)',
          NEW.question_id, v_correct_cnt;
      END IF;

    ELSE
      NULL; -- subjective, fill_blank, numerical have no options
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_question_options ON public.question_options;

CREATE CONSTRAINT TRIGGER trg_validate_question_options
  AFTER INSERT OR UPDATE ON public.question_options
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_options();

-- Same validation for bank_question_options
CREATE OR REPLACE FUNCTION public.validate_bank_question_options()
RETURNS TRIGGER AS $$
DECLARE
  v_type        question_type;
  v_opt_count   INT;
  v_correct_cnt INT;
BEGIN
  SELECT type INTO v_type FROM public.bank_questions WHERE id = NEW.question_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct)
  INTO v_opt_count, v_correct_cnt
  FROM public.bank_question_options
  WHERE question_id = NEW.question_id;

  CASE v_type
    WHEN 'mcq' THEN
      IF v_correct_cnt > 1 THEN
        RAISE EXCEPTION 'Bank MCQ % must have exactly 1 correct option (found %)',
          NEW.question_id, v_correct_cnt;
      END IF;
    WHEN 'true_false' THEN
      IF v_opt_count > 2 THEN
        RAISE EXCEPTION 'Bank True/False % must have exactly 2 options (found %)',
          NEW.question_id, v_opt_count;
      END IF;
    WHEN 'multiple_select' THEN
      IF v_opt_count > 0 AND v_correct_cnt = 0 THEN
        RAISE EXCEPTION 'Bank Multiple-select % must have at least 1 correct option',
          NEW.question_id;
      END IF;
    ELSE NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bank_options ON public.bank_question_options;

CREATE CONSTRAINT TRIGGER trg_validate_bank_options
  AFTER INSERT OR UPDATE ON public.bank_question_options
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.validate_bank_question_options();

-- ============================================================
-- F9  instalment_schedule auto-generation
--     When an enrollment with a plan_id is created, automatically
--     generate the instalment rows from the payment_plan definition.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_instalment_schedule()
RETURNS TRIGGER AS $$
DECLARE
  v_plan        public.payment_plans%ROWTYPE;
  v_instalment  INT;
  v_due_date    DATE;
BEGIN
  -- Only run if this enrollment uses a payment plan
  IF NEW.plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_plan FROM public.payment_plans WHERE id = NEW.plan_id;

  IF NOT FOUND THEN
    RAISE WARNING 'payment_plan % not found; skipping instalment generation', NEW.plan_id;
    RETURN NEW;
  END IF;

  -- Delete any previously generated schedule (e.g. on re-insert via upsert)
  DELETE FROM public.instalment_schedule WHERE enrollment_id = NEW.id;

  -- Generate one row per instalment
  FOR v_instalment IN 1..v_plan.total_instalments LOOP
    v_due_date := (NEW.enrolled_at::DATE) + ((v_instalment - 1) * v_plan.frequency_days);

    INSERT INTO public.instalment_schedule (
      enrollment_id, instalment_no, due_date, amount, status
    ) VALUES (
      NEW.id,
      v_instalment,
      v_due_date,
      v_plan.instalment_amount,
      'pending'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrollment_generate_instalments ON public.enrollments;

CREATE TRIGGER trg_enrollment_generate_instalments
  AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.generate_instalment_schedule();

-- Also mark instalment as paid when a matching payment is recorded
CREATE OR REPLACE FUNCTION public.mark_instalment_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.instalment_number IS NOT NULL THEN
    UPDATE public.instalment_schedule
    SET
      status     = 'paid',
      payment_id = NEW.id,
      paid_at    = NEW.updated_at
    WHERE enrollment_id    = NEW.enrollment_id
      AND instalment_no    = NEW.instalment_number
      AND status          != 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_mark_instalment ON public.payments;

CREATE TRIGGER trg_payment_mark_instalment
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.mark_instalment_paid();

-- Auto-mark overdue instalments (run daily via pg_cron or Supabase scheduled function)
-- This is a helper function; call it from your scheduler:
--   SELECT public.mark_overdue_instalments();
CREATE OR REPLACE FUNCTION public.mark_overdue_instalments()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.instalment_schedule
  SET status = 'overdue'
  WHERE status   = 'pending'
    AND due_date < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- F10  Missing updated_at triggers
-- ============================================================

-- student_profiles already has one (trg_student_profiles_updated_at)
-- Add for tables that were missing:

CREATE TRIGGER trg_course_pricing_updated_at
  BEFORE UPDATE ON public.course_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Note: course_pricing needs the column first
ALTER TABLE public.course_pricing
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER trg_lectures_updated_at
  BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- lectures already has created_at; add updated_at
ALTER TABLE public.lectures
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER trg_bank_import_jobs_updated_at
  BEFORE UPDATE ON public.bank_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bank_import_jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================
-- ADDITIONAL NORMALISATION — Quiz-Level Denorm Views
-- ============================================================
-- Instead of storing course_count, chapter_count etc in tables,
-- expose them as views the application can query.

CREATE OR REPLACE VIEW public.v_quiz_summary AS
SELECT
    q.id AS quiz_id,
    q.title,
    q.type,
    q.is_published,
    q.course_id,
    q.chapter_id,
    q.time_limit_sec,
    q.passing_marks,
    COUNT(qu.id) AS question_count,
    COALESCE(SUM(qu.marks), 0) AS total_marks, -- live
    COALESCE(SUM(qu.negative_marks), 0) AS total_negative_marks,
    COUNT(qa.id) AS attempt_count,
    COUNT(qa.id) FILTER (
        WHERE
            qa.status = 'submitted'
    ) AS submitted_count,
    ROUND(
        AVG(qa.score) FILTER (
            WHERE
                qa.status = 'submitted'
        ),
        2
    ) AS avg_score,
    ROUND(
        100.0 * COUNT(qa.id) FILTER (
            WHERE
                qa.passed = TRUE
                AND qa.status = 'submitted'
        ) / NULLIF(
            COUNT(qa.id) FILTER (
                WHERE
                    qa.status = 'submitted'
            ),
            0
        ),
        2
    ) AS pass_rate_pct
FROM public.quizzes q
    LEFT JOIN public.questions qu ON qu.quiz_id = q.id
    LEFT JOIN public.quiz_attempts qa ON qa.quiz_id = q.id
GROUP BY
    q.id;

COMMENT ON VIEW public.v_quiz_summary IS 'Live quiz stats — question_count, total_marks, attempt stats. Never stale.';

CREATE OR REPLACE VIEW public.v_course_summary AS
SELECT
    c.id AS course_id,
    c.title,
    c.status,
    c.instructor_id,
    COUNT(DISTINCT ch.id) AS chapter_count,
    COUNT(DISTINCT l.id) AS lecture_count,
    COALESCE(SUM(l.duration_sec), 0) AS total_duration_sec,
    COUNT(DISTINCT e.id) FILTER (
        WHERE
            e.status = 'active'
    ) AS active_enrollments,
    COALESCE(
        ROUND(
            AVG(r.rating) FILTER (
                WHERE
                    r.is_approved
            ),
            2
        ),
        0
    ) AS avg_rating,
    COUNT(r.id) FILTER (
        WHERE
            r.is_approved
    ) AS review_count
FROM
    public.courses c
    LEFT JOIN public.chapters ch ON ch.course_id = c.id
    LEFT JOIN public.lectures l ON l.chapter_id = ch.id
    LEFT JOIN public.enrollments e ON e.course_id = c.id
    LEFT JOIN public.reviews r ON r.course_id = c.id
GROUP BY
    c.id;

COMMENT ON VIEW public.v_course_summary IS 'Live course stats — chapter, lecture, enrollment, rating counts. Never stale.';

-- ============================================================
-- INDEXES for new/changed query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_instalments_due_status ON public.instalment_schedule (due_date, status)
WHERE
    status = 'pending';

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status ON public.quiz_attempts (status, quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON public.quiz_attempts (passed, quiz_id)
WHERE
    status = 'submitted';

CREATE INDEX IF NOT EXISTS idx_payments_instalment ON public.payments (
    enrollment_id,
    instalment_number
)
WHERE
    instalment_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_q_usage ON public.bank_questions (usage_count DESC)
WHERE
    is_active = TRUE
    AND is_verified = TRUE;

-- ============================================================
-- FULL BACKFILL  — run once after applying this patch
-- ============================================================

-- Recompute quiz total_marks from actual questions
UPDATE public.quizzes q
SET
    total_marks = (
        SELECT COALESCE(SUM(marks), 0)
        FROM public.questions
        WHERE
            quiz_id = q.id
    );

-- Recompute quiz_attempts snapshot columns
UPDATE public.quiz_attempts qa
SET
    total_marks = sub.total_marks,
    passing_marks_snapshot = sub.passing_marks
FROM (
        SELECT id, total_marks, passing_marks
        FROM public.quizzes
    ) sub
WHERE
    sub.id = qa.quiz_id
    AND qa.total_marks = 0;
-- only fix rows that were never snapshotted

-- Recompute passed flag
UPDATE public.quiz_attempts
SET
    passed = (
        score >= passing_marks_snapshot
    )
WHERE
    status IN ('submitted', 'timed_out');

-- Recompute bank usage counts
UPDATE public.bank_questions bq
SET
    usage_count = (
        SELECT COUNT(*)
        FROM public.quiz_bank_links l
        WHERE
            l.bank_question_id = bq.id
    );

-- ================================================================
-- EVOKE EDUGLOBAL — Live Stream Schema  v2.0
-- Extends the base live_streams table from LMS schema v3.1.0
-- ================================================================

-- ── New Enums ─────────────────────────────────────────────────────

-- Already exists: stream_status AS ENUM ('scheduled','live','ended','cancelled')
-- Add 'replay' for post-stream replay state
ALTER TYPE stream_status ADD VALUE IF NOT EXISTS 'replay';

CREATE TYPE stream_visibility AS ENUM (
  'public',    -- anyone can watch on YouTube
  'unlisted',  -- only enrolled students with the link
  'private'    -- only YouTube channel owner
);

CREATE TYPE stream_quality AS ENUM (
  '360p', '480p', '720p', '1080p', '1440p', '2160p'
);

CREATE TYPE chat_msg_type AS ENUM (
  'message',     -- regular chat message
  'question',    -- student question (pinnable)
  'announcement',-- instructor announcement
  'poll',        -- poll message
  'system'       -- system event (stream started, ended)
);

-- ── Extend live_streams with YouTube & scheduling details ─────────

ALTER TABLE public.live_streams
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS visibility stream_visibility NOT NULL DEFAULT 'unlisted',
ADD COLUMN IF NOT EXISTS yt_broadcast_id TEXT, -- YouTube liveBroadcast id
ADD COLUMN IF NOT EXISTS yt_stream_id TEXT, -- YouTube liveStream id (encoder)
ADD COLUMN IF NOT EXISTS yt_rtmp_url TEXT, -- RTMP ingest URL (shown to instructor)
ADD COLUMN IF NOT EXISTS yt_stream_key TEXT, -- Stream key (shown to instructor)
ADD COLUMN IF NOT EXISTS yt_live_chat_id TEXT, -- YouTube liveChatId for chat sync
ADD COLUMN IF NOT EXISTS yt_thumbnail_url TEXT, -- Auto-fetched thumbnail
ADD COLUMN IF NOT EXISTS max_quality stream_quality DEFAULT '1080p',
ADD COLUMN IF NOT EXISTS category_id SMALLINT DEFAULT 27, -- YouTube category: 27=Education
ADD COLUMN IF NOT EXISTS tags TEXT [],
ADD COLUMN IF NOT EXISTS enable_dvr BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_chat BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_embed BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS chat_moderation BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS concurrent_viewers INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_viewers INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chat_msgs INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_sec INT, -- computed at stream end
ADD COLUMN IF NOT EXISTS notes TEXT, -- internal notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger: updated_at on live_streams
CREATE TRIGGER trg_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Extend chat_messages ──────────────────────────────────────────

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS type chat_msg_type NOT NULL DEFAULT 'message',
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages (id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS yt_message_id TEXT, -- synced from YouTube Live Chat
ADD COLUMN IF NOT EXISTS author_name TEXT, -- for YouTube public chat authors
ADD COLUMN IF NOT EXISTS author_avatar TEXT, -- YouTube chat author avatar
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── Stream Registrations (enrolled students who RSVP'd) ──────────

CREATE TABLE IF NOT EXISTS public.stream_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    join_time TIMESTAMPTZ,
    leave_time TIMESTAMPTZ,
    watch_duration_sec INT NOT NULL DEFAULT 0,
    UNIQUE (live_stream_id, user_id)
);

COMMENT ON TABLE public.stream_registrations IS 'Students who registered / attended a live stream session.';

-- ── Stream Polls ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stream_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]', -- [{ "id": 1, "text": "...", "votes": 0 }]
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.stream_polls IS 'Live polls during a stream session.';

CREATE TABLE IF NOT EXISTS public.stream_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    poll_id UUID NOT NULL REFERENCES public.stream_polls (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    option_id SMALLINT NOT NULL,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (poll_id, user_id)
);

-- ── Stream Analytics (per-stream event log) ───────────────────────

CREATE TABLE IF NOT EXISTS public.stream_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    concurrent_viewers INT NOT NULL DEFAULT 0,
    chat_rate_per_min NUMERIC(8, 2) DEFAULT 0, -- messages per minute at snapshot
    yt_likes INT DEFAULT 0,
    yt_comments INT DEFAULT 0
);

COMMENT ON TABLE public.stream_analytics IS 'Time-series viewer & engagement snapshots during a live stream.';

-- ── Indexes ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_streams_status ON public.live_streams (status);

CREATE INDEX IF NOT EXISTS idx_streams_scheduled ON public.live_streams (scheduled_at);

CREATE INDEX IF NOT EXISTS idx_streams_course ON public.live_streams (course_id);

CREATE INDEX IF NOT EXISTS idx_chat_stream ON public.chat_messages (
    live_stream_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_chat_pinned ON public.chat_messages (live_stream_id, is_pinned)
WHERE
    is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS idx_chat_questions        ON public.chat_messages(live_stream_id, type)
  WHERE type = 'question';

CREATE INDEX IF NOT EXISTS idx_registrations_stream ON public.stream_registrations (live_stream_id);

CREATE INDEX IF NOT EXISTS idx_analytics_stream ON public.stream_analytics (
    live_stream_id,
    snapshot_at DESC
);

CREATE INDEX IF NOT EXISTS idx_polls_stream ON public.stream_polls (live_stream_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.stream_poll_votes (poll_id);

-- ── Triggers ──────────────────────────────────────────────────────

-- Auto-compute duration_sec when stream ends
CREATE OR REPLACE FUNCTION public.compute_stream_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ended', 'cancelled') AND NEW.started_at IS NOT NULL THEN
    NEW.ended_at   := COALESCE(NEW.ended_at, NOW());
    NEW.duration_sec := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stream_compute_duration ON public.live_streams;

CREATE TRIGGER trg_stream_compute_duration
  BEFORE UPDATE OF status ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.compute_stream_duration();

-- Auto-increment total_chat_msgs counter on new message
CREATE OR REPLACE FUNCTION public.increment_stream_chat_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.live_streams
  SET total_chat_msgs = total_chat_msgs + 1
  WHERE id = NEW.live_stream_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_msg_count ON public.chat_messages;

CREATE TRIGGER trg_chat_msg_count
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.increment_stream_chat_count();

-- Auto-update peak_viewers
CREATE OR REPLACE FUNCTION public.update_peak_viewers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.concurrent_viewers > NEW.peak_viewers THEN
    NEW.peak_viewers := NEW.concurrent_viewers;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stream_peak_viewers ON public.live_streams;

CREATE TRIGGER trg_stream_peak_viewers
  BEFORE UPDATE OF concurrent_viewers ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_peak_viewers();

-- ── RLS ───────────────────────────────────────────────────────────

-- live_streams: already has policies from LMS v3.1.0
-- Add missing policies for new tables:

ALTER TABLE public.stream_registrations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stream_polls ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stream_poll_votes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "admin_all_registrations" ON public.stream_registrations FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_polls" ON public.stream_polls FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_poll_votes" ON public.stream_poll_votes FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

CREATE POLICY "admin_all_analytics" ON public.stream_analytics FOR ALL TO authenticated USING (public.is_admin ())
WITH
    CHECK (public.is_admin ());

-- Students: read registrations for their own streams
CREATE POLICY "user_own_registrations" ON public.stream_registrations FOR
SELECT TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "user_register_stream" ON public.stream_registrations FOR INSERT TO authenticated
WITH
    CHECK (
        user_id = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.enrollments e
                JOIN public.live_streams ls ON ls.course_id = e.course_id
            WHERE
                ls.id = stream_registrations.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- Students: read active polls for enrolled streams
CREATE POLICY "enrolled_read_polls" ON public.stream_polls FOR
SELECT TO authenticated USING (
        is_active = TRUE
        AND EXISTS (
            SELECT 1
            FROM public.live_streams ls
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                ls.id = stream_polls.live_stream_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
        )
    );

-- Students: vote on polls
CREATE POLICY "enrolled_insert_poll_votes" ON public.stream_poll_votes FOR INSERT TO authenticated
WITH
    CHECK (
        user_id = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.stream_polls sp
                JOIN public.live_streams ls ON ls.id = sp.live_stream_id
                JOIN public.enrollments e ON e.course_id = ls.course_id
            WHERE
                sp.id = stream_poll_votes.poll_id
                AND e.user_id = auth.uid ()
                AND e.status = 'active'
                AND sp.is_active = TRUE
        )
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_polls;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.stream_analytics;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.stream_registrations;

-- ============================================================
-- §YOUTUBE PLAYLIST SYNC  (Chapters ↔ YouTube Playlists)
--     Each chapter links to one YouTube playlist.
--     Lectures are auto-synced from playlist items (idempotent).
-- ============================================================

ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS youtube_playlist_id TEXT,
ADD COLUMN IF NOT EXISTS yt_sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS yt_sync_title_desc BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS yt_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS yt_sync_error TEXT;

COMMENT ON COLUMN public.chapters.youtube_playlist_id IS 'YouTube playlist ID (PLxxx). Lectures sync from this playlist.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_youtube_playlist_id
ON public.chapters (youtube_playlist_id)
WHERE youtube_playlist_id IS NOT NULL;

ALTER TABLE public.lectures
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS yt_playlist_item_id TEXT,
ADD COLUMN IF NOT EXISTS yt_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.lectures.thumbnail_url IS 'YouTube video thumbnail URL (synced).';
COMMENT ON COLUMN public.lectures.published_at IS 'YouTube video published date (synced).';
COMMENT ON COLUMN public.lectures.yt_playlist_item_id IS 'YouTube playlistItems resource ID for dedup.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_lectures_chapter_yt_video
ON public.lectures (chapter_id, yt_video_id)
WHERE yt_video_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_yt_sync
ON public.chapters (yt_sync_enabled, youtube_playlist_id)
WHERE youtube_playlist_id IS NOT NULL AND yt_sync_enabled = TRUE;

CREATE TABLE IF NOT EXISTS public.youtube_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES public.chapters (id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
    trigger_source TEXT NOT NULL DEFAULT 'manual'
        CHECK (trigger_source IN ('manual', 'cron', 'webhook')),
    status TEXT NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'success', 'partial', 'failed')),
    playlist_id TEXT,
    videos_found INT NOT NULL DEFAULT 0,
    lectures_created INT NOT NULL DEFAULT 0,
    lectures_updated INT NOT NULL DEFAULT 0,
    error_message TEXT,
    details JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

COMMENT ON TABLE public.youtube_sync_logs IS 'Audit log for YouTube playlist → lecture sync runs.';

CREATE INDEX IF NOT EXISTS idx_youtube_sync_logs_chapter
ON public.youtube_sync_logs (chapter_id, started_at DESC);

ALTER TABLE public.youtube_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_youtube_sync_logs" ON public.youtube_sync_logs
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
--  END OF SCHEMA
--  Evoke EduGlobal v2.0.0 — Production Ready
-- ============================================================
SELECT
  e.id as enrollment_id,
  e.status as enrollment_status,
  e.enrolled_at,
  e.expires_at,
  c.id as course_id,
  c.title,
  c.slug,
  c.thumbnail_url,
  c.preview_video_url,
  c.language,
  c.avg_rating,
  c.total_students,
  s.name as subject_name,
  s.code as subject_code,
  pl.label as level_label,
  p.body as program_body,
  COUNT(DISTINCT l.id) FILTER (WHERE lp.is_completed = TRUE) as completed_lectures,
  COUNT(DISTINCT l.id) FILTER (WHERE l.is_published = TRUE) as total_lectures,
  COALESCE(SUM(lp.watched_seconds), 0) as total_watched_seconds,
  MAX(lp.last_watched_at) as last_activity
FROM enrollments e
JOIN courses c ON c.id = e.course_id
JOIN subjects s ON s.id = c.subject_id
JOIN program_levels pl ON pl.id = s.program_level_id
JOIN programs p ON p.id = pl.program_id
LEFT JOIN chapters ch ON ch.course_id = c.id AND ch.is_published = TRUE
LEFT JOIN lectures l ON l.chapter_id = ch.id AND l.is_published = TRUE
LEFT JOIN lecture_progress lp ON lp.lecture_id = l.id AND lp.user_id = auth.uid()
WHERE e.user_id = auth.uid()
  AND e.status = 'active'
GROUP BY e.id, c.id, s.id, pl.id, p.id
ORDER BY last_activity DESC NULLS LAST;


SELECT
  lp.resume_at_seconds,
  lp.watched_seconds,
  lp.last_watched_at,
  l.id as lecture_id,
  l.title as lecture_title,
  l.duration_sec,
  l.yt_video_id,
  ch.title as chapter_title,
  ch.course_id,
  c.title as course_title,
  c.slug as course_slug,
  c.thumbnail_url
FROM lecture_progress lp
JOIN lectures l ON l.id = lp.lecture_id
JOIN chapters ch ON ch.id = l.chapter_id
JOIN courses c ON c.id = ch.course_id
JOIN enrollments e ON e.course_id = c.id
  AND e.user_id = auth.uid()
  AND e.status = 'active'
WHERE lp.user_id = auth.uid()
  AND lp.is_completed = FALSE
ORDER BY lp.last_watched_at DESC NULLS LAST
LIMIT 3;


SELECT
  wh.watch_date,
  wh.course_id,
  c.title as course_title,
  SUM(wh.seconds) as total_seconds,
  ROUND(SUM(wh.seconds)::numeric / 3600, 2) as hours
FROM watch_hours_daily wh
JOIN courses c ON c.id = wh.course_id
WHERE wh.user_id = auth.uid()
  AND wh.watch_date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY wh.watch_date, wh.course_id, c.title
ORDER BY wh.watch_date ASC;


SELECT
  qa.id as attempt_id,
  qa.score,
  qa.total_marks,
  qa.percentage,
  qa.passed,
  qa.status,
  qa.started_at,
  qa.submitted_at,
  qa.attempt_number,
  q.title as quiz_title,
  q.type as quiz_type,
  q.passing_marks,
  c.title as course_title,
  c.id as course_id
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN courses c ON c.id = q.course_id
WHERE qa.user_id = auth.uid()
  AND qa.status = 'submitted'
ORDER BY qa.submitted_at DESC
LIMIT 10;


SELECT
  ls.id,
  ls.title,
  ls.description,
  ls.status,
  ls.scheduled_at,
  ls.started_at,
  ls.yt_video_id,
  ls.concurrent_viewers,
  c.title as course_title,
  c.id as course_id,
  u.name as instructor_name,
  u.avatar as instructor_avatar
FROM live_streams ls
JOIN courses c ON c.id = ls.course_id
JOIN users u ON u.id = ls.instructor_id
JOIN enrollments e ON e.course_id = c.id
  AND e.user_id = auth.uid()
  AND e.status = 'active'
WHERE ls.status IN ('scheduled', 'live')
  AND (ls.scheduled_at >= NOW() OR ls.status = 'live')
ORDER BY
  CASE WHEN ls.status = 'live' THEN 0 ELSE 1 END ASC,
  ls.scheduled_at ASC
LIMIT 5;




SELECT
  cert.id,
  cert.cert_number,
  cert.cert_url,
  cert.status,
  cert.issued_at,
  cert.completion_pct,
  c.title as course_title,
  c.id as course_id,
  s.name as subject_name,
  p.body as program_body
FROM certificates cert
JOIN courses c ON c.id = cert.course_id
JOIN subjects s ON s.id = c.subject_id
JOIN program_levels pl ON pl.id = s.program_level_id
JOIN programs p ON p.id = pl.program_id
WHERE cert.user_id = auth.uid()
  AND cert.status = 'issued'
ORDER BY cert.issued_at DESC;


SELECT
  u.name,
  u.avatar,
  u.email,
  sp.target_exam_body,
  sp.target_exam_level,
  sp.target_exam_date,
  sp.exam_attempt_number,
  sp.city,
  sp.country
FROM users u
LEFT JOIN student_profiles sp ON sp.user_id = u.id
WHERE u.id = auth.uid();




SELECT
  watch_date,
  SUM(seconds) as total_seconds
FROM watch_hours_daily
WHERE user_id = auth.uid()
  AND watch_date >= CURRENT_DATE - INTERVAL '364 days'
GROUP BY watch_date
ORDER BY watch_date ASC;