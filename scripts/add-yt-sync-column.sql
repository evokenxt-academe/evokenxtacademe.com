-- Migration to add yt_sync_title_desc to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS yt_sync_title_desc BOOLEAN NOT NULL DEFAULT TRUE;
