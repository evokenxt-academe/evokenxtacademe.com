'use client';

import type { ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  IconBook,
  IconChevronRight,
  IconLivePhoto,
  IconNotebook,
  IconVideo,
  IconSpeakerphone,
} from '@tabler/icons-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NOTIFICATION_TYPE_LABELS, type NotificationType } from '@/lib/notifications/types';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  route: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

const TYPE_META: Record<
  string,
  { icon: ComponentType<{ className?: string }>; accent: string }
> = {
  new_course: { icon: IconBook, accent: 'text-blue-500 bg-blue-500/10' },
  new_lecture: { icon: IconVideo, accent: 'text-violet-500 bg-violet-500/10' },
  new_quiz: { icon: IconNotebook, accent: 'text-amber-500 bg-amber-500/10' },
  live_stream: { icon: IconLivePhoto, accent: 'text-red-500 bg-red-500/10' },
  custom_admin: { icon: IconSpeakerphone, accent: 'text-emerald-500 bg-emerald-500/10' },
};

function NotificationSkeleton() {
  return (
    <div className="px-4 py-3 flex gap-3">
      <Skeleton className="size-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export default function NotificationDrawer({
  open,
  onClose,
  notifications,
  loading = false,
  onMarkAllRead,
  onMarkRead,
}: NotificationDrawerProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleClick(notification: NotificationItem) {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    if (notification.route) {
      router.push(notification.route);
      onClose();
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 py-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="text-base font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRead}
                className="text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground gap-3">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                <IconSpeakerphone className="size-7 opacity-40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">All caught up</p>
                <p className="text-xs mt-1 max-w-[240px]">
                  New courses, videos, live classes, and tests will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.custom_admin!;
                const Icon = meta.icon;
                const typeLabel =
                  NOTIFICATION_TYPE_LABELS[n.type as NotificationType] ?? 'Update';

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full text-left px-5 py-3.5 hover:bg-muted/50 transition-colors flex gap-3 group',
                      !n.is_read && 'bg-emerald-500/[0.04]',
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 size-10 rounded-xl flex items-center justify-center overflow-hidden',
                        meta.accent,
                      )}
                    >
                      {n.image_url ? (
                        <img
                          src={n.image_url}
                          alt=""
                          className="size-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {typeLabel}
                        </span>
                        {!n.is_read && (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          !n.is_read ? 'font-semibold text-foreground' : 'font-medium',
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {n.route && (
                      <IconChevronRight className="size-4 text-muted-foreground/40 shrink-0 mt-2 group-hover:text-emerald-500 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
