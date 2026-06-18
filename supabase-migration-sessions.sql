-- Migration to support single-session limit
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_session_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_last_seen_at TIMESTAMPTZ;
