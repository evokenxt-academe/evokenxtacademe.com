import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase-admin';

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

  const firestore = getFirebaseAdminFirestore();
  if (!firestore) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    if (notificationIds?.length) {
      const batch = firestore.batch();
      
      const snapshots = await Promise.all(
        notificationIds.map(id => firestore.collection('notifications').doc(id).get())
      );

      for (const snap of snapshots) {
        if (!snap.exists) continue;
        const data = snap.data();
        if (data?.user_id === user.id) {
          batch.update(snap.ref, { is_read: true });
        } else if (data?.user_id === null) {
          const readDocId = `${user.id}_${snap.id}`;
          batch.set(firestore.collection('notification_reads').doc(readDocId), {
            user_id: user.id,
            notification_id: snap.id,
            read_at: new Date().toISOString(),
          });
        }
      }
      
      await batch.commit();
    } else {
      // Mark all read
      const batch = firestore.batch();

      // 1. User owned targeted notifications
      const targetedSnaps = await firestore
        .collection('notifications')
        .where('user_id', '==', user.id)
        .where('is_read', '==', false)
        .get();

      targetedSnaps.forEach(doc => {
        batch.update(doc.ref, { is_read: true });
      });

      // 2. Broadcast notifications
      const broadcastSnaps = await firestore
        .collection('notifications')
        .where('user_id', '==', null)
        .get();

      broadcastSnaps.forEach(doc => {
        const readDocId = `${user.id}_${doc.id}`;
        batch.set(firestore.collection('notification_reads').doc(readDocId), {
          user_id: user.id,
          notification_id: doc.id,
          read_at: new Date().toISOString(),
        });
      });

      await batch.commit();
    }
  } catch (err) {
    console.error('[mark-read] Firestore error:', err);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

