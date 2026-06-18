"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import {
  extractYoutubeVideoId,
  formatLiveDateTime,
} from "@/features/live-stream/lib";
import type { LiveStreamSummary } from "@/features/live-stream/types";
import {
  IconBroadcast,
  IconLoader2,
  IconPlayerPauseFilled,
  IconRefresh,
} from "@tabler/icons-react";

type LiveVideoPanelProps = {
  stream: LiveStreamSummary;
  courseName: string;
};

export function LiveVideoPanel({ stream, courseName }: LiveVideoPanelProps) {
  const isLive = stream.status === "live";
  const isScheduled = stream.status === "scheduled";
  const videoId = extractYoutubeVideoId(stream.ytVideoId ?? "");
  const playerKey = `${stream.id}-${stream.status}-${videoId || "pending"}`;
  const [reloadToken, setReloadToken] = React.useState(0);

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isLive ? "destructive" : isScheduled ? "secondary" : "outline"}
            className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.18em]"
          >
            {isLive ? "Live" : isScheduled ? "Starting soon" : "Ended"}
          </Badge>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
            {courseName}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl leading-tight md:text-2xl">
            {stream.title}
          </CardTitle>
          <CardDescription>
            {isLive
              ? "The broadcast is live now. Watch below and join the class chat."
              : isScheduled
                ? "Your instructor is preparing the broadcast. The player will start automatically when the stream goes live."
                : `This stream ended at ${formatLiveDateTime(stream.endedAt || stream.startedAt)}`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isScheduled ? (
          <div className="relative flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/40 to-muted/10 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <IconBroadcast className="size-7 text-red-600 animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold">Waiting for the instructor to go live</p>
              <p className="text-sm text-muted-foreground">
                Keep this page open — playback will begin automatically when the broadcast starts.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconLoader2 className="size-3.5 animate-spin" />
              Listening for live status…
            </div>
          </div>
        ) : videoId ? (
          <div className="relative aspect-video bg-black">
            <YtcnPlayer
              key={`${playerKey}-${reloadToken}`}
              videoId={videoId}
              autoplay={isLive}
              isLive={isLive}
              className="size-full rounded-none"
            />
            <div className="pointer-events-none absolute left-3 top-3 z-50">
              <Badge
                variant={isLive ? "destructive" : "secondary"}
                className="rounded-full px-2.5 py-0.5 shadow-sm"
              >
                {isLive ? (
                  <>
                    <IconBroadcast data-icon="inline-start" />
                    Live
                  </>
                ) : (
                  <>
                    <IconPlayerPauseFilled data-icon="inline-start" />
                    Recording
                  </>
                )}
              </Badge>
            </div>
            {isLive ? (
              <div className="absolute right-3 top-3 z-50">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  onClick={() => setReloadToken((value) => value + 1)}
                >
                  <IconRefresh className="size-3.5" />
                  Reload stream
                </Button>
              </div>
            ) : null}
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
