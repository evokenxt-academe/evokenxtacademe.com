"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useYtcnPlayer } from "@/components/ytcn/hooks/ytcn/use-ytcn-player";
import { useKeyboardShortcuts } from "@/components/ytcn/hooks/ytcn/use-keyboard-shortcuts";
import { useThumbnail } from "@/components/ytcn/hooks/ytcn/use-thumbnail";
import type {
  YtcnPlayerOptions,
  KeyboardBindings,
} from "./types";
import { YtcnControls } from "./ytcn-controls";
import { useIdleControls } from "@/components/ytcn/hooks/ytcn/use-idle-controls";
import { IconPlayerPlayFilled, IconLoader2 } from "@tabler/icons-react";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnPlayerProps extends Omit<YtcnPlayerOptions, "thumbnailFailed"> {
  /** Enable built-in keyboard shortcuts (default: true) */
  keyboardShortcuts?: boolean;
  /** Override default keyboard bindings */
  keyboardBindings?: KeyboardBindings;
  /** Additional CSS class for the outer container */
  className?: string;
}

/* ================================================================ */
/*  YtcnPlayer                                                       */
/* ================================================================ */

/**
 * YtcnPlayer — Top-level composed YouTube player with thumbnail-first loading.
 *
 * Phase lifecycle:
 *   1. "thumbnail" — Shows CDN thumbnail instantly, zero iframe loaded.
 *   2. "loading"   — Thumbnail stays visible, iframe initializing in background.
 *   3. "ready"     — Video playing, thumbnail fades out, controls shown.
 *
 * For full customisation, use the `useYtcnPlayer` hook directly and
 * compose your own UI.
 */
export function YtcnPlayer({
  videoId,
  autoplay = false,
  isLive = false,
  defaultSpeed = 1,
  startAt = 0,
  onEnd,
  onTimeUpdate,
  onPlaybackRateChange,
  keyboardShortcuts = true,
  keyboardBindings,
  className,
}: YtcnPlayerProps): React.JSX.Element {
  // ── Thumbnail probe — tries CDN URLs in priority order ──
  const { thumbnailUrl, thumbnailLoaded, thumbnailFailed } = useThumbnail(videoId);

  // ── Core player hook ──
  const { containerRef, playerDivRef, state, controls } = useYtcnPlayer({
    videoId,
    autoplay,
    isLive,
    defaultSpeed,
    startAt,
    onEnd,
    onTimeUpdate,
    onPlaybackRateChange,
    thumbnailFailed,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { controlsVisible, showControls } = useIdleControls({
    isPlaying: state.isPlaying,
    isFullscreen: state.isFullscreen,
    isSettingsOpen,
  });

  // Controls visibility — handled by useIdleControls and group-hover
  const [isHovering, setIsHovering] = useState(false);

  // Keyboard shortcuts — only active during "ready" phase
  useKeyboardShortcuts({
    enabled: keyboardShortcuts && state.phase === "ready",
    onPlay: controls.togglePlay,
    onMute: controls.toggleMute,
    onFullscreen: controls.toggleFullscreen,
    onSeekBack: () => {
      if (!state.isLive) controls.seekRelative(-10);
    },
    onSeekForward: () => {
      if (!state.isLive) controls.seekRelative(10);
    },
    bindings: keyboardBindings,
  });

  // ── Delayed thumbnail unmount — wait for fade before removing from DOM ──
  const [thumbnailMounted, setThumbnailMounted] = useState(true);

  useEffect(() => {
    if (state.phase === "ready") {
      // Wait for fade transition (500ms) + buffer before unmounting
      const t = setTimeout(() => setThumbnailMounted(false), 600);
      return () => clearTimeout(t);
    } else {
      setThumbnailMounted(true);
    }
  }, [state.phase]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Video player"
      className={cn(
        "relative w-full bg-black select-none overflow-hidden",
        state.isFullscreen && !controlsVisible && "cursor-none",
        state.isFullscreen
          ? "fixed inset-0 z-50"
          : "aspect-video rounded-lg group",
        className
      )}
      onMouseEnter={() => {
        setIsHovering(true);
        showControls();
      }}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => {
        if (!isHovering) setIsHovering(true);
        showControls();
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════
       *  z-0 — YouTube iframe (only mounted when phase !== "thumbnail")
       *
       *  No iframe exists during thumbnail phase. Zero YouTube JS loaded.
       *  This prevents any branding from appearing before user intent.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase !== "thumbnail" && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div ref={playerDivRef} className="w-full h-full" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-10 — Black cover (blocks YouTube branding during loading)
       *
       *  Sits above iframe during "loading" phase to prevent any flash
       *  of YouTube's red play button or watermark.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "loading" && (
        <div className="absolute inset-0 z-10 bg-black" aria-hidden="true" />
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-20 — Thumbnail (visible in thumbnail + loading, fades in ready)
       *
       *  The thumbnail image stays on screen while the iframe loads behind
       *  it. When phase becomes "ready", opacity transitions to 0 over
       *  500ms, creating a seamless reveal of the already-playing video.
       * ═══════════════════════════════════════════════════════════════ */}
      {thumbnailMounted && thumbnailUrl && (
        <div
          className={cn(
            "absolute inset-0 z-20 transition-opacity duration-500",
            state.phase === "ready" ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            aria-hidden="true"
          />
          {/* Subtle dark gradient at bottom so spinner is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-20 — Pulsing placeholder while thumbnail image fetches
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "thumbnail" && !thumbnailLoaded && !thumbnailFailed && (
        <div className="absolute inset-0 z-20 bg-muted animate-pulse" />
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-40 — Loading spinner (shown during thumbnail + loading phases)
       *
       *  Visible in both "thumbnail" (while thumbnail fetches) and "loading"
       *  (while iframe initializes). pointer-events-none so clicks pass
       *  through to the play button below.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "loading" && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          aria-label="Loading video"
        >
          <IconLoader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-40 — Thumbnail play button (thumbnail phase only)
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "thumbnail" && thumbnailLoaded && (
        <button
          onClick={controls.handleThumbnailClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            controls.handleThumbnailClick();
          }}
          className="absolute inset-0 z-40 flex items-center justify-center group/play bg-transparent border-0 cursor-pointer touch-manipulation"
          aria-label="Play video"
        >
          <div
            className={cn(
              "flex items-center justify-center",
              "h-16 w-16 rounded-full",
              "bg-black/60 text-white",
              "transition-transform duration-200",
              "group-hover/play:scale-110"
            )}
          >
            <IconPlayerPlayFilled className="h-8 w-8 translate-x-0.5" fill="currentColor" />
          </div>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-[25] + z-30 — Click overlay + Controls (ready phase only)
       *
       *  Only rendered once the video is playing. The click overlay
       *  intercepts clicks for play/pause. Controls bar sits at bottom.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "ready" && (
        <>
          <div
            className="absolute inset-0 z-[25] cursor-pointer touch-manipulation"
            onClick={controls.togglePlay}
            onTouchEnd={(e) => {
              e.preventDefault();
              controls.togglePlay();
            }}
            aria-label="Toggle playback"
            role="button"
            tabIndex={-1}
          />
          <YtcnControls
            state={state}
            onTogglePlay={controls.togglePlay}
            onSeek={controls.seekTo}
            onVolumeChange={controls.setVolume}
            onToggleMute={controls.toggleMute}
            onSpeedChange={controls.setSpeed}
            onQualityChange={controls.setQuality}
            onToggleFullscreen={controls.toggleFullscreen}
            onSeekToLive={controls.seekToLive}
            visible={controlsVisible}
            containerRef={containerRef}
            onSettingsOpenChange={setIsSettingsOpen}
            onInteraction={showControls}
          />
        </>
      )}
    </div>
  );
}
