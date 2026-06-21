"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseIdleControlsOptions {
  /** Whether the video is currently playing */
  isPlaying: boolean;
  /** Whether the player is in fullscreen mode */
  isFullscreen: boolean;
  /** Whether a settings popover/dropdown is open */
  isSettingsOpen: boolean;
}

export interface UseIdleControlsReturn {
  /** Whether controls should be visible */
  controlsVisible: boolean;
  /** Call to reset the idle timer and show controls */
  showControls: () => void;
  /** Call to toggle controls visibility manually */
  toggleControls: () => void;
}

/* ================================================================ */
/*  useIdleControls                                                  */
/* ================================================================ */

/**
 * useIdleControls — Auto-hides controls after 3s of inactivity.
 *
 * Rules:
 *   - Controls never hide when paused
 *   - Controls never hide when a popover/dropdown is open
 *   - Calling showControls() resets the 3s timer
 *   - Calling toggleControls() toggles visibility and manages the timer
 */
export function useIdleControls({
  isPlaying,
  isFullscreen, // Accepted for backward compatibility
  isSettingsOpen,
}: UseIdleControlsOptions): UseIdleControlsReturn {
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    // Auto-hide controls when playing and settings are closed
    if (isPlaying && !isSettingsOpen) {
      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, isSettingsOpen]);

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      const next = !prev;
      if (timerRef.current) clearTimeout(timerRef.current);

      if (next && isPlaying && !isSettingsOpen) {
        timerRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
      return next;
    });
  }, [isPlaying, isSettingsOpen]);

  // Reset timer when play state / settings changes
  useEffect(() => {
    showControls();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isSettingsOpen, showControls]);

  // Always show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isPlaying]);

  return { controlsVisible, showControls, toggleControls };
}
