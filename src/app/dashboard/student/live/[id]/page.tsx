"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconArrowLeft, IconBell, IconClockHour4, IconUsers } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  markStreamAttendance,
  registerForStream,
} from "@/lib/supabase/live-stream-queries";
import { useStreamDetail } from "@/hooks/useLiveStreams";
import { useStreamRealtime } from "@/hooks/useStreamRealtime";
import { LiveChat } from "@/components/live-stream/LiveChat";
import { StreamStatusBadge } from "@/components/live-stream/StreamStatusBadge";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { extractYouTubeId } from "@/features/student/components/learn/use-youtube-player";

export default function WatchStreamPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const { data: stream, isLoading } = useStreamDetail(id);
  const { viewers, isLive: realtimeIsLive } = useStreamRealtime(id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  const isLive = realtimeIsLive || stream?.status === "live";
  const isEnded = stream?.status === "ended" || stream?.status === "replay";
  const isUpcoming = stream?.status === "scheduled";

  useEffect(() => {
    if (isLive && userId) {
      markStreamAttendance(id, userId).catch(() => undefined);
    }
  }, [isLive, id, userId]);

  async function handleRegister() {
    if (!userId) return;
    try {
      await registerForStream(id, userId);
      setRegistered(true);
      toast.success("Registered", {
        description: "You'll be notified when the stream starts.",
      });
    } catch {
      toast.error("Could not register for stream.");
    }
  }

  if (isLoading) return <WatchPageSkeleton />;
  if (!stream) return <p className="text-sm text-muted-foreground">Stream not found.</p>;

  const course = stream.courses;
  const instructor = stream.users ?? stream.courses?.instructor ?? null;
  const subject = course?.subjects;
  const liveVideoId = extractYouTubeId(stream.yt_video_id);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1480px] pb-10">
      <div className="mb-5">
        <Link href="/dashboard/student/live">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft />
            <span className="text-xs">Live Classes</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          {liveVideoId ? (
            <YtcnPlayer
              videoId={liveVideoId}
              autoplay={isLive}
              isLive={isLive}
              className="w-full overflow-hidden rounded-2xl border bg-black"
            />
          ) : isUpcoming ? (
            <UpcomingPlaceholder
              stream={stream}
              onRegister={handleRegister}
              registered={registered}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border bg-muted">
              <p className="text-sm text-muted-foreground">No video available</p>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border bg-card/80 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StreamStatusBadge status={stream.status} />
                  {subject ? (
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {subject.code} · {subject.program_levels?.programs?.body}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="text-lg font-semibold leading-snug sm:text-xl">{stream.title}</h1>
              </div>
              {isLive ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm text-muted-foreground">
                  <IconUsers />
                  <span className="tabular-nums">
                    {viewers || stream.concurrent_viewers || 0}
                  </span>
                </div>
              ) : null}
            </div>

            {stream.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{stream.description}</p>
            ) : null}

            <Separator />

            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={instructor?.avatar ?? undefined} />
                <AvatarFallback>{instructor?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{instructor?.name ?? "Instructor"}</p>
                <p className="text-xs text-muted-foreground">Instructor · {course?.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {stream.scheduled_at ? (
                <span className="flex items-center gap-1">
                  <IconClockHour4 className="size-3.5" />
                  {format(new Date(stream.scheduled_at), "dd MMM yyyy, h:mm a")}
                </span>
              ) : null}
              {isEnded && stream.duration_sec ? (
                <span className="flex items-center gap-1">
                  <IconClockHour4 className="size-3.5" />
                  {Math.floor(stream.duration_sec / 3600) > 0
                    ? `${Math.floor(stream.duration_sec / 3600)}h ${Math.floor((stream.duration_sec % 3600) / 60)}m`
                    : `${Math.floor(stream.duration_sec / 60)}m`}{" "}
                  recording
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-10rem)]">
          <LiveChat streamId={id} isLive={isLive} />
        </div>
      </div>
    </div>
  );
}

function UpcomingPlaceholder({
  stream,
  onRegister,
  registered,
}: {
  stream: any;
  onRegister: () => void;
  registered: boolean;
}) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted px-4">
      <div className="text-center">
        <p className="text-sm font-medium sm:text-base">{stream.title}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Starts {format(new Date(stream.scheduled_at), "dd MMM yyyy, h:mm a")}
        </p>
      </div>
      {!registered ? (
        <Button size="sm" onClick={onRegister} className="gap-1.5">
          <IconBell />
          Remind Me
        </Button>
      ) : (
        <Badge variant="secondary" className="text-xs">
          Reminder set
        </Badge>
      )}
    </div>
  );
}

function WatchPageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
