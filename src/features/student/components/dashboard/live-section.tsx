"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  IconClock,
  IconLivePhoto,
  IconCalendarEvent,
  IconPlayerPlay,
  IconCheck,
  IconBan,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LiveStreamEntry } from "@/features/student/types/dashboard";

interface LiveSectionProps {
  streams: LiveStreamEntry[];
}

// ─── Countdown hook ────────────────────────────────────────────────

function useCountdown(targetDate: string | null) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!targetDate) return;

    function calculate() {
      const now = Date.now();
      const target = new Date(targetDate!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setRemaining("Starting soon");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) {
        setRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        setRemaining(`${minutes}m ${seconds}s`);
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return remaining;
}

// ─── Status helpers ────────────────────────────────────────────────

function getStatusConfig(status: LiveStreamEntry["status"]) {
  switch (status) {
    case "live":
      return {
        icon: <IconLivePhoto className="size-3.5" />,
        label: "LIVE NOW",
        className:
          "border-none bg-red-500 text-white shadow-sm shadow-red-500/20 hover:bg-red-600",
        pulse: true,
      };
    case "scheduled":
      return {
        icon: <IconCalendarEvent className="size-3.5" />,
        label: "UPCOMING",
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
        pulse: false,
      };
    case "ended":
      return {
        icon: <IconCheck className="size-3.5" />,
        label: "ENDED",
        className:
          "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
        pulse: false,
      };
    case "cancelled":
      return {
        icon: <IconBan className="size-3.5" />,
        label: "CANCELLED",
        className:
          "border-red-200 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
        pulse: false,
      };
    default:
      return {
        icon: null,
        label: status,
        className: "",
        pulse: false,
      };
  }
}

function formatStreamTime(stream: LiveStreamEntry): string {
  const ts = stream.startedAt || stream.scheduledAt || stream.endedAt;
  if (!ts) return "Time TBD";
  return new Date(ts).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─── Live stream card ──────────────────────────────────────────────

function LiveStreamCard({ stream }: { stream: LiveStreamEntry }) {
  const statusConfig = getStatusConfig(stream.status);
  const countdown = useCountdown(
    stream.status === "scheduled" ? stream.scheduledAt : null,
  );

  const isLive = stream.status === "live";
  const isScheduled = stream.status === "scheduled";

  return (
    <div
      className={`
        relative flex flex-col gap-2 rounded-xl border p-3 transition-all duration-200
        ${isLive
          ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
          : isScheduled
            ? "border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/10"
            : "hover:bg-accent/50"
        }
      `}
    >
      {/* Live pulse effect */}
      {isLive && (
        <div className="absolute -right-0.5 -top-0.5 size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium leading-snug">
          {stream.title}
        </span>
        <Badge
          className={`shrink-0 gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig.className}`}
        >
          {statusConfig.pulse && (
            <span className="mr-0.5 inline-block size-1.5 animate-ping rounded-full bg-white" />
          )}
          {statusConfig.label}
        </Badge>
      </div>

      {/* Course name */}
      <span className="truncate text-xs font-medium text-primary">
        {stream.courseName}
      </span>

      {/* Time info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <IconClock className="size-3" />
          {formatStreamTime(stream)}
        </div>

        {/* Countdown for scheduled */}
        {isScheduled && countdown && (
          <span className="text-[11px] font-medium tabular-nums text-blue-600 dark:text-blue-400">
            in {countdown}
          </span>
        )}
      </div>

      {/* Action button */}
      {isLive && stream.ytVideoId && (
        <Button asChild size="sm" className="mt-0.5 h-7 w-full gap-1.5 text-xs">
          <Link href={`/dashboard/live/${stream.courseId}`}>
            <IconPlayerPlay className="size-3" />
            Join Live Class
          </Link>
        </Button>
      )}
    </div>
  );
}

// ─── Main section ──────────────────────────────────────────────────

export function LiveSection({ streams }: LiveSectionProps) {
  // Sort: live first, then scheduled, then ended
  const sortedStreams = useMemo(() => {
    const priority: Record<string, number> = {
      live: 0,
      scheduled: 1,
      ended: 2,
      cancelled: 3,
    };

    return [...streams].sort((a, b) => {
      const pa = priority[a.status] ?? 4;
      const pb = priority[b.status] ?? 4;
      if (pa !== pb) return pa - pb;

      // Within same status, sort by time
      const ta = new Date(a.scheduledAt || a.startedAt || "").getTime() || 0;
      const tb = new Date(b.scheduledAt || b.startedAt || "").getTime() || 0;

      // Upcoming = ascending, ended = descending
      if (a.status === "scheduled") return ta - tb;
      return tb - ta;
    });
  }, [streams]);

  const liveCount = sortedStreams.filter((s) => s.status === "live").length;
  const scheduledCount = sortedStreams.filter((s) => s.status === "scheduled").length;

  if (streams.length === 0) {
    return (
      <Card className="transition-shadow hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <IconLivePhoto className="size-4 text-primary" />
            Live Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6">
            <IconCalendarEvent className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No live classes scheduled
            </p>
            <p className="text-xs text-muted-foreground/60">
              Check back later for upcoming sessions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <IconLivePhoto className="size-4 text-primary" />
            Live Classes
          </CardTitle>
          <div className="flex gap-1.5">
            {liveCount > 0 && (
              <Badge className="gap-1 border-none bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-600">
                <span className="inline-block size-1.5 animate-ping rounded-full bg-white" />
                {liveCount} Live
              </Badge>
            )}
            {scheduledCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
                {scheduledCount} Upcoming
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={sortedStreams.length > 3 ? "h-[280px] pr-2" : ""}>
          <div className="flex flex-col gap-2">
            {sortedStreams.map((stream) => (
              <LiveStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function LiveSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
