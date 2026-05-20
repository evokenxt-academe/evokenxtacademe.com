"use client";

import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconCircleFilled,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/components/ytcn/lib/ytcn/format";
import type { PlayerState, PlaybackSpeed } from "./types";
import { YtcnProgress } from "./ytcn-progress";
import { YtcnVolume } from "./ytcn-volume";
import { YtcnSpeed } from "./ytcn-speed";
import { YtcnQuality } from "./ytcn-quality";
import { YtcnFullscreen } from "./ytcn-fullscreen";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnControlsProps {
  /** Full player state object */
  state: PlayerState;
  /** Toggle play/pause */
  onTogglePlay: () => void;
  /** Seek to a specific time in seconds */
  onSeek: (seconds: number) => void;
  /** Set volume (0–100) */
  onVolumeChange: (vol: number) => void;
  /** Toggle mute */
  onToggleMute: () => void;
  /** Set playback speed */
  onSpeedChange: (rate: PlaybackSpeed) => void;
  /** Change playback quality */
  onQualityChange: (quality: string) => void;
  /** Toggle fullscreen */
  onToggleFullscreen: () => void;
  /** Seek to live edge (live mode only) */
  onSeekToLive?: () => void;
  /** Whether controls should be visible */
  visible: boolean;
  /**
   * Container ref for portal — ensures dropdown menus render inside the
   * player container for fullscreen visibility.
   */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when settings popover opens or closes */
  onSettingsOpenChange?: (open: boolean) => void;
  /** Called to keep controls visible (e.g. mouse movement over controls) */
  onInteraction?: () => void;
  /** Whether the device is touch-enabled */
  isTouchDevice: boolean;
}

/* ================================================================ */
/*  YtcnControls                                                     */
/* ================================================================ */

/**
 * YtcnControls — Full controls bar with progress, play/pause, volume,
 * speed settings, and fullscreen toggle.
 *
 * Designed to sit at the bottom of the player container with a gradient
 * overlay. Visibility is controlled by the `visible` prop, typically
 * driven by mouse hover or drag state.
 */
export function YtcnControls({
  state,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onQualityChange,
  onToggleFullscreen,
  onSeekToLive,
  visible,
  containerRef,
  onSettingsOpenChange,
  onInteraction,
  isTouchDevice,
}: YtcnControlsProps): React.JSX.Element {
  return (
    <div
      onMouseEnter={onInteraction}
      onMouseMove={onInteraction}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex flex-col transition-opacity duration-300",
        state.isFullscreen || isTouchDevice
          ? visible ? "opacity-100" : "opacity-0 pointer-events-none"
          : "opacity-0 group-hover:opacity-100"
      )}
    >
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Progress bar */}
      <div className="relative z-10 px-3">
        <YtcnProgress
          currentTime={state.currentTime}
          duration={state.duration}
          loadedFraction={state.loadedFraction}
          onSeek={onSeek}
          isLive={state.isLive}
        />
      </div>

      {/* Controls row */}
      <div className="relative z-10 flex items-center gap-1 px-3 pb-2.5 pt-1.5">
        {/* Left group */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="flex items-center justify-center rounded-sm p-1.5 text-white transition-all duration-150 hover:bg-white/10 active:scale-95"
            aria-label={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? (
              <IconPlayerPauseFilled className="size-5" />
            ) : (
              <IconPlayerPlayFilled className="size-5" />
            )}
          </button>

          {/* Volume */}
          <YtcnVolume
            volume={state.volume}
            isMuted={state.isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
            isTouchDevice={isTouchDevice}
          />

          {/* Time display */}
          {!state.isLive ? (
            <span className="ml-1.5 select-none text-xs tabular-nums text-white/80 font-mono">
              {formatTime(state.currentTime)}
              <span className="text-white/50 mx-1">/</span>
              <span className="text-white/70">{formatTime(state.duration)}</span>
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSeekToLive?.();
              }}
              className={cn(
                "ml-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
                state.isAtLiveEdge
                  ? "border-red-400/40 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {state.isAtLiveEdge ? (
                <>
                  <IconCircleFilled className="size-2 animate-pulse text-red-400" />
                  LIVE
                </>
              ) : (
                <>
                  <IconCircleFilled className="size-2 text-white/50" />
                  GO LIVE
                </>
              )}
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right group */}
        <div className="flex items-center gap-0.5">
          <YtcnSpeed
            playbackRate={state.playbackRate}
            onSpeedChange={onSpeedChange}
            containerRef={containerRef}
            onOpenChange={onSettingsOpenChange}
          />
          <YtcnQuality
            currentQuality={state.currentQuality}
            availableQualities={state.availableQualities}
            onQualityChange={onQualityChange}
            containerRef={containerRef}
            onOpenChange={onSettingsOpenChange}
          />

          {/* Fullscreen */}
          <YtcnFullscreen
            isFullscreen={state.isFullscreen}
            onToggle={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
}
