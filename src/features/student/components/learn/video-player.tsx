"use client";

import type {
  LectureWithResources,
} from "@/features/student/types/learn";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { extractYouTubeId } from "./use-youtube-player";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangle, IconVideoOff } from "@tabler/icons-react";

// ─── Props ────────────────────────────────────────────────────────

interface VideoPlayerProps {
  lecture: LectureWithResources | null;
  isCompleted: boolean;
  isMarkingComplete: boolean;
  onMarkComplete: () => void;
  onVideoEnded: () => void;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  sectionTitle: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTimeSeconds?: number | null;
  autoplay?: boolean;
}

// ─── Component ────────────────────────────────────────────────────

export function VideoPlayer({
  lecture,
  onVideoEnded,
  onTimeUpdate,
  initialTimeSeconds,
  autoplay = true,
}: VideoPlayerProps) {
  const videoId = extractYouTubeId(lecture?.yt_video_id ?? null);

  // ── No lecture selected ──
  if (!lecture) {
    return <VideoPlayerSkeleton />;
  }

  // ── No video URL / not a YouTube video ──
  if (!videoId) {
    return (
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-muted/20 backdrop-blur-xs shadow-xs" style={{ aspectRatio: "16/9" }}>
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20 animate-pulse">
            <IconVideoOff className="size-6" stroke={2} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Video Unavailable</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">This lecture doesn't have an associated video or the link is invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-xs transition-shadow duration-300 hover:shadow-md bg-black">
      <YtcnPlayer
        key={lecture.id}
        videoId={videoId}
        autoplay={autoplay}
        startAt={initialTimeSeconds ?? 0}
        onEnd={onVideoEnded}
        onTimeUpdate={onTimeUpdate}
        className="w-full aspect-video border-0"
      />
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded-sm" />
        <Skeleton className="h-7 w-3/4 rounded-sm" />
        <Skeleton className="h-4 w-full rounded-sm" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
