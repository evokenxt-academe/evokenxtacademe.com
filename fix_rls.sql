-- Run this in your Supabase SQL Editor to allow public read access to published chapters and lectures.

CREATE POLICY "public_read_published_chapters" ON public.chapters
FOR SELECT TO anon, authenticated USING (is_published = TRUE);

CREATE POLICY "public_read_published_lectures" ON public.lectures
FOR SELECT TO anon, authenticated USING (is_published = TRUE);
