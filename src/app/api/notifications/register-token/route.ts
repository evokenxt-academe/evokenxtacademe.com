import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

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

  const firestore = getFirebaseAdminFirestore();
  if (!firestore) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    // Upsert: document key is the token itself
    await firestore.collection('fcm_tokens').doc(token).set({
      user_id: user.id,
      token,
      device_type: deviceType,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('[register-token] Firestore error:', err);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

