'use client';

import { useState, useEffect, useTransition } from 'react';
import { IconBell } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import NotificationDrawer, { type NotificationItem } from './NotificationDrawer';

export default function NotificationBell({ userId }: { userId: string }) {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [, startTransition] = useTransition();

  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for new notifications (user-specific)
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    // Also listen for broadcast notifications (user_id IS NULL)
    const broadcastChannel = supabase
      .channel(`notifications:broadcast`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=is.null`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications((data as NotificationItem[]) ?? []);
  }

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative size-9 rounded-xl"
        onClick={() => setOpen(true)}
        aria-label="Notifications"
      >
        <IconBell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-[10px] font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationDrawer
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
    </>
  );
}
