import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(req: NextRequest) {
  const { notificationIds } = await req.json() as { notificationIds?: string[] };

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = (supabase
    .from('notifications') as any)
    .update({ is_read: true })
    .eq('user_id', user.id);

  if (notificationIds?.length) {
    query = query.in('id', notificationIds);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });

  return NextResponse.json({ success: true });
}
