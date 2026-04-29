"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useYouTubePlayer, extractYouTubeId } from "../hooks";
import { VideoControls } from "./video-controls";
import type { PlaybackSpeed, FlatLecture } from "../types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlertTriangle, IconPlayerPlayFilled } from "@tabler/icons-react";

// ─── Props ────────────────────────────────────────────────────────

interface VideoPlayerProps {
  lecture: FlatLecture | null;
  onVideoEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
}

// ─── Component ────────────────────────────────────────────────────

export function VideoPlayer({
  lecture,
  onVideoEnd,
  onTimeUpdate,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerId = "yt-player-container";

  const videoId = extractYouTubeId(lecture?.video_url ?? null);

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
    onVideoEnd,
    onTimeUpdate,
  });

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

  // Show controls when video is paused
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
      // Only handle if the player container is focused or in fullscreen
      if (
        !containerRef.current?.contains(document.activeElement) &&
        !document.fullscreenElement
      )
        return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekTo(Math.max(0, state.currentTime - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekTo(Math.min(state.duration, state.currentTime + 10));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(100, state.volume + 5));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 5));
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekTo, setVolume, toggleMute, toggleFullscreen, state.currentTime, state.duration, state.volume]);

  // ── Loading / Error states ──
  if (!lecture) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: "16/9" }}>
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a lecture to begin
          </p>
        </div>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio: "16/9" }}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <IconAlertTriangle className="size-10" />
          <p className="text-sm">Video unavailable for this lecture</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg bg-black",
        isFullscreen && "rounded-none"
      )}
      style={{ aspectRatio: "16/9" }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      tabIndex={0}
    >
      {/* YouTube player container */}
      <div
        id={playerContainerId}
        className="absolute inset-0 z-0"
      />

      {/* Clickable overlay for play/pause (only the center area) */}
      <button
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        onClick={togglePlay}
        aria-label={state.isPlaying ? "Pause video" : "Play video"}
      />

      {/* Center play button when not playing and controls visible */}
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

      {/* Loading skeleton before player ready */}
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
            <p className="text-sm font-medium">
              Failed to load video
            </p>
            <p className="text-xs">
              Please check your connection and try again
            </p>
          </div>
        </div>
      )}

      {/* Custom controls overlay */}
      <VideoControls
        state={state}
        onTogglePlay={togglePlay}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onSpeedChange={(rate) => setPlaybackRate(rate as PlaybackSpeed)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        visible={controlsVisible && state.isReady}
      />
    </div>
  );
}
