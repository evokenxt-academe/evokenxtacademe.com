-- FCM + Push Notifications Migration
-- Run this in Supabase SQL Editor

-- 1. FCM tokens per user per device
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  device_type  TEXT CHECK (device_type IN ('web', 'android', 'ios')) DEFAULT 'web',
  last_seen    TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON public.fcm_tokens(user_id);

-- 2. Notification log (source of truth for in-app bell)
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL = broadcast
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  image_url     TEXT,         -- YouTube thumbnail URL or custom image
  route         TEXT,         -- deep-link e.g. /courses/[id] or /live/[streamId]
  type          TEXT NOT NULL CHECK (type IN (
                  'new_course', 'new_lecture', 'new_quiz',
                  'live_stream', 'custom_admin'
                )),
  source_id     UUID,         -- course_id / lecture_id / quiz_id / stream_id
  is_read       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.notifications(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.fcm_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fcm_tokens' AND policyname = 'own tokens'
  ) THEN
    CREATE POLICY "own tokens" ON public.fcm_tokens
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can read their own notifications + broadcast (user_id IS NULL) notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'own notifications'
  ) THEN
    CREATE POLICY "own notifications" ON public.notifications
      FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
END $$;

-- 4. Per-user read state for broadcast notifications (user_id IS NULL)
CREATE TABLE IF NOT EXISTS public.notification_reads (
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_reads' AND policyname = 'own reads'
  ) THEN
    CREATE POLICY "own reads" ON public.notification_reads
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Realtime: enable live updates on notifications table (safe if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
