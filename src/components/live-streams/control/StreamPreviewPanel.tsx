"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStreamDuration } from "@/lib/live-stream/formatters";
import { extractYoutubeVideoId } from "@/features/live-stream/lib";
import type { LiveStreamRow } from "@/types/live-stream";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  IconBrandYoutube,
  IconBroadcast,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Users } from "lucide-react";

type StreamPreviewPanelProps = {
  stream: LiveStreamRow;
  compact?: boolean;
};

export function StreamPreviewPanel({
  stream,
  compact = false,
}: StreamPreviewPanelProps) {
  const [elapsed, setElapsed] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const videoId = extractYoutubeVideoId(stream.yt_video_id);
  const isLive = stream.status === "live";
  const isEnded = stream.status === "ended";
  const isScheduled = stream.status === "scheduled";

  const youtubeWatchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : null;
  const youtubeStudioLiveUrl = videoId
    ? `https://studio.youtube.com/video/${videoId}/livestreaming`
    : null;

  useEffect(() => {
    if (stream.status !== "live" || !stream.started_at) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const start = new Date(stream.started_at!).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [stream.status, stream.started_at]);

  // When stream transitions to live, auto-bump reloadKey to pick up fresh live feed
  useEffect(() => {
    if (isLive) {
      setReloadKey((k) => k + 1);
    }
  }, [isLive]);

  const duration = isLive
    ? formatStreamDuration(elapsed)
    : formatStreamDuration(stream.duration_sec ?? 0);

  const handleReload = useCallback(() => {
    setIsReloading(true);
    setReloadKey((k) => k + 1);
    toast.success("Stream preview reloaded");
    setTimeout(() => {
      setIsReloading(false);
    }, 600);
  }, []);

  const handleCopyWatchLink = useCallback(async () => {
    if (!youtubeWatchUrl) return;
    try {
      await navigator.clipboard.writeText(youtubeWatchUrl);
      setCopied(true);
      toast.success("YouTube stream link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [youtubeWatchUrl]);

  const playerKey = `stream-preview-${stream.id}-${stream.status}-${videoId || "none"}-${reloadKey}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Video Container */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-black shadow-md">
        <div className="relative aspect-video w-full">
          {videoId ? (
            <iframe
              key={playerKey}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`}
              title="YouTube Live Stream Preview"
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center text-muted-foreground">
              <div className="flex size-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
                <IconBrandYoutube className="size-7 text-red-500/70" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">
                  Broadcast not created yet
                </p>
                <p className="max-w-sm text-xs text-zinc-400">
                  Press <strong>Go Live</strong> in the setup panel to automatically
                  create the YouTube live broadcast and start streaming.
                </p>
              </div>
            </div>
          )}

          {/* Top Status Overlay Bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3">
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge className="gap-1.5 border-0 bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm hover:bg-red-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </Badge>
              ) : isEnded ? (
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                >
                  ENDED
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-white/20 bg-black/40 px-2 py-0.5 text-[11px] font-medium text-zinc-300 backdrop-blur-sm"
                >
                  PREVIEW
                </Badge>
              )}

              <span className="rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white/90 backdrop-blur-sm">
                {duration}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isLive && (
                <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                  <Users className="size-3.5 text-red-400" />
                  {stream.concurrent_viewers}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedding Warning Alert if Disabled */}
      {stream.enable_embed === false && videoId && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-2 text-xs">
            <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">
                YouTube embedding is restricted for this stream
              </p>
              <p className="text-[11px] text-muted-foreground">
                If the player shows a restriction message, ensure &quot;Allow
                embedding&quot; is enabled in YouTube Studio, or view directly on
                YouTube.
              </p>
            </div>
          </div>
          {youtubeStudioLiveUrl && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-300"
              asChild
            >
              <a
                href={youtubeStudioLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Studio Settings
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Admin Quick Action Toolbar */}
      {videoId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/60 p-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {youtubeWatchUrl && (
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 bg-red-600 text-xs font-medium text-white shadow-sm hover:bg-red-700"
                asChild
              >
                <a
                  href={youtubeWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandYoutube className="size-4" />
                  Watch on YouTube
                  <IconExternalLink className="size-3 opacity-70" />
                </a>
              </Button>
            )}

            {youtubeStudioLiveUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                asChild
              >
                <a
                  href={youtubeStudioLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBroadcast className="size-3.5 text-red-500" />
                  YouTube Studio Live
                  <IconExternalLink className="size-3 opacity-70" />
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={handleCopyWatchLink}
            >
              {copied ? (
                <>
                  <IconCheck className="size-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <IconCopy className="size-3.5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={handleReload}
              disabled={isReloading}
              title="Refresh stream player"
            >
              <IconRefresh
                className={cn("size-3.5", isReloading && "animate-spin")}
              />
              Reload Stream
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
