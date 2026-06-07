"use client";

import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QUALITY_LABELS } from "./types";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnQualityProps {
  /** Currently active quality */
  currentQuality: string;
  /** Available qualities from YouTube API */
  availableQualities: string[];
  /** Called with the new quality value */
  onQualityChange: (quality: string) => void;
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
/*  YtcnQuality                                                      */
/* ================================================================ */

/**
 * YtcnQuality — Playback quality picker using Radix Popover.
 *
 * Automatically maps internal YouTube strings (e.g., 'hd720') to
 * human-readable labels (e.g., '720p'). If 'auto' is not in the list,
 * it is prepended.
 */
export function YtcnQuality({
  currentQuality,
  availableQualities,
  onQualityChange,
  containerRef,
  onOpenChange,
}: YtcnQualityProps): React.JSX.Element | null {
  // Guard: Don't render if no qualities are available
  if (!availableQualities || availableQualities.length === 0) return null;

  // Ensure "auto" is always available
  const qualities = [...availableQualities];
  if (!qualities.includes("auto")) {
    qualities.unshift("auto");
  }

  // Filter to only show 1080p and auto
  const validQualities = qualities.filter((q) => {
    const label = QUALITY_LABELS[q];
    return label === "1080p" || label === "auto";
  });
  
  if (validQualities.length <= 1) return null; // No need for a selector if only 1 option

  const displayLabel = QUALITY_LABELS[currentQuality] || "Auto";

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Video quality"
          onClick={(e) => e.stopPropagation()}
        >
          <IconAdjustmentsHorizontal className="size-4" />
          <span>{displayLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto border-border/50 bg-card/95 p-1 backdrop-blur-md"
        container={containerRef?.current ?? undefined}
      >
        <div className="flex flex-col gap-0.5">
          <p className="px-2 py-1 text-xs text-muted-foreground">Quality</p>
          {validQualities.map((q) => (
            <button
              key={q}
              onClick={() => onQualityChange(q)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                currentQuality === q
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground"
              )}
            >
              {QUALITY_LABELS[q]}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
