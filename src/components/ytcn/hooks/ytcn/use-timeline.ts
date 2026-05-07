"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseTimelineOptions {
  /** Total video duration in seconds */
  duration: number;
  /** Called with the target time in seconds on click or drag */
  onSeek: (seconds: number) => void;
}

export interface UseTimelineReturn {
  barRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  hoverTime: number | null;
  hoverFraction: number;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

/**
 * useTimeline — Manages progress bar interaction state.
 *
 * Handles hover position tracking, drag-to-seek with window-level
 * mousemove/mouseup listeners (so dragging works even when cursor leaves
 * the bar), and converts pixel positions to time values.
 *
 * Returns a barRef to attach to the progress bar container, reactive
 * state (isDragging, hoverTime), and event handlers.
 */
export function useTimeline({ duration, onSeek }: UseTimelineOptions): UseTimelineReturn {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverFraction, setHoverFraction] = useState(0);

  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const getFractionFromPosition = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const time = getTimeFromPosition(e.clientX);
      const fraction = getFractionFromPosition(e.clientX);
      setHoverFraction(fraction);
      onSeek(time);
    },
    [getTimeFromPosition, getFractionFromPosition, onSeek]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const time = getTimeFromPosition(e.clientX);
      const fraction = getFractionFromPosition(e.clientX);
      setHoverTime(time);
      setHoverFraction(fraction);
      if (isDragging) {
        onSeek(time);
      }
    },
    [getTimeFromPosition, getFractionFromPosition, isDragging, onSeek]
  );

  const onMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverTime(null);
    }
  }, [isDragging]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      const touch = e.touches[0];
      if (!touch) return;
      const time = getTimeFromPosition(touch.clientX);
      const fraction = getFractionFromPosition(touch.clientX);
      setHoverFraction(fraction);
      onSeek(time);
    },
    [getTimeFromPosition, getFractionFromPosition, onSeek]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Prevent scrolling while dragging the timeline
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (!touch) return;
      const time = getTimeFromPosition(touch.clientX);
      const fraction = getFractionFromPosition(touch.clientX);
      setHoverTime(time);
      setHoverFraction(fraction);
      if (isDragging) {
        onSeek(time);
      }
    },
    [getTimeFromPosition, getFractionFromPosition, isDragging, onSeek]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(false);
      setHoverTime(null);
    },
    []
  );

  // Window-level listeners for drag continuation outside the bar
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const time = getTimeFromPosition(e.clientX);
      const fraction = getFractionFromPosition(e.clientX);
      setHoverTime(time);
      setHoverFraction(fraction);
      onSeek(time);
    };

    const handleUp = () => {
      setIsDragging(false);
      setHoverTime(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, getTimeFromPosition, getFractionFromPosition, onSeek]);

  return {
    barRef,
    isDragging,
    hoverTime,
    hoverFraction,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
