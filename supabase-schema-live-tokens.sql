-- ============================================================
-- YouTube OAuth Tokens table
-- Stores Google/YouTube refresh tokens persistently per user
-- This fixes the bug where provider_token is lost after session expiry
-- ============================================================

CREATE TABLE IF NOT EXISTS public.youtube_tokens (
  user_id       UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token  TEXT,            -- cached; may expire
  expires_at    TIMESTAMPTZ,     -- when access_token expires
  scopes        TEXT,            -- granted scopes
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: only the user themselves or service role can access
ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own youtube tokens"
  ON public.youtube_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own youtube tokens"
  ON public.youtube_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own youtube tokens"
  ON public.youtube_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own youtube tokens"
  ON public.youtube_tokens FOR DELETE
  USING (auth.uid() = user_id);
