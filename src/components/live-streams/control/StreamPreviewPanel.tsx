"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatStreamDuration } from "@/lib/live-stream/formatters";
import { extractYoutubeVideoId } from "@/features/live-stream/lib";
import type { LiveStreamRow } from "@/types/live-stream";

import { IconBrandYoutube } from "@tabler/icons-react";
import { Users } from "lucide-react";

type StreamPreviewPanelProps = {
  stream: LiveStreamRow;
  compact?: boolean;
};

export function StreamPreviewPanel({ stream, compact = false }: StreamPreviewPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const videoId = extractYoutubeVideoId(stream.yt_video_id);
  const isLive = stream.status === "live";

  useEffect(() => {
    if (stream.status !== "live" || !stream.started_at) return;

    const tick = () => {
      const start = new Date(stream.started_at!).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [stream.status, stream.started_at]);

  const duration =
    stream.status === "live"
      ? formatStreamDuration(elapsed)
      : formatStreamDuration(stream.duration_sec);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
        <div className="relative aspect-video">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
              title="YouTube stream preview"
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <IconBrandYoutube className="size-10 opacity-40" />
              <p className="text-sm">Preview available after broadcast is created</p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              {isLive && (
                <Badge className="gap-1 border-0 bg-red-600 text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </Badge>
              )}
              <span className="text-xs font-medium text-white/90 tabular-nums">
                {duration}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Users className="size-3.5" />
              {stream.concurrent_viewers}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
