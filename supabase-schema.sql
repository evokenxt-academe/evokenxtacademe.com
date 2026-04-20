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
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT        NOT NULL UNIQUE,
  avatar      TEXT,
  phone       TEXT,
  role        user_role   NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.courses (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT         NOT NULL,
  slug                TEXT         NOT NULL UNIQUE,
  description         TEXT,
  level               course_level NOT NULL DEFAULT 'knowledge',
  thumbnail_url       TEXT,
  instructor_id       UUID         NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  price               NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price      NUMERIC(10,2),
  status              course_status NOT NULL DEFAULT 'draft',
  total_duration_sec  INT          NOT NULL DEFAULT 0, -- ⭐ ADDED: Crucial for your automated Youtube Duration UI!
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sections (
  id         UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID   NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title      TEXT   NOT NULL,
  position   INT    NOT NULL DEFAULT 0
);

CREATE TABLE public.lectures (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID    NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title         TEXT    NOT NULL,
  video_url     TEXT,
  description   TEXT,
  duration_sec  INT     NOT NULL DEFAULT 0,
  position      INT     NOT NULL DEFAULT 0,
  is_preview    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id  UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  file_url    TEXT NOT NULL
);

-- ============================================================
-- STEP 5 — User activity
-- ============================================================

CREATE TABLE public.enrollments (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID          NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status       enroll_status NOT NULL DEFAULT 'active',
  enrolled_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);

CREATE TABLE public.payments (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id           UUID           NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount              NUMERIC(10,2)  NOT NULL,
  currency            CHAR(3)        NOT NULL DEFAULT 'INR',
  status              payment_status NOT NULL DEFAULT 'pending',
  gateway             TEXT           NOT NULL DEFAULT 'razorpay',
  gateway_order_id    TEXT,
  gateway_payment_id  TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lecture_progress (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lecture_id       UUID    NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  watched_seconds  INT     NOT NULL DEFAULT 0,
  last_watched_at  TIMESTAMPTZ,
  UNIQUE (user_id, lecture_id)
);

CREATE TABLE public.reviews (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID   NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id   UUID   NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating      INT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- ============================================================
-- STEP 6 — Live streams
-- ============================================================

CREATE TABLE public.live_streams (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT          NOT NULL,
  course_id     UUID          NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  yt_video_id   TEXT,
  stream_key    TEXT,
  status        stream_status NOT NULL DEFAULT 'scheduled',
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ
);

CREATE TABLE public.chat_messages (
  id              UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id  UUID   NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id         UUID   NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message         TEXT   NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STEP 7 — Quizzes
-- ============================================================

CREATE TABLE public.quizzes (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID      NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  title           TEXT      NOT NULL,
  description     TEXT,
  type            quiz_type NOT NULL DEFAULT 'practice',
  total_marks     INT       NOT NULL DEFAULT 0,
  passing_marks   INT       NOT NULL DEFAULT 0,
  time_limit_sec  INT,
  is_published    BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.questions (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     UUID   NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question    TEXT   NOT NULL,
  source      TEXT,
  marks       INT    NOT NULL DEFAULT 1,
  position    INT    NOT NULL DEFAULT 0
);

CREATE TABLE public.options (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID    NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text         TEXT    NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.quiz_attempts (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID           NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id       UUID           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score         INT            NOT NULL DEFAULT 0,
  total_marks   INT            NOT NULL DEFAULT 0,
  status        attempt_status NOT NULL DEFAULT 'in_progress',
  started_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  submitted_at  TIMESTAMPTZ
);

CREATE TABLE public.quiz_answers (
  id                 UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id         UUID   NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id        UUID   NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID   REFERENCES public.options(id) ON DELETE SET NULL,
  UNIQUE (attempt_id, question_id)
);

-- ============================================================
-- STEP 8 — Indexes (Updated for UUID)
-- ============================================================
CREATE INDEX idx_courses_instructor   ON public.courses(instructor_id);
CREATE INDEX idx_sections_course      ON public.sections(course_id);
CREATE INDEX idx_lectures_section     ON public.lectures(section_id);
CREATE INDEX idx_enrollments_user     ON public.enrollments(user_id);
CREATE INDEX idx_payments_user        ON public.payments(user_id);
CREATE INDEX idx_progress_user        ON public.lecture_progress(user_id);
CREATE INDEX idx_chat_stream          ON public.chat_messages(live_stream_id);
CREATE INDEX idx_attempts_user        ON public.quiz_attempts(user_id);

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
INSERT INTO public.users (id, name, email, avatar, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.email,
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
  CASE WHEN au.email = 'amarbiradar147@gmail.com' THEN 'admin'::user_role ELSE 'student'::user_role END
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
