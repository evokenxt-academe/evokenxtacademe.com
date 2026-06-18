"use client";

import { cn } from "@/lib/utils";
import { useForensicWatermark } from "@/components/ytcn/hooks/ytcn/use-forensic-watermark";

/* ================================================================ */
/*  Position presets — rotate each cycle to resist simple cropping   */
/* ================================================================ */

const POSITION_CLASSES = [
  "top-[12%] left-[6%]",
  "top-[14%] right-[6%]",
  "top-[42%] left-[8%]",
  "top-[38%] right-[8%]",
  "bottom-[22%] left-[6%]",
  "bottom-[24%] right-[6%]",
] as const;

const SCATTER_OFFSETS = [
  { top: "18%", left: "52%" },
  { top: "62%", left: "28%" },
  { top: "72%", left: "58%" },
] as const;

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface VideoForensicWatermarkProps {
  userId: string;
  /** When false, nothing is rendered. */
  enabled?: boolean;
  /** Full cycle length in ms (default 30s). */
  cycleMs?: number;
  /** Visible duration within each cycle in ms (default 8s). */
  visibleMs?: number;
  className?: string;
}

/* ================================================================ */
/*  VideoForensicWatermark                                           */
/* ================================================================ */

/**
 * Forensic viewer watermark for course video protection.
 * Appears briefly on a 30s cycle with rotating placement so leaked
 * recordings can be traced back to the licensed viewer.
 */
export function VideoForensicWatermark({
  userId,
  enabled = true,
  cycleMs = 30_000,
  visibleMs = 8_000,
  className,
}: VideoForensicWatermarkProps): React.JSX.Element | null {
  const { isVisible, positionIndex } = useForensicWatermark(
    enabled,
    cycleMs,
    visibleMs,
  );

  if (!enabled || !userId) return null;

  const primaryPosition =
    POSITION_CLASSES[positionIndex % POSITION_CLASSES.length];
  const shortId = userId.slice(0, 8).toUpperCase();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[26] overflow-hidden",
        "transition-opacity duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-hidden="true"
      data-forensic-watermark={isVisible ? "visible" : "hidden"}
    >
      {/* Diagonal trace grid — visible only during active phase */}
      <div className="absolute inset-0 opacity-[0.12]">
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => (
            <span
              key={`${row}-${col}`}
              className="absolute whitespace-nowrap font-mono text-[10px] tracking-wider text-white sm:text-[11px]"
              style={{
                top: `${8 + row * 18}%`,
                left: `${-4 + col * 38}%`,
                transform: "rotate(-24deg)",
              }}
            >
               {userId}
            </span>
          )),
        )}
      </div>

      {/* Primary badge — rotates corner each cycle */}
      <div
        className={cn(
          "absolute max-w-[min(92%,320px)]",
          primaryPosition,
        )}
      >
        <div
          className={cn(
            "bg-black/55 px-1",
          )}
        >
       
          <p className="mt-0.5 truncate font-mono text-[8px] font-semibold tabular-nums text-white sm:text-xs">
            {userId}
          </p>
        </div>
      </div>

    </div>
  );
}
