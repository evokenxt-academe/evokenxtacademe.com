"use client";

import type {
  LectureWithResources,
} from "@/features/student/types/learn";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";
import { extractYouTubeId } from "./use-youtube-player";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangle } from "@tabler/icons-react";

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
}

// ─── Component ────────────────────────────────────────────────────

export function VideoPlayer({
  lecture,
  onVideoEnded,
  onTimeUpdate,
  initialTimeSeconds,
}: VideoPlayerProps) {
  const videoId = extractYouTubeId(lecture?.yt_video_id ?? null);

  // ── No lecture selected ──
  if (!lecture) {
    return <VideoPlayerSkeleton />;
  }

  // ── No video URL / not a YouTube video ──
  if (!videoId) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
          style={{ aspectRatio: "16/9" }}
        >
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <IconAlertTriangle className="size-10" />
            <p className="text-sm">Video unavailable for this lecture</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <YtcnPlayer
      key={lecture.id}
      videoId={videoId}
      startAt={initialTimeSeconds ?? 0}
      onEnd={onVideoEnded}
      onTimeUpdate={onTimeUpdate}
      className="rounded-lg border border-border"
    />
  );
}

export function VideoPlayerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
