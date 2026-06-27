"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  formatTime,
  isValidStreamTime,
  sanitizeStreamTime,
} from "@/components/ytcn/lib/ytcn/format";
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
  /** Whether playback is at the live edge */
  isAtLiveEdge?: boolean;
  className?: string;
}

export const YtcnProgress = memo(function YtcnProgress({
  currentTime,
  duration,
  loadedFraction,
  onSeek,
  isLive = false,
  isAtLiveEdge = false,
  className,
}: YtcnProgressProps) {
  const safeDuration = sanitizeStreamTime(duration);
  const safeCurrent = sanitizeStreamTime(currentTime, safeDuration);

  const progress = isLive
    ? safeDuration > 0
      ? Math.min(100, (safeCurrent / safeDuration) * 100)
      : isAtLiveEdge
        ? 100
        : 0
    : safeDuration > 0
      ? Math.min(100, (safeCurrent / safeDuration) * 100)
      : 0;

  const buffered = Math.min(100, loadedFraction * 100);

  const { barRef, hoverTime, hoverFraction, handlers } = useTimeline({
    duration: safeDuration,
    onSeek,
    clickOnly: isLive,
  });

  const tooltipLabel = (() => {
    if (hoverTime === null) return null;
    if (isLive && hoverFraction >= 0.95) return "Live";
    if (!isValidStreamTime(hoverTime)) return null;
    return formatTime(hoverTime);
  })();

  return (
    <div className="relative pt-1">
      {isLive && safeDuration > 0 ? (
        <div className="pointer-events-none mb-1 flex justify-end px-0.5">
          <span className="text-[10px] tabular-nums text-white/60">
            {formatTime(safeDuration)}
          </span>
        </div>
      ) : null}

      <div
        ref={barRef}
        className={cn(
          "group/progress relative h-1 w-full cursor-pointer transition-[height] hover:h-1.5",
          className,
        )}
        onMouseDown={handlers.onMouseDown}
        onMouseMove={handlers.onMouseMove}
        onMouseLeave={handlers.onMouseLeave}
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        role="slider"
        aria-valuenow={Math.floor(safeCurrent)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(safeDuration)}
        aria-label={isLive ? "Live stream progress" : "Video progress"}
        tabIndex={0}
      >
        <div className="absolute inset-0 rounded-full bg-white/20" />

        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-[width] duration-500"
          style={{ width: `${buffered}%` }}
        />

        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-150",
            isLive ? "bg-emerald-400" : "bg-primary",
          )}
          style={{ width: `${progress}%` }}
        />

        {isLive ? (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 size-2 rounded-full border border-black/20 shadow-sm transition-opacity",
              isAtLiveEdge
                ? "right-0 translate-x-0 bg-red-500 opacity-100 animate-pulse"
                : "right-0 translate-x-0 bg-red-500/80 opacity-80",
            )}
            aria-hidden="true"
          />
        ) : (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-background bg-primary opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100"
            style={{ left: `${progress}%` }}
          />
        )}

        {tooltipLabel ? (
          <div
            className="absolute -top-8 -translate-x-1/2 rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-medium text-white shadow-md pointer-events-none"
            style={{ left: `${hoverFraction * 100}%` }}
          >
            {tooltipLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
});
