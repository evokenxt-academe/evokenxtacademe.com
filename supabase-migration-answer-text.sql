-- ─────────────────────────────────────────────────────────────
-- Migration: Add answer_text column to questions table
-- Purpose: Store correct answers for non-MCQ question types
--          (fill_in_the_blanks, number, subjective)
-- ─────────────────────────────────────────────────────────────

-- Add the column (idempotent — safe to re-run)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS answer_text TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.questions.answer_text IS
  'Stores the correct answer for non-MCQ question types (fill, number, subjective). MCQ answers use options.is_correct instead.';
