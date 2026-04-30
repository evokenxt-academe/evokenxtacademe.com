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
