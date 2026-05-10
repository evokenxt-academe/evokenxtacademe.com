'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { getFirebaseMessaging } from '@/lib/firebase';
import { requestAndGetFcmToken, saveFcmTokenToServer } from '@/lib/notifications';
import { useRouter } from 'next/navigation';

interface ForegroundNotification {
  title: string;
  body:  string;
  image?: string;
  route?: string;
}

/**
 * Call this hook in your root layout (student layout + admin layout).
 * Handles:
 * - Permission request on first load
 * - Token registration/refresh
 * - Foreground notification toast
 */
export function useNotifications(userId: string | null) {
  const router        = useRouter();
  const unsubRef      = useRef<(() => void) | null>(null);
  const tokenSavedRef = useRef(false);

  const registerToken = useCallback(async () => {
    if (!userId || tokenSavedRef.current) return;
    const token = await requestAndGetFcmToken();
    if (!token) return;
    await saveFcmTokenToServer(token);
    tokenSavedRef.current = true;
  }, [userId]);

  const subscribeForeground = useCallback(async () => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    unsubRef.current = onMessage(messaging, (payload) => {
      const notification = payload.notification as ForegroundNotification | undefined;
      const data         = payload.data as Partial<ForegroundNotification> | undefined;

      const title = notification?.title ?? data?.title ?? 'Evokenxt';
      const body  = notification?.body  ?? data?.body  ?? '';
      const route = data?.route;

      // Show foreground toast with click-to-navigate
      toast(title, {
        description: body,
        action: route
          ? { label: 'View', onClick: () => router.push(route) }
          : undefined,
        duration: 6000,
      });
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    registerToken();
    subscribeForeground();

    return () => {
      unsubRef.current?.();
    };
  }, [userId, registerToken, subscribeForeground]);
}
