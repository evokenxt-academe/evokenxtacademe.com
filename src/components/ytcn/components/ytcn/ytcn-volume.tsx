"use client";

import { IconVolume, IconVolumeOff, IconVolume2 } from "@tabler/icons-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnVolumeProps {
  /** Current volume level (0–100) */
  volume: number;
  /** Whether audio is currently muted */
  isMuted: boolean;
  /** Called with new volume value (0–100) */
  onVolumeChange: (vol: number) => void;
  /** Toggle mute on/off */
  onToggleMute: () => void;
  /** Whether the device is touch-enabled */
  isTouchDevice?: boolean;
}

/* ================================================================ */
/*  YtcnVolume                                                       */
/* ================================================================ */

/**
 * YtcnVolume — Volume slider with mute toggle.
 *
 * The slider is hidden by default (width: 0) and expands on hover via
 * a CSS transition on the parent group. This matches YouTube's native
 * volume control UX without any JS-driven show/hide state.
 */
export function YtcnVolume({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isTouchDevice,
}: YtcnVolumeProps): React.JSX.Element {
  const VolumeIcon =
    isMuted || volume === 0
      ? IconVolumeOff
      : volume < 50
        ? IconVolume2
        : IconVolume;

  return (
    <div className="group/volume flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleMute();
        }}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-sm p-1 text-white transition-colors hover:bg-white/10 touch-manipulation sm:min-h-0 sm:min-w-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <VolumeIcon className="size-5" />
      </button>
      {/* Volume slider - only visible on desktop, completely hidden on mobile */}
      {!isTouchDevice ? (
        <div className="overflow-hidden transition-[width] duration-200 w-0 group-hover/volume:w-20">
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={([val]) => {
              // Guard for noUncheckedIndexedAccess — val could be undefined
              if (val !== undefined) onVolumeChange(val);
            }}
            className="w-20 cursor-pointer"
            aria-label="Volume"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
