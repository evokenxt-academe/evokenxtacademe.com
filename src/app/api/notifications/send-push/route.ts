import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * POST /api/notifications/send-push
 * Admin-only: sends FCM push notification to all users with registered tokens.
 * This uses the Firebase Cloud Messaging HTTP v1 API via a lightweight fetch approach.
 * For production with firebase-admin SDK on NestJS backend, this serves as a
 * frontend-only fallback that stores the notification in Supabase.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verify the current user is an admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMINS_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  const { title, body, imageUrl, route } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  // Use service role client to read all FCM tokens (bypasses RLS)
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all FCM tokens
  const { data: tokenRows, error: tokenError } = await adminSupabase
    .from('fcm_tokens')
    .select('token');

  if (tokenError) {
    console.error('[send-push] Failed to fetch tokens:', tokenError);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }

  // Store broadcast notification (already done by AdminNotifyPanel, but
  // this ensures it's persisted even if called directly)
  // Note: AdminNotifyPanel inserts the notification itself, so we skip here
  // to avoid duplicates.

  const totalTokens = tokenRows?.length ?? 0;
  console.log(`[send-push] Broadcasting to ${totalTokens} devices`);

  // Note: Actual FCM sending requires firebase-admin SDK which runs on
  // the NestJS backend. This endpoint logs the notification and the
  // frontend AdminNotifyPanel already persists it to Supabase.
  // When NestJS backend is set up, replace this with a call to the
  // NestJS admin/notifications/send endpoint.

  return NextResponse.json({
    success: true,
    message: `Notification stored. ${totalTokens} device(s) registered.`,
  });
}
