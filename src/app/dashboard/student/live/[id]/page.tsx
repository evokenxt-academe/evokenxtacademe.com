"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconArrowLeft, IconBell, IconClockHour4, IconUsers, IconMessageCircle } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
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
  const [dismissEndedOverlay, setDismissEndedOverlay] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  const isLive = realtimeIsLive || stream?.status === "live";
  const isEnded = stream?.status === "ended" || stream?.status === "replay";
  const showEndedOverlay = stream?.status === "ended" && !dismissEndedOverlay;
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
  if (!stream) return <div className="p-8 text-center text-muted-foreground">Stream not found.</div>;

  const course = stream.courses;
  const instructor = stream.users ?? stream.courses?.instructor ?? null;
  const subject = course?.subjects;
  const liveVideoId = extractYouTubeId(stream.yt_video_id);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[1480px] pb-10 md:px-6 lg:px-8">
      <div className="mb-5 hidden md:block mt-6">
        <Link href="/dashboard/student/live">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            <span className="text-xs font-medium">Back to Live Classes</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Main Content Area */}
        <div className="min-w-0 flex flex-col gap-5">
          {/* Player Section */}
          <div className="relative bg-black md:rounded-2xl md:border shadow-sm overflow-hidden aspect-video">
            {/* Mobile Back Button (overlay on video before play or just above video) */}
            <div className="absolute top-4 left-4 z-50 md:hidden">
              <Link href="/dashboard/student/live">
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 rounded-full bg-black/40 text-white hover:bg-black/60 border-0 backdrop-blur-sm"
                >
                  <IconArrowLeft className="size-4" />
                </Button>
              </Link>
            </div>

            {liveVideoId ? (
              <>
                <YtcnPlayer
                  videoId={liveVideoId}
                  autoplay={isLive}
                  isLive={isLive}
                  className="size-full"
                />
                {showEndedOverlay && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500">
                    <p className="text-white text-lg font-medium mb-4">Stream has ended</p>
                    <div className="flex gap-3">
                      <Button 
                        variant="secondary" 
                        className="rounded-full shadow-lg"
                        onClick={() => setDismissEndedOverlay(true)}
                      >
                        Watch Recording
                      </Button>
                      <Link href="/dashboard/student/live">
                        <Button variant="outline" className="rounded-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white">
                          Browse More Classes
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : isUpcoming ? (
              <UpcomingPlaceholder
                stream={stream}
                onRegister={handleRegister}
                registered={registered}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">No video available</p>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="px-4 md:px-0">
            <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StreamStatusBadge status={stream.status} />
                    {subject ? (
                      <Badge variant="outline" className="text-[10px] font-medium tracking-wide text-muted-foreground">
                        {subject.code} · {subject.program_levels?.programs?.body}
                      </Badge>
                    ) : null}
                  </div>
                  <h1 className="text-xl font-semibold tracking-tight leading-snug sm:text-2xl text-foreground">
                    {stream.title}
                  </h1>
                </div>
                {isLive ? (
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-sm text-foreground shadow-sm">
                    <IconUsers className="size-4 text-muted-foreground" />
                    <span className="tabular-nums font-medium">
                      {viewers || stream.concurrent_viewers || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">watching</span>
                  </div>
                ) : null}
              </div>

              {stream.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">
                  {stream.description}
                </p>
              ) : null}

              <Separator className="my-1" />

              <div className="flex items-center gap-3">
                <Avatar className="size-10 border shadow-sm">
                  <AvatarImage src={instructor?.avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {instructor?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-foreground">{instructor?.name ?? "Instructor"}</p>
                  <p className="text-xs text-muted-foreground">Instructor · {course?.title}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg border">
                {stream.scheduled_at ? (
                  <span className="flex items-center gap-1.5">
                    <IconClockHour4 className="size-4 text-muted-foreground/70" />
                    {format(new Date(stream.scheduled_at), "dd MMM yyyy, h:mm a")}
                  </span>
                ) : null}
                {isEnded && stream.duration_sec ? (
                  <span className="flex items-center gap-1.5">
                    <IconClockHour4 className="size-4 text-muted-foreground/70" />
                    {Math.floor(stream.duration_sec / 3600) > 0
                      ? `${Math.floor(stream.duration_sec / 3600)}h ${Math.floor((stream.duration_sec % 3600) / 60)}m`
                      : `${Math.floor(stream.duration_sec / 60)}m`}{" "}
                    recording
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Chat Panel (Hidden on mobile) */}
        <div className="hidden md:block lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] h-[450px]">
          <LiveChat streamId={id} isLive={isLive} />
        </div>
      </div>

      {/* Mobile Floating Chat Toggle & Bottom Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-6 right-5 size-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground z-40 transition-transform active:scale-95"
            >
              <IconMessageCircle className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80dvh] p-0 flex flex-col rounded-t-3xl sm:rounded-t-3xl border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <SheetHeader className="px-5 py-4 border-b text-left bg-muted/30 flex-none hidden">
               <SheetTitle>Live Chat</SheetTitle>
            </SheetHeader>
            {/* The LiveChat component itself has a header, so we hide the SheetHeader visually or omit it. 
                We use VisuallyHidden or just hidden on the SheetHeader so screen readers get a title if needed. */}
            <div className="flex-1 overflow-hidden p-2 pb-0 bg-background rounded-t-3xl">
               {/* Pass a class to strip outer border/radius since it's in a sheet */}
               <div className="h-full [&>div]:border-0 [&>div]:rounded-t-2xl [&>div]:shadow-none">
                  <LiveChat streamId={id} isLive={isLive} />
               </div>
            </div>
          </SheetContent>
        </Sheet>
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-muted/50 px-6 py-12 text-center">
      <div className="rounded-full bg-background p-4 shadow-sm border">
        <IconBell className="size-8 text-primary/70" stroke={1.5} />
      </div>
      <div>
        <h3 className="text-lg font-semibold sm:text-xl text-foreground mb-1">{stream.title}</h3>
        <p className="text-sm text-muted-foreground font-medium">
          Going live on {format(new Date(stream.scheduled_at), "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
      {!registered ? (
        <Button size="lg" onClick={onRegister} className="gap-2 rounded-full mt-2 shadow-sm">
          <IconBell className="size-4" />
          Notify Me When It Starts
        </Button>
      ) : (
        <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full mt-2 bg-primary/10 text-primary border-primary/20">
          Reminder set
        </Badge>
      )}
    </div>
  );
}

function WatchPageSkeleton() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[1480px] pb-10 md:px-6 lg:px-8 mt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6 px-4 md:px-0">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-4 rounded-2xl border bg-card p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Separator />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block h-[calc(100vh-3rem)]">
          <Skeleton className="size-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
