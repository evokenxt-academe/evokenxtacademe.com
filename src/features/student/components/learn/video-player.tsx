"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LectureWithResources,
  ProgressMap,
} from "@/features/student/types/learn";
import type { PlaybackSpeed } from "./video-controls";
import { VideoControls } from "./video-controls";
import { useYouTubePlayer, extractYouTubeId } from "./use-youtube-player";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangle, IconPlayerPlayFilled } from "@tabler/icons-react";

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
  isCompleted,
  isMarkingComplete,
  onMarkComplete,
  onVideoEnded,
  onPrevious,
  onNext,
  sectionTitle,
  onTimeUpdate,
  initialTimeSeconds,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerId = "yt-player-container";

  const videoId = lecture?.yt_video_id ?? null;

  const {
    state,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    setPlaybackRate,
  } = useYouTubePlayer({
    containerId: playerContainerId,
    videoId,
    onVideoEnd: onVideoEnded,
    onTimeUpdate,
  });

  // Initial seek (deep links / resume)
  useEffect(() => {
    if (!state.isReady) return;
    if (typeof initialTimeSeconds === "number" && initialTimeSeconds > 0) {
      seekTo(initialTimeSeconds);
    }
  }, [initialTimeSeconds, seekTo, state.isReady]);

  // ── Controls visibility (auto-hide) ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (state.isPlaying) setControlsVisible(false);
    }, 3000);
  }, [state.isPlaying]);

  useEffect(() => {
    if (!state.isPlaying) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [state.isPlaying]);

  // ── Fullscreen ──
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const elem = containerRef.current;
    if (!elem) return;
    try {
      if (!document.fullscreenElement) {
        await elem.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Keyboard controls ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if the player area is relevant
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          showControls();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekTo(Math.max(0, state.currentTime - 10));
          showControls();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekTo(Math.min(state.duration, state.currentTime + 10));
          showControls();
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(100, state.volume + 5));
          showControls();
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 5));
          showControls();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          showControls();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekTo, setVolume, toggleMute, toggleFullscreen, showControls, state.currentTime, state.duration, state.volume]);

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
    <div className="flex flex-col gap-0">
      {/* Video container */}
      <div
        ref={containerRef}
        className={cn(
          "group relative w-full overflow-hidden bg-black",
          isFullscreen ? "rounded-none" : "rounded-lg border border-border"
        )}
        style={{ aspectRatio: "16/9" }}
        onMouseMove={showControls}
        onMouseEnter={showControls}
        tabIndex={0}
      >
        {/* YouTube player container */}
        <div id={playerContainerId} className="absolute inset-0 z-0" />

        {/* Clickable overlay for play/pause */}
        <button
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          onClick={() => {
            togglePlay();
            showControls();
          }}
          aria-label={state.isPlaying ? "Pause video" : "Play video"}
        />

        {/* Center play button when paused */}
        {!state.isPlaying && state.isReady && !state.isBuffering && (
          <div className="pointer-events-none absolute inset-0 z-15 flex items-center justify-center">
            <div className="rounded-full bg-black/50 p-4 backdrop-blur-sm">
              <IconPlayerPlayFilled className="size-10 text-white" />
            </div>
          </div>
        )}

        {/* Buffering spinner */}
        {state.isBuffering && (
          <div className="pointer-events-none absolute inset-0 z-15 flex items-center justify-center">
            <div className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        )}

        {/* Loading before player ready */}
        {!state.isReady && !state.hasError && (
          <div className="absolute inset-0 z-5 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-sm text-muted-foreground">Loading video…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {state.hasError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <IconAlertTriangle className="size-10" />
              <p className="text-sm font-medium">Failed to load video</p>
              <p className="text-xs">Please check your connection and try again</p>
            </div>
          </div>
        )}

        {/* Custom controls overlay */}
        <VideoControls
          state={state}
          onTogglePlay={() => {
            togglePlay();
            showControls();
          }}
          onSeek={(s) => {
            seekTo(s);
            showControls();
          }}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onSpeedChange={(rate) => setPlaybackRate(rate as PlaybackSpeed)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          visible={controlsVisible && state.isReady}
        />
      </div>
    </div>
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
