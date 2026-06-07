'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { IconBell, IconBellRinging } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import NotificationDrawer, { type NotificationItem } from './NotificationDrawer';

export const NOTIFICATIONS_REFRESH_EVENT = 'evoke:notifications-refresh';

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: readRows } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    const readBroadcastIds = new Set(
      (readRows ?? []).map((r: any) => r.notification_id),
    );

    const merged: NotificationItem[] = (rows ?? []).map((row: any) => ({
      ...row,
      is_read:
        row.user_id === null
          ? readBroadcastIds.has(row.id)
          : !!(row as NotificationItem).is_read,
    }));

    setNotifications(merged);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    void fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [
            { ...(payload.new as NotificationItem), is_read: false },
            ...prev,
          ]);
        },
      )
      .subscribe();

    const broadcastChannel = supabase
      .channel(`notifications:broadcast:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=is.null`,
        },
        (payload) => {
          setNotifications((prev) => [
            { ...(payload.new as NotificationItem), is_read: false },
            ...prev,
          ]);
        },
      )
      .subscribe();

    const onRefresh = () => {
      void fetchNotifications();
    };
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    };
  }, [userId, supabase, fetchNotifications]);

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
