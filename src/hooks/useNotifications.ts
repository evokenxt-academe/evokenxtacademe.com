'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { getFirebaseMessaging } from '@/lib/firebase';
import { requestAndGetFcmToken, saveFcmTokenToServer } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/components/notifications/NotificationBell';

interface ForegroundNotification {
  title: string;
  body: string;
  image?: string;
  route?: string;
}

/**
 * Registers FCM token and handles foreground push notifications.
 * Mount in dashboard navbar and admin header when user is authenticated.
 */
export function useNotifications(userId: string | null) {
  const router = useRouter();
  const unsubRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef<string | null>(null);

  const registerToken = useCallback(async () => {
    if (!userId) return;

    const token = await requestAndGetFcmToken();
    if (!token) return;

    if (tokenRef.current === token) return;
    tokenRef.current = token;

    await saveFcmTokenToServer(token);
  }, [userId]);

  const subscribeForeground = useCallback(async () => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    if (unsubRef.current) {
      unsubRef.current();
    }

    unsubRef.current = onMessage(messaging, (payload) => {
      const notification = payload.notification as ForegroundNotification | undefined;
      const data = payload.data as Partial<ForegroundNotification> | undefined;

      const title = notification?.title ?? data?.title ?? 'Evoke EduGlobal';
      const body = notification?.body ?? data?.body ?? '';
      const route = data?.route;

      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));

      toast(title, {
        description: body,
        action: route
          ? {
              label: 'View',
              onClick: () => router.push(route),
            }
          : undefined,
        duration: 8000,
      });
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    void registerToken();
    void subscribeForeground();

    const onFocus = () => {
      void registerToken();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      unsubRef.current?.();
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, registerToken, subscribeForeground]);
}
