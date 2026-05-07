"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/components/ytcn/lib/ytcn/format";
import { useTimeline } from "@/components/ytcn/hooks/ytcn/use-timeline";

export interface YtcnProgressProps {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total video duration in seconds */
  duration: number;
  /** Buffer progress as a fraction from 0 to 1 */
  loadedFraction: number;
  /** Called with the target time in seconds on click or drag */
  onSeek: (seconds: number) => void;
  /** Whether the stream is live */
  isLive?: boolean;
  className?: string;
}

/**
 * YtcnProgress — Timeline scrub bar with hover tooltip, buffer indicator,
 * and drag-to-seek.
 *
 * Memoized because it re-renders on every 250ms poll tick from the player
 * state — memo prevents unnecessary re-renders when only unrelated state
 * changes (like volume or quality) occur.
 */
export const YtcnProgress = memo(function YtcnProgress({
  currentTime,
  duration,
  loadedFraction,
  onSeek,
  isLive = false,
  className,
}: YtcnProgressProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = loadedFraction * 100;

  const { barRef, isDragging, hoverTime, hoverFraction, handlers } = useTimeline({
    duration,
    onSeek,
  });

  return (
    <div
      ref={barRef}
      className={cn(
        "group/progress relative h-1 w-full cursor-pointer transition-[height] hover:h-1.5",
        className
      )}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      onClick={(e) => e.stopPropagation()}
      role="slider"
      aria-valuenow={Math.floor(currentTime)}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-label="Video progress"
      tabIndex={0}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-full bg-white/20" />

      {/* Buffer indicator */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-[width] duration-500"
        style={{ width: `${buffered}%` }}
      />

      {/* Filled progress */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-100",
          isLive ? "bg-green-500" : "bg-primary"
        )}
        style={{ width: `${progress}%` }}
      />

      {/* Scrubber dot — visible on hover */}
      <div
        className={cn(
          "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-background shadow-lg opacity-0 transition-opacity group-hover/progress:opacity-100",
          isLive ? "bg-green-500" : "bg-primary"
        )}
        style={{ left: `${progress}%` }}
      />

      {/* Hover tooltip */}
      {hoverTime !== null && duration > 0 && (
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-background/90 px-1.5 py-0.5 text-xs text-foreground shadow-md pointer-events-none"
          style={{
            left: `${hoverFraction * 100}%`,
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
});
