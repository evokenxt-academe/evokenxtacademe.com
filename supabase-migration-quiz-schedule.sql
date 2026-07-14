-- Migration: Add scheduling columns to quizzes table
-- Run this via psql or your Supabase Dashboard SQL Editor

ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS scheduled_starts_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS scheduled_ends_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.quizzes.scheduled_starts_at IS 'Timestamp when the quiz becomes active and open for attempts. NULL = open immediately.';
COMMENT ON COLUMN public.quizzes.scheduled_ends_at IS 'Timestamp when the quiz closes and no longer accepts attempts. NULL = no deadline.';
