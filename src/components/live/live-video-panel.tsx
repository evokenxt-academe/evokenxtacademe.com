"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { extractYoutubeVideoId } from "@/features/live-stream/lib";
import type { LiveStreamSummary } from "@/features/live-stream/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  IconBroadcast,
  IconLoader2,
  IconPlayerStop,
} from "@tabler/icons-react";

type LiveVideoPanelProps = {
  stream: LiveStreamSummary;
  courseName: string;
  wentLive?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export function LiveVideoPanel({
  stream,
  courseName,
  wentLive = false,
  onFullscreenChange,
}: LiveVideoPanelProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isLive = stream.status === "live";
  const isScheduled = stream.status === "scheduled";
  const isEnded = stream.status === "ended";
  const videoId = extractYoutubeVideoId(stream.ytVideoId);
  const shouldAutoplay = isLive || wentLive;
  const playerKey = `${stream.id}-${stream.status}-${videoId || "pending"}${shouldAutoplay ? "-autoplay" : ""}`;
  const mobileLiveLayout = isMobile && isLive && Boolean(videoId);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 shadow-sm",
        mobileLiveLayout && "max-md:rounded-none max-md:border-x-0 max-md:shadow-none",
      )}
    >
      <CardHeader
        className={cn(
          "border-b border-border/60 bg-muted/20 py-3.5 px-4 sm:px-5",
          mobileLiveLayout && "max-md:sr-only",
        )}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {isLive ? (
            <Badge className="gap-1 border-0 bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-600">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </Badge>
          ) : isEnded ? (
            <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-medium">
              Ended
            </Badge>
          ) : null}
          <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">
            {stream.title}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{courseName}</p>
      </CardHeader>

      <CardContent className="p-0">
        {isScheduled ? (
          <div className="relative flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/40 to-muted/10 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <IconBroadcast className="size-7 text-red-600 animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold">
                Waiting for the instructor to go live
              </p>
              <p className="text-sm text-muted-foreground">
                Keep this page open — playback will begin automatically when the
                broadcast starts.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconLoader2 className="size-3.5 animate-spin" />
              Listening for live status…
            </div>
          </div>
        ) : isEnded ? (
          <div className="relative flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <IconPlayerStop className="size-7 text-white/70" />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold text-white">
                This live class has ended
              </p>
              <p className="text-sm text-white/60">
                The broadcast is no longer live. Check your course curriculum for
                the recording once it is published.
              </p>
            </div>
          </div>
        ) : videoId ? (
          <div
            className={cn(
              "relative overflow-hidden bg-black select-none",
              mobileLiveLayout
                ? "aspect-video max-md:aspect-[16/10] max-md:min-h-[52vw]"
                : "aspect-video",
            )}
          >
            {mobileLiveLayout ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/75 to-transparent px-3 py-2.5">
                <Badge className="gap-1 border-0 bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </Badge>
                <span className="truncate text-xs font-medium text-white/90">
                  {stream.title}
                </span>
              </div>
            ) : null}
            <YtcnPlayer
              key={playerKey}
              videoId={videoId}
              autoplay={shouldAutoplay}
              isLive={isLive}
              liveOnly={isLive}
              mobileLiveFullscreen={isLive}
              onFullscreenChange={onFullscreenChange}
              keyboardShortcuts={!isLive}
              className="size-full rounded-none border-0"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted/30 px-6 text-center">
            <div className="max-w-sm space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/70">
                <IconBroadcast />
              </div>
              <p className="text-sm font-medium">
                No YouTube video is attached to this stream yet.
              </p>
              <p className="text-sm text-muted-foreground">
                The instructor will start the broadcast shortly. This page will
                update automatically when the stream goes live.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
