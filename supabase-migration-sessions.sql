-- Migration to support single-session limit
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_session_id TEXT;
