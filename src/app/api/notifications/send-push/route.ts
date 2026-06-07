import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/adminClient';
import { sendNotification } from '@/lib/notifications/server';

/**
 * POST /api/notifications/send-push
 * Admin-only: persists broadcast notification + sends FCM push to all devices.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMINS_EMAILS ?? '')
    .split(/[,;]/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin =
    profile?.role === 'admin' ||
    (user.email && adminEmails.includes(user.email.toLowerCase()));

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  const { title, body, imageUrl, route } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  try {
    const result = await sendNotification({
      type: 'custom_admin',
      title: title.trim(),
      body: body.trim(),
      imageUrl: imageUrl?.trim() || null,
      route: route?.trim() || '/dashboard',
      userId: null,
      skipDuplicateCheck: true,
    });

    return NextResponse.json({
      success: true,
      notificationId: result?.notificationId,
      pushSent: result?.pushSent ?? 0,
      pushFailed: result?.pushFailed ?? 0,
    });
  } catch (err) {
    console.error('[send-push]', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
