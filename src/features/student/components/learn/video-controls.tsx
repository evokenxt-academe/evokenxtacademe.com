"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { PlayerState } from "./use-youtube-player";
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconVolume,
  IconVolumeOff,
  IconVolume2,
  IconMaximize,
  IconMinimize,
  IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Playback Speed ───────────────────────────────────────────────

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

// ─── Time formatting ──────────────────────────────────────────────

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

const ProgressBar = memo(function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      onSeek(getTimeFromPosition(e.clientX));
    },
    [getTimeFromPosition, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const time = getTimeFromPosition(e.clientX);
      setHoverTime(time);
      if (isDragging) onSeek(time);
    },
    [getTimeFromPosition, isDragging, onSeek]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [isDragging]);

  return (
    <div
      ref={barRef}
      className="group/progress relative h-1 w-full cursor-pointer transition-[height] hover:h-1.5"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTime(null)}
      role="slider"
      aria-valuenow={Math.floor(currentTime)}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-label="Video progress"
      tabIndex={0}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-full bg-white/20" />
      {/* Filled progress */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
      {/* Scrubber dot */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full bg-primary opacity-0 transition-opacity group-hover/progress:opacity-100"
        style={{ left: `${progress}%` }}
      />
      {/* Hover tooltip */}
      {hoverTime !== null && duration > 0 && (
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground shadow-md"
          style={{ left: `${(hoverTime / duration) * 100}%` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
});

// ─── Volume Control ───────────────────────────────────────────────

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }: VolumeControlProps) {
  const VolumeIcon = isMuted || volume === 0
    ? IconVolumeOff
    : volume < 50
      ? IconVolume2
      : IconVolume;

  return (
    <div className="group/volume flex items-center gap-1">
      <button
        onClick={onToggleMute}
        className="flex items-center justify-center rounded-sm p-1 text-white transition-colors hover:bg-white/10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <VolumeIcon className="size-5" />
      </button>
      <div className="w-0 overflow-hidden transition-[width] duration-200 group-hover/volume:w-20">
        <Slider
          value={[isMuted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={([val]) => onVolumeChange(val)}
          className="w-20"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

// ─── Speed Control ────────────────────────────────────────────────

interface SpeedControlProps {
  playbackRate: number;
  onSpeedChange: (rate: PlaybackSpeed) => void;
}

function SpeedControl({ playbackRate, onSpeedChange }: SpeedControlProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-0.5 rounded-sm px-1.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Playback speed"
        >
          <IconSettings className="size-4" />
          <span>{playbackRate}x</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto border-border/50 bg-card/95 p-1 backdrop-blur-md"
      >
        <div className="flex flex-col gap-0.5">
          <p className="px-2 py-1 text-xs text-muted-foreground">Speed</p>
          {PLAYBACK_SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                playbackRate === speed
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground"
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Controls ────────────────────────────────────────────────

interface VideoControlsProps {
  state: PlayerState;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (rate: PlaybackSpeed) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  visible: boolean;
}

export function VideoControls({
  state,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleFullscreen,
  isFullscreen,
  visible,
}: VideoControlsProps) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Progress bar */}
      <div className="relative z-10 px-3">
        <ProgressBar currentTime={state.currentTime} duration={state.duration} onSeek={onSeek} />
      </div>

      {/* Controls row */}
      <div className="relative z-10 flex items-center gap-1 px-3 pb-2.5 pt-1.5">
        {/* Left group */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center rounded-sm p-1.5 text-white transition-colors hover:bg-white/10"
            aria-label={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? (
              <IconPlayerPauseFilled className="size-5" />
            ) : (
              <IconPlayerPlayFilled className="size-5" />
            )}
          </button>

          {/* Volume */}
          <VolumeControl
            volume={state.volume}
            isMuted={state.isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />

          {/* Time display */}
          <span className="ml-1.5 select-none text-xs tabular-nums text-white/80">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right group */}
        <div className="flex items-center gap-0.5">
          <SpeedControl playbackRate={state.playbackRate} onSpeedChange={onSpeedChange} />
          <button
            onClick={onToggleFullscreen}
            className="flex items-center justify-center rounded-sm p-1.5 text-white transition-colors hover:bg-white/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IconMinimize className="size-5" /> : <IconMaximize className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
