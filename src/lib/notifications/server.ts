import { getFirebaseAdminMessaging } from '@/lib/firebase-admin';
import { createAdminClient } from '@/utils/supabase/adminClient';
import type { SendNotificationInput, SendNotificationResult } from './types';

const FCM_BATCH_SIZE = 500;
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

async function hasRecentDuplicate(
  type: string,
  sourceId: string | null | undefined,
): Promise<boolean> {
  if (!sourceId) return false;

  const supabase = createAdminClient();
  const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();

  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('type', type)
    .eq('source_id', sourceId)
    .gte('created_at', since)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function fetchFcmTokens(userId?: string | null): Promise<string[]> {
  const supabase = createAdminClient();

  let query = supabase.from('fcm_tokens').select('token');
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[notifications] Failed to fetch FCM tokens:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.token).filter(Boolean);
}

async function sendFcmPush(
  tokens: string[],
  payload: {
    title: string;
    body: string;
    route?: string;
    imageUrl?: string | null;
    type: string;
    notificationId: string;
  },
): Promise<{ sent: number; failed: number }> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const baseUrl = getAppBaseUrl();
  const link = payload.route ? `${baseUrl}${payload.route}` : baseUrl;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const batch = tokens.slice(i, i + FCM_BATCH_SIZE);

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
        data: {
          title: payload.title,
          body: payload.body,
          route: payload.route ?? '/dashboard',
          type: payload.type,
          notificationId: payload.notificationId,
          ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
        },
        webpush: {
          fcmOptions: { link },
          notification: {
            icon: '/logo.jpg',
            badge: '/logo.jpg',
            ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
          },
        },
      });

      sent += response.successCount;
      failed += response.failureCount;

      const staleTokens: string[] = [];
      response.responses.forEach((result, index) => {
        if (!result.success) {
          const code = result.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            staleTokens.push(batch[index]!);
          }
        }
      });

      if (staleTokens.length > 0) {
        const supabase = createAdminClient();
        await supabase.from('fcm_tokens').delete().in('token', staleTokens);
      }
    } catch (err) {
      console.error('[notifications] FCM batch send failed:', err);
      failed += batch.length;
    }
  }

  return { sent, failed };
}

/** Persist notification + deliver FCM push to registered devices. */
export async function sendNotification(
  input: SendNotificationInput,
): Promise<SendNotificationResult | null> {
  if (!input.skipDuplicateCheck && input.sourceId) {
    const duplicate = await hasRecentDuplicate(input.type, input.sourceId);
    if (duplicate) return null;
  }

  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId ?? null,
      title: input.title,
      body: input.body,
      image_url: input.imageUrl ?? null,
      route: input.route ?? null,
      type: input.type,
      source_id: input.sourceId ?? null,
    })
    .select('id')
    .single();

  if (error || !row) {
    console.error('[notifications] Failed to insert notification:', error?.message);
    throw new Error(error?.message ?? 'Failed to create notification');
  }

  const tokens = await fetchFcmTokens(input.userId);
  const { sent, failed } = await sendFcmPush(tokens, {
    title: input.title,
    body: input.body,
    route: input.route,
    imageUrl: input.imageUrl,
    type: input.type,
    notificationId: row.id,
  });

  return {
    notificationId: row.id,
    pushSent: sent,
    pushFailed: failed,
  };
}

/** Fire-and-forget wrapper — never blocks the caller's response. */
export function sendNotificationAsync(input: SendNotificationInput): void {
  void sendNotification(input).catch((err) => {
    console.error('[notifications] Async send failed:', err);
  });
}

// ── Event-specific helpers ────────────────────────────────────────────

export async function notifyNewCourse(params: {
  courseId: string;
  name: string;
  slug: string;
  thumbnailUrl?: string | null;
}) {
  return sendNotification({
    type: 'new_course',
    title: 'New Course Available',
    body: `${params.name} is now live. Start learning today!`,
    route: `/courses/${params.slug}`,
    imageUrl: params.thumbnailUrl,
    sourceId: params.courseId,
  });
}

export async function notifyNewLecture(params: {
  lectureId: string;
  title: string;
  courseSlug: string;
  courseName?: string;
  ytVideoId?: string | null;
  thumbnailUrl?: string | null;
}) {
  const imageUrl =
    params.thumbnailUrl ??
    (params.ytVideoId
      ? `https://img.youtube.com/vi/${params.ytVideoId}/mqdefault.jpg`
      : null);

  return sendNotification({
    type: 'new_lecture',
    title: 'New Video Uploaded',
    body: params.courseName
      ? `"${params.title}" added to ${params.courseName}`
      : `"${params.title}" is ready to watch`,
    route: `/learn/${params.courseSlug}?lecture=${params.lectureId}`,
    imageUrl,
    sourceId: params.lectureId,
  });
}

export async function notifyLiveStream(params: {
  streamId: string;
  title: string;
  ytVideoId?: string | null;
  thumbnailUrl?: string | null;
}) {
  const imageUrl =
    params.thumbnailUrl ??
    (params.ytVideoId
      ? `https://img.youtube.com/vi/${params.ytVideoId}/mqdefault.jpg`
      : null);

  return sendNotification({
    type: 'live_stream',
    title: 'Live Class Started',
    body: `${params.title} is live now. Join before it ends!`,
    route: `/dashboard/student/live/${params.streamId}`,
    imageUrl,
    sourceId: params.streamId,
    skipDuplicateCheck: false,
  });
}

export async function notifyNewQuiz(params: {
  quizId: string;
  title: string;
  courseName?: string;
}) {
  return sendNotification({
    type: 'new_quiz',
    title: 'New Test Available',
    body: params.courseName
      ? `"${params.title}" is ready in ${params.courseName}`
      : `"${params.title}" is ready to take`,
    route: `/dashboard/tests/${params.quizId}/start`,
    sourceId: params.quizId,
  });
}

export async function resolveLectureCourseContext(lectureId: string) {
  const supabase = createAdminClient();

  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, video_url, yt_video_id, chapter_id')
    .eq('id', lectureId)
    .maybeSingle();

  if (!lecture) return null;

  const chapterId = lecture.chapter_id;
  if (!chapterId) return null;

  const { data: chapter } = await supabase
    .from('chapters')
    .select('course_id')
    .eq('id', chapterId)
    .maybeSingle();

  if (!chapter?.course_id) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug, thumbnail_url')
    .eq('id', chapter.course_id)
    .maybeSingle();

  if (!course) return null;

  return { lecture, course };
}

export async function resolveQuizCourseContext(quizId: string) {
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, course_id, section_id')
    .eq('id', quizId)
    .maybeSingle();

  if (!quiz) return null;

  let courseId = quiz.course_id as string | null;

  if (!courseId && quiz.section_id) {
    const { data: section } = await supabase
      .from('sections')
      .select('course_id')
      .eq('id', quiz.section_id)
      .maybeSingle();
    courseId = section?.course_id ?? null;
  }

  if (!courseId) return { quiz, course: null };

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('id', courseId)
    .maybeSingle();

  return { quiz, course };
}

export async function resolveLiveStreamContext(streamId: string) {
  const supabase = createAdminClient();

  const { data: stream } = await supabase
    .from('live_streams')
    .select('id, title, yt_video_id, course_id')
    .eq('id', streamId)
    .maybeSingle();

  return stream;
}
