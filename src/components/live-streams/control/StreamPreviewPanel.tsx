"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ViewerChart } from "./ViewerChart";
import { formatStreamDuration } from "@/lib/live-stream/formatters";
import type { LiveStreamRow } from "@/types/live-stream";
import { IconBrandYoutube } from "@tabler/icons-react";
import { Users } from "lucide-react";

type StreamPreviewPanelProps = {
  stream: LiveStreamRow;
  compact?: boolean;
};

export function StreamPreviewPanel({ stream, compact = false }: StreamPreviewPanelProps) {
  const [elapsed, setElapsed] = useState(0);

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

  const showChart = stream.status === "live" || (stream.duration_sec ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
        <div className="relative aspect-video">
          {stream.yt_video_id ? (
            <iframe
              className="absolute inset-0 size-full"
              src={`https://www.youtube.com/embed/${stream.yt_video_id}?autoplay=0`}
              title={stream.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <IconBrandYoutube className="size-10 opacity-40" />
              <p className="text-sm">Preview available after broadcast is created</p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              {stream.status === "live" && (
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

      {showChart && !compact && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Viewers
          </p>
          <ViewerChart streamId={stream.id} isLive={stream.status === "live"} />
        </div>
      )}
    </div>
  );
}
