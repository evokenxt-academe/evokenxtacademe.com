-- ============================================================
-- 🎓 Evoke EduGlobal - Professional LMS Database Schema
-- Optimized for UUIDs, automated duration stats, quizzes, and live streaming.
-- ============================================================

CREATE TYPE user_role      AS ENUM ('student', 'instructor', 'admin');

CREATE TYPE course_level   AS ENUM ('knowledge', 'skills', 'professional');

CREATE TYPE course_status  AS ENUM ('draft', 'published', 'archived');

CREATE TYPE enroll_status  AS ENUM ('active', 'expired', 'refunded');

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE stream_status  AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

CREATE TYPE quiz_type      AS ENUM ('practice', 'graded', 'final');

CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'timed_out');

-- ============================================================
-- STEP 4 — Core tables (UUID Primary Keys)
-- ============================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    level course_level NOT NULL DEFAULT 'knowledge',
    thumbnail_url TEXT,
    instructor_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_price NUMERIC(10, 2),
    status course_status NOT NULL DEFAULT 'draft',
    total_duration_sec INT NOT NULL DEFAULT 0, -- ⭐ ADDED: Crucial for your automated Youtube Duration UI!
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE TABLE public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    section_id UUID NOT NULL REFERENCES public.sections (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT,
    description TEXT,
    duration_sec INT NOT NULL DEFAULT 0,
    position INT NOT NULL DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    lecture_id UUID NOT NULL REFERENCES public.lectures (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL
);

-- ============================================================
-- STEP 5 — User activity
-- ============================================================

CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    status enroll_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (user_id, course_id)
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lecture_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures (id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    watched_seconds INT NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMPTZ,
    UNIQUE (user_id, lecture_id)
);

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

-- ============================================================
-- STEP 6 — Live streams
-- ============================================================

CREATE TABLE public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
    yt_video_id TEXT,
    stream_key TEXT,
    status stream_status NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    live_stream_id UUID NOT NULL REFERENCES public.live_streams (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STEP 7 — Quizzes
-- ============================================================

CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    section_id UUID NOT NULL REFERENCES public.sections (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type quiz_type NOT NULL DEFAULT 'practice',
    total_marks INT NOT NULL DEFAULT 0,
    passing_marks INT NOT NULL DEFAULT 0,
    time_limit_sec INT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    quiz_id UUID NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    source TEXT,
    marks INT NOT NULL DEFAULT 1,
    position INT NOT NULL DEFAULT 0
);

CREATE TABLE public.options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    question_id UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    quiz_id UUID NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    total_marks INT NOT NULL DEFAULT 0,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts (id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.options (id) ON DELETE SET NULL,
    UNIQUE (attempt_id, question_id)
);

-- ============================================================
-- STEP 8 — Indexes (Updated for UUID)
-- ============================================================
CREATE INDEX idx_courses_instructor ON public.courses (instructor_id);

CREATE INDEX idx_sections_course ON public.sections (course_id);

CREATE INDEX idx_lectures_section ON public.lectures (section_id);

CREATE INDEX idx_enrollments_user ON public.enrollments (user_id);

CREATE INDEX idx_payments_user ON public.payments (user_id);

CREATE INDEX idx_progress_user ON public.lecture_progress (user_id);

CREATE INDEX idx_chat_stream ON public.chat_messages (live_stream_id);

CREATE INDEX idx_attempts_user ON public.quiz_attempts (user_id);

-- ============================================================
-- STEP 8.5 — RLS Policies for Public Catalog
-- Allows anonymous users to read published courses and related data.
-- ============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published courses" ON public.courses;

CREATE POLICY "Public can read published courses" ON public.courses FOR
SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public can read instructor profiles" ON public.users;

CREATE POLICY "Public can read instructor profiles" ON public.users FOR
SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can read sections for published courses" ON public.sections;

CREATE POLICY "Public can read sections for published courses" ON public.sections FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.courses c
            WHERE
                c.id = public.sections.course_id
                AND c.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Public can read lectures for published courses" ON public.lectures;

CREATE POLICY "Public can read lectures for published courses" ON public.lectures FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.sections s
                JOIN public.courses c ON c.id = s.course_id
            WHERE
                s.id = public.lectures.section_id
                AND c.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Public can read reviews for published courses" ON public.reviews;

CREATE POLICY "Public can read reviews for published courses" ON public.reviews FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.courses c
            WHERE
                c.id = public.reviews.course_id
                AND c.status = 'published'
        )
    );

-- ============================================================
-- STEP 9 — Auth trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    CASE WHEN NEW.email = 'amarbiradar147@gmail.com' THEN 'admin'::user_role ELSE 'student'::user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 10 — Backfill
-- ============================================================
INSERT INTO
    public.users (id, name, email, avatar, role)
SELECT
    au.id,
    COALESCE(
        au.raw_user_meta_data ->> 'full_name',
        au.raw_user_meta_data ->> 'name',
        split_part(au.email, '@', 1)
    ),
    au.email,
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

- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 
 - -   Y o u T u b e   O A u t h   T o k e n s   t a b l e 
 
 - -   S t o r e s   G o o g l e / Y o u T u b e   r e f r e s h   t o k e n s   p e r s i s t e n t l y   p e r   u s e r 
 
 - -   T h i s   f i x e s   t h e   b u g   w h e r e   p r o v i d e r _ t o k e n   i s   l o s t   a f t e r   s e s s i o n   e x p i r y 
 
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 
 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . y o u t u b e _ t o k e n s   ( 
 
     u s e r _ i d               U U I D   P R I M A R Y   K E Y   R E F E R E N C E S   p u b l i c . u s e r s ( i d )   O N   D E L E T E   C A S C A D E , 
 
     r e f r e s h _ t o k e n   T E X T   N O T   N U L L , 
 
     a c c e s s _ t o k e n     T E X T ,                         - -   c a c h e d ;

   m a y   e x p i r e 
 
     e x p i r e s _ a t         T I M E S T A M P T Z ,           - -   w h e n   a c c e s s _ t o k e n   e x p i r e s 
 
     s c o p e s                 T E X T ,                         - -   g r a n t e d   s c o p e s 
 
     u p d a t e d _ a t         T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   N O W ( ) 
 
 ) ;

 
 
 
 
 - -   R L S :   o n l y   t h e   u s e r   t h e m s e l v e s   o r   s e r v i c e   r o l e   c a n   a c c e s s 
 
 A L T E R   T A B L E   p u b l i c . y o u t u b e _ t o k e n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;

 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   t h e i r   o w n   y o u t u b e   t o k e n s " 
 
     O N   p u b l i c . y o u t u b e _ t o k e n s   F O R   S E L E C T 
 
     U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;

 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   i n s e r t   t h e i r   o w n   y o u t u b e   t o k e n s " 
 
     O N   p u b l i c . y o u t u b e _ t o k e n s   F O R   I N S E R T 
 
     W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;

 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   u p d a t e   t h e i r   o w n   y o u t u b e   t o k e n s " 
 
     O N   p u b l i c . y o u t u b e _ t o k e n s   F O R   U P D A T E 
 
     U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;

 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   d e l e t e   t h e i r   o w n   y o u t u b e   t o k e n s " 
 
     O N   p u b l i c . y o u t u b e _ t o k e n s   F O R   D E L E T E 
 
     U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;

     

-- ======== QUESTION BANK MIGRATION ========

-- ============================================================
-- 🎓 Evoke EduGlobal — Question Bank & Quiz Builder Migration
-- Decouples questions from quizzes via a junction table.
-- Adds question_bank for reusable questions across courses.
-- ============================================================

-- Step 1: Create enums
CREATE TYPE question_type AS ENUM (
    'mcq',
    'multiple_select',
    'subjective',
    'fill_in_the_blanks',
    'true_or_false',
    'assertion_reasoning',
    'number'
);

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Step 2: Question Bank table — reusable questions
CREATE TABLE public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    type question_type NOT NULL DEFAULT 'mcq',
    explanation TEXT,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    marks INT NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Options for question bank questions
CREATE TABLE public.question_bank_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0
);

-- Step 4: Quiz-Questions junction table (many-to-many)
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    marks_override INT, -- NULL = use question_bank.marks
    UNIQUE(quiz_id, question_id)
);

-- Step 5: Indexes for performance
CREATE INDEX idx_question_bank_type ON public.question_bank(type);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX idx_question_bank_tags ON public.question_bank USING GIN(tags);
CREATE INDEX idx_question_bank_created_by ON public.question_bank(created_by);
CREATE INDEX idx_question_bank_options_question ON public.question_bank_options(question_id);
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_question ON public.quiz_questions(question_id);
CREATE INDEX idx_quiz_questions_position ON public.quiz_questions(quiz_id, position);

-- Step 6: Auto-update updated_at on question_bank
CREATE OR REPLACE FUNCTION update_question_bank_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_question_bank_updated_at
    BEFORE UPDATE ON public.question_bank
    FOR EACH ROW
    EXECUTE FUNCTION update_question_bank_updated_at();

-- Step 7: RLS Policies
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything on question_bank
CREATE POLICY "Admins can manage question_bank"
    ON public.question_bank FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "Admins can manage question_bank_options"
    ON public.question_bank_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "Admins can manage quiz_questions"
    ON public.quiz_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'instructor')
        )
    );

-- Students can read quiz_questions for their enrolled quizzes
CREATE POLICY "Students can read quiz_questions for published quizzes"
    ON public.quiz_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_id AND q.is_published = TRUE
        )
    );
