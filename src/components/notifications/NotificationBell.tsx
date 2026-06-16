'use client';

import { useState, useEffect, useTransition } from 'react';
import { IconBell, IconBellRinging } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationDrawer, { type NotificationItem } from './NotificationDrawer';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';

export const NOTIFICATIONS_REFRESH_EVENT = 'evoke:notifications-refresh';

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    // 1. Listen to user targeted notifications
    const qTargeted = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      limit(50)
    );

    // 2. Listen to broadcast notifications
    const qBroadcast = query(
      collection(db, 'notifications'),
      where('user_id', '==', null),
      limit(50)
    );

    // 3. Listen to read receipts
    const qReads = query(
      collection(db, 'notification_reads'),
      where('user_id', '==', userId)
    );

    let targetedList: any[] = [];
    let broadcastList: any[] = [];
    let readSet = new Set<string>();

    const updateMerged = () => {
      const merged = [...targetedList, ...broadcastList]
        .map((doc) => ({
          ...doc,
          is_read: doc.user_id === null ? readSet.has(doc.id) : !!doc.is_read,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      setNotifications(merged);
      setLoading(false);
    };

    const unsubTargeted = onSnapshot(
      qTargeted,
      (snapshot) => {
        targetedList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        updateMerged();
      },
      (err) => {
        console.error('[NotificationBell] Targeted sub failed:', err);
      }
    );

    const unsubBroadcast = onSnapshot(
      qBroadcast,
      (snapshot) => {
        broadcastList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        updateMerged();
      },
      (err) => {
        console.error('[NotificationBell] Broadcast sub failed:', err);
      }
    );

    const unsubReads = onSnapshot(
      qReads,
      (snapshot) => {
        readSet = new Set(snapshot.docs.map((doc) => doc.data().notification_id));
        updateMerged();
      },
      (err) => {
        console.error('[NotificationBell] Reads sub failed:', err);
      }
    );

    return () => {
      unsubTargeted();
      unsubBroadcast();
      unsubReads();
    };
  }, [userId]);


  async function markAllRead() {
    startTransition(async () => {
      await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  }

  async function markOneRead(notificationId: string) {
    startTransition(async () => {
      await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative size-9 rounded-xl hover:bg-muted/80"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
      >
        {unreadCount > 0 ? (
          <IconBellRinging className="size-[18px] text-emerald-600 dark:text-emerald-400" />
        ) : (
          <IconBell className="size-[18px]" />
        )}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-full px-1 flex items-center justify-center text-[10px] font-bold leading-none border-2 border-background"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationDrawer
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        loading={loading}
        onMarkAllRead={markAllRead}
        onMarkRead={markOneRead}
      />
    </>
  );
}
