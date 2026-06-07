import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/adminClient';

export async function PATCH(req: NextRequest) {
  const { notificationIds } = (await req.json()) as { notificationIds?: string[] };

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  if (notificationIds?.length) {
    const { data: targets } = await adminSupabase
      .from('notifications')
      .select('id, user_id')
      .in('id', notificationIds);

    const userOwnedIds = (targets ?? [])
      .filter((n) => n.user_id === user.id)
      .map((n) => n.id);

    const broadcastIds = (targets ?? [])
      .filter((n) => n.user_id === null)
      .map((n) => n.id);

    if (userOwnedIds.length > 0) {
      await adminSupabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', userOwnedIds)
        .eq('user_id', user.id);
    }

    if (broadcastIds.length > 0) {
      await adminSupabase.from('notification_reads').upsert(
        broadcastIds.map((notificationId) => ({
          user_id: user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,notification_id' },
      );
    }
  } else {
    await adminSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    const { data: broadcasts } = await adminSupabase
      .from('notifications')
      .select('id')
      .is('user_id', null);

    if (broadcasts?.length) {
      await adminSupabase.from('notification_reads').upsert(
        broadcasts.map((n) => ({
          user_id: user.id,
          notification_id: n.id,
          read_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,notification_id' },
      );
    }
  }

  return NextResponse.json({ success: true });
}
