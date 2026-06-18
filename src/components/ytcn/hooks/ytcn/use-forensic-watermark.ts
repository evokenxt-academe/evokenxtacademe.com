"use client";

import { useEffect, useState } from "react";

/** Total cycle length — watermark toggles once per interval. */
const DEFAULT_CYCLE_MS = 30_000;
/** How long the watermark stays visible within each cycle. */
const DEFAULT_VISIBLE_MS = 8_000;

export interface ForensicWatermarkState {
  /** Whether the watermark layer is currently shown. */
  isVisible: boolean;
  /** Rotates through preset positions on each visible phase. */
  positionIndex: number;
}

/**
 * Cycles forensic watermark visibility on a fixed interval.
 * Visible for `visibleMs`, hidden for the remainder of `cycleMs`.
 */
export function useForensicWatermark(
  enabled: boolean,
  cycleMs = DEFAULT_CYCLE_MS,
  visibleMs = DEFAULT_VISIBLE_MS,
): ForensicWatermarkState {
  const [isVisible, setIsVisible] = useState(false);
  const [positionIndex, setPositionIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleTimer: ReturnType<typeof setInterval> | undefined;

    const show = () => {
      setPositionIndex((i) => i + 1);
      setIsVisible(true);
      hideTimer = setTimeout(() => setIsVisible(false), visibleMs);
    };

    show();
    cycleTimer = setInterval(show, cycleMs);

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (cycleTimer) clearInterval(cycleTimer);
    };
  }, [enabled, cycleMs, visibleMs]);

  return { isVisible, positionIndex };
}
