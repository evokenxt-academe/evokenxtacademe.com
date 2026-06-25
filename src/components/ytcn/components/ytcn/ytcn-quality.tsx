"use client";

import { IconAdjustmentsHorizontal, IconLock, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QUALITY_LABELS } from "./types";

/* ================================================================ */
/*  Helpers                                                          */
/* ================================================================ */

/** Quality tiers for badge display */
const HD_QUALITIES = new Set(["hd720", "hd1080", "highres"]);
const FHD_QUALITIES = new Set(["hd1080", "highres"]);

function getQualityBadge(quality: string): string | null {
  if (FHD_QUALITIES.has(quality)) return "FHD";
  if (HD_QUALITIES.has(quality)) return "HD";
  return null;
}

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
 * Shows all available quality levels with HD/FHD badges.
 * When a specific quality is locked (not auto), shows a lock indicator.
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

  // Build the quality list — ensure "auto" is always first
  const qualities = [...availableQualities];
  if (!qualities.includes("auto")) {
    qualities.unshift("auto");
  }

  // Filter out "default" (duplicate of auto) and deduplicate labels
  const seenLabels = new Set<string>();
  const validQualities = qualities.filter((q) => {
    if (q === "default") return false;
    const label = QUALITY_LABELS[q] || q;
    if (seenLabels.has(label)) return false;
    seenLabels.add(label);
    return true;
  });

  if (validQualities.length <= 1) return null;

  const displayLabel = QUALITY_LABELS[currentQuality] || "Auto";
  const isLocked = currentQuality !== "auto" && currentQuality !== "default";

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10",
            isLocked && "text-blue-300"
          )}
          aria-label="Video quality"
          onClick={(e) => e.stopPropagation()}
        >
          <IconAdjustmentsHorizontal className="size-4" />
          <span>{displayLabel}</span>
          {isLocked && <IconLock className="size-2.5 opacity-60" />}
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
          {validQualities.map((q) => {
            const label = QUALITY_LABELS[q] || q;
            const badge = getQualityBadge(q);
            const isActive = currentQuality === q || (q === "auto" && (currentQuality === "auto" || currentQuality === "default"));

            return (
              <button
                key={q}
                onClick={() => onQualityChange(q)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground"
                )}
              >
                {isActive && <IconCheck className="size-3.5 shrink-0" />}
                <span className={cn(!isActive && "pl-5.5")}>{label}</span>
                {badge && (
                  <span className={cn(
                    "ml-auto rounded px-1 py-0.5 text-[10px] font-bold leading-none tracking-wider",
                    badge === "FHD"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
