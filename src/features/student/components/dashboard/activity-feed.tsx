"use client";

import Link from "next/link";
import {
  IconPlayerPlay,
  IconCircleCheckFilled,
  IconWriting,
  IconLivePhoto,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityFeedItem } from "@/features/student/types/dashboard";

interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

function getIcon(item: ActivityFeedItem) {
  if (item.type === "quiz") {
    return <IconWriting className="size-4" />;
  }
  if (item.type === "live_stream") {
    return <IconLivePhoto className="size-4" />;
  }
  if (item.status === "completed") {
    return <IconCircleCheckFilled className="size-4 text-emerald-500" />;
  }
  return <IconPlayerPlay className="size-4" />;
}

function getStatusBadge(item: ActivityFeedItem) {
  if (!item.meta) return null;

  const variant =
    item.status === "completed" || item.status === "passed"
      ? "default"
      : "secondary";

  return (
    <Badge variant={variant} className="shrink-0 text-[10px] font-medium">
      {item.meta}
    </Badge>
  );
}

function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMin = Math.round((now - then) / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your latest learning activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ScrollArea className="h-[320px] pr-2">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group block"
                >
                  <div className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {getIcon(item)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {getStatusBadge(item)}
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity yet. Start a course to see your progress here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
