'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button }     from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn }         from '@/lib/utils';

export interface NotificationItem {
  id:         string;
  title:      string;
  body:       string;
  image_url:  string | null;
  route:      string | null;
  type:       string;
  is_read:    boolean;
  created_at: string;
}

interface NotificationDrawerProps {
  open:           boolean;
  onClose:        () => void;
  notifications:  NotificationItem[];
  onMarkAllRead:  () => void;
}

const TYPE_ICONS: Record<string, string> = {
  new_course:   '🎓',
  new_lecture:  '📹',
  new_quiz:     '📝',
  live_stream:  '🔴',
  custom_admin: '📣',
};

export default function NotificationDrawer({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const router = useRouter();

  function handleClick(notification: NotificationItem) {
    if (notification.route) {
      router.push(notification.route);
      onClose();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between">
          <SheetTitle className="text-base font-medium">Notifications</SheetTitle>
          {notifications.some((n) => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="text-xs text-muted-foreground"
            >
              Mark all read
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <span className="text-3xl">🔔</span>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3',
                    !n.is_read && 'bg-emerald-500/5 border-l-2 border-emerald-500'
                  )}
                >
                  {/* Thumbnail or icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {n.image_url ? (
                      <img
                        src={n.image_url}
                        alt=""
                        className="w-12 h-9 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm truncate',
                        !n.is_read ? 'font-medium' : 'font-normal'
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
