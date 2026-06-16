'use client';

import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

/**
 * Requests notification permission and returns FCM registration token.
 * Returns null if user denies or browser is unsupported.
 */
export async function requestAndGetFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (!VAPID_KEY || VAPID_KEY.length < 50 || !VAPID_KEY.startsWith('B')) {
    console.warn(
      '[FCM] Invalid or missing VAPID key. Skipping FCM token subscription to prevent PushManager console errors.'
    );
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied');
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    // Register service worker first — must be from /public root
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

/**
 * Saves FCM token to backend via Next.js API route → Supabase.
 * Idempotent: upserts by token value.
 */
export async function saveFcmTokenToServer(token: string): Promise<void> {
  await fetch('/api/notifications/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, deviceType: 'web' }),
  });
}
