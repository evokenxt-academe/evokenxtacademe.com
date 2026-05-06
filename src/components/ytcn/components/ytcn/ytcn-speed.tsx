"use client";

import { IconSettings } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PlaybackSpeed } from "./types";
import { PLAYBACK_SPEEDS } from "./types";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnSpeedProps {
  /** Current playback rate */
  playbackRate: number;
  /** Called with the new speed value */
  onSpeedChange: (rate: PlaybackSpeed) => void;
  /**
   * Portal container for fullscreen visibility.
   * Pass containerRef.current to ensure the popover renders inside
   * the fullscreen element rather than document.body.
   */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when the popover opens or closes — used to keep controls visible */
  onOpenChange?: (open: boolean) => void;
}

/* ================================================================ */
/*  YtcnSpeed                                                        */
/* ================================================================ */

/**
 * YtcnSpeed — Playback speed picker using Radix Popover.
 *
 * Portaled into the player container (via containerRef) so it remains
 * visible in fullscreen mode. Without this, the popover would be
 * appended to document.body and become invisible when the player
 * enters fullscreen.
 */
export function YtcnSpeed({
  playbackRate,
  onSpeedChange,
  containerRef,
  onOpenChange,
}: YtcnSpeedProps): React.JSX.Element {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-0.5 rounded-sm px-1.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Playback speed"
          onClick={(e) => e.stopPropagation()}
        >
          <IconSettings className="size-4" />
          <span>{playbackRate}x</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto border-border/50 bg-card/95 p-1 backdrop-blur-md"
        container={containerRef?.current ?? undefined}
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
