import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const { token, deviceType = 'web' } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Upsert: if token already exists for this user, update last_seen
  const { error } = await (supabase
    .from('fcm_tokens') as any)
    .upsert(
      { user_id: user.id, token, device_type: deviceType, last_seen: new Date().toISOString() },
      { onConflict: 'token' }
    );

  if (error) {
    console.error('[register-token] Supabase error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
