"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBroadcast } from "@tabler/icons-react";
import type { LiveStreamSummary } from "@/features/live-stream/types";

async function fetchActiveLiveStreams(): Promise<LiveStreamSummary[]> {
  const response = await fetch("/api/student/live-streams-active", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { streams?: LiveStreamSummary[] };
  return data.streams ?? [];
}

interface LiveStreamCardProps {
  stream: LiveStreamSummary;
}

export function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const isLive = stream.status === "live";
  const watchHref = `/dashboard/live/${stream.courseId}`;

  return (
    <Card className="group overflow-hidden rounded-xl border border-destructive/50 bg-destructive/5 transition-colors hover:border-destructive/70">
      {/* ── Video Preview ─────────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {stream.ytVideoId ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${stream.ytVideoId}?controls=0&modestbranding=1`}
            title={stream.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <div className="text-center">
              <IconBroadcast size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No video attached</p>
            </div>
          </div>
        )}

        {/* Live badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant="destructive"
            className="animate-pulse rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
          >
            ● LIVE
          </Badge>
        </div>

        {/* Course badge */}
        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="rounded-md bg-background/90 text-foreground"
          >
            {stream.courseName}
          </Badge>
        </div>
      </div>

      {/* ── Card body ─────────────────────────────────── */}
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {stream.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isLive ? "Broadcast is live now" : "Stream has ended"}
          </p>
        </div>
      </CardContent>

      {/* ── Footer ────────────────────────────────────── */}
      <CardFooter className="border-t border-border/40 p-3">
        <Button size="sm" className="w-full gap-2" asChild>
          <Link href={watchHref}>
            <IconBroadcast size={16} />
            {isLive ? "Join Now" : "Watch Recording"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function LiveStreamsSection() {
  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["active-live-streams"],
    queryFn: fetchActiveLiveStreams,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading || streams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconBroadcast size={20} className="text-destructive" />
        <h2 className="text-lg font-semibold">Live Now</h2>
        <Badge variant="destructive" className="animate-pulse">
          {streams.length}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {streams.map((stream) => (
          <LiveStreamCard key={stream.id} stream={stream} />
        ))}
      </div>
    </div>
  );
}
