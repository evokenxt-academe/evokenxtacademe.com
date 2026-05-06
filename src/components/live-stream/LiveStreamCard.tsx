import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { IconCalendarEvent, IconClockHour4, IconUsers } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { StreamStatusBadge } from "./StreamStatusBadge";

interface StreamCardProps {
  stream: LiveStreamItem;
  className?: string;
}

export interface LiveStreamItem {
  id: string;
  title: string;
  status: "scheduled" | "live" | "ended" | "replay" | "cancelled";
  yt_thumbnail_url?: string | null;
  yt_video_id?: string | null;
  concurrent_viewers?: number | null;
  duration_sec?: number | null;
  started_at?: string | null;
  scheduled_at?: string | null;
  courses?: {
    thumbnail_url?: string | null;
    subjects?: {
      code?: string | null;
      program_levels?: {
        programs?: {
          body?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
  users?: {
    avatar?: string | null;
    name?: string | null;
  } | null;
}

export function LiveStreamCard({ stream, className }: StreamCardProps) {
  const course = stream.courses;
  const instructor = stream.users;
  const isLive = stream.status === "live";
  const isUpcoming = stream.status === "scheduled";
  const isReplay = stream.status === "ended" || stream.status === "replay";

  const thumbnail = stream.yt_thumbnail_url
    ? stream.yt_thumbnail_url
    : stream.yt_video_id
      ? `https://img.youtube.com/vi/${stream.yt_video_id}/maxresdefault.jpg`
      : course?.thumbnail_url;

  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startedAt = parseDate(stream.started_at);
  const scheduledAt = parseDate(stream.scheduled_at);
  const replayDate = scheduledAt ?? startedAt;

  const dateLabel = isLive
    ? startedAt
      ? `Started ${formatDistanceToNow(startedAt, { addSuffix: true })}`
      : "Live now"
    : isUpcoming
      ? scheduledAt
        ? format(scheduledAt, "dd MMM, h:mm a")
        : "Schedule to be announced"
      : replayDate
        ? format(replayDate, "dd MMM yyyy")
        : "Recorded class";

  return (
    <Link
      href={`/dashboard/student/live/${stream.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border bg-card/80 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md",
        isLive && "ring-1 ring-red-500/30",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={stream.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-muted/50">
            <span className="text-sm text-muted-foreground">No preview</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StreamStatusBadge status={stream.status} />
        </div>
        {isLive ? (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            <IconUsers className="size-3" />
            {stream.concurrent_viewers ?? 0}
          </div>
        ) : null}
        {isReplay && stream.duration_sec ? (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            <IconClockHour4 className="size-3" />
            {Math.round(stream.duration_sec / 60)}m
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {course?.subjects?.code} · {course?.subjects?.program_levels?.programs?.body}
          </p>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
            {stream.title}
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <Avatar className="size-6">
            <AvatarImage src={instructor?.avatar ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {instructor?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{instructor?.name}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconCalendarEvent className="size-3 shrink-0" />
          {dateLabel}
        </div>
      </div>
    </Link>
  );
}
