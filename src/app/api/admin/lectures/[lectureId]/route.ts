import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';

import { requireAdmin } from '@/features/admin/lib/admin-route';
import {
  notifyNewLecture,
  resolveLectureCourseContext,
} from '@/lib/notifications/server';

type RouteParams = { params: Promise<{ lectureId: string }> };

/**
 * PATCH /api/admin/lectures/[lectureId]
 * Updates lecture fields and sends notification when a new video is attached.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(['admin', 'instructor']);
  if ('error' in auth) return auth.error;

  const { supabase } = auth;
  const { lectureId } = await params;
  const body = await request.json();

  const { data: existing, error: fetchError } = await supabase
    .from('lectures')
    .select('id, title, video_url, yt_video_id, is_published')
    .eq('id', lectureId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
  }

  const allowedFields = [
    'title',
    'description',
    'video_url',
    'video_provider',
    'yt_video_id',
    'duration_sec',
    'is_preview',
    'is_published',
    'transcript_url',
    'notes_url',
    'position',
  ] as const;

  const updatePayload: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updatePayload[field] = body[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('lectures')
    .update(updatePayload)
    .eq('id', lectureId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const newVideoUrl =
    typeof updatePayload.video_url === 'string' ? updatePayload.video_url : null;
  const hadVideo = !!existing.video_url;
  const hasNewVideo = !!newVideoUrl && newVideoUrl !== existing.video_url;
  const newlyPublished =
    updatePayload.is_published === true && !existing.is_published && !!newVideoUrl;

  if (hasNewVideo || (newlyPublished && !hadVideo)) {
    after(async () => {
      const ctx = await resolveLectureCourseContext(lectureId);
      if (!ctx) return;

      const ytId =
        (typeof updatePayload.yt_video_id === 'string'
          ? updatePayload.yt_video_id
          : ctx.lecture.yt_video_id) ?? null;

      await notifyNewLecture({
        lectureId,
        title: (updatePayload.title as string) ?? ctx.lecture.title,
        courseSlug: ctx.course.slug,
        courseName: ctx.course.name,
        ytVideoId: ytId,
        thumbnailUrl: ctx.course.thumbnail_url,
      });
    });
  }

  return NextResponse.json({ success: true });
}
