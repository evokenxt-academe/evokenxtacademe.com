-- Migration: Allow multiple chapters/courses to share the same YouTube playlist link.
-- Drops the unique constraint/index on youtube_playlist_id and replaces it with a standard index.

DROP INDEX IF EXISTS public.idx_chapters_youtube_playlist_id;

CREATE INDEX IF NOT EXISTS idx_chapters_youtube_playlist_id
ON public.chapters (youtube_playlist_id)
WHERE youtube_playlist_id IS NOT NULL;
