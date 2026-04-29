"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildYoutubeEmbedUrl,
  formatLiveDateTime,
} from "@/features/live-stream/lib";
import type { LiveStreamSummary } from "@/features/live-stream/types";
import { IconBroadcast, IconPlayerPauseFilled } from "@tabler/icons-react";

type LiveVideoPanelProps = {
  stream: LiveStreamSummary;
  courseName: string;
};

export function LiveVideoPanel({ stream, courseName }: LiveVideoPanelProps) {
  const isLive = stream.status === "live";

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isLive ? "destructive" : "outline"}
            className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.18em]"
          >
            {isLive ? "Live" : "Ended"}
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
              ? "The broadcast is live now. Students can watch and chat in real time."
              : `This stream ended at ${formatLiveDateTime(stream.endedAt || stream.startedAt)}`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {stream.ytVideoId ? (
          <div className="relative aspect-video bg-black">
            <iframe
              className="absolute inset-0 size-full"
              src={buildYoutubeEmbedUrl(stream.ytVideoId)}
              title={stream.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <div className="pointer-events-none absolute left-3 top-3">
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
                    Stream ended
                  </>
                )}
              </Badge>
            </div>
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
                Add a YouTube Live URL or video ID in the admin panel, then
                start the stream.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
