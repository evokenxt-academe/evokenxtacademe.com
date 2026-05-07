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
}

/* ================================================================ */
/*  useIdleControls                                                  */
/* ================================================================ */

/**
 * useIdleControls — Auto-hides controls after 3s of inactivity.
 *
 * Rules:
 *   - Controls never hide when paused
 *   - Controls never hide when not in fullscreen
 *   - Controls never hide when a popover/dropdown is open
 *   - Calling showControls() resets the 3s timer
 */
export function useIdleControls({
  isPlaying,
  isFullscreen,
  isSettingsOpen,
}: UseIdleControlsOptions): UseIdleControlsReturn {
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    // Only auto-hide in fullscreen AND while playing AND settings closed AND not mobile
    if (isFullscreen && isPlaying && !isSettingsOpen && !isMobile) {
      timerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isFullscreen, isPlaying, isSettingsOpen, isMobile]);

  // Reset timer when play state / fullscreen / settings changes
  useEffect(() => {
    showControls();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isFullscreen, isSettingsOpen, isMobile, showControls]);

  // Always show controls when paused, not fullscreen, or on mobile
  useEffect(() => {
    if (!isPlaying || !isFullscreen || isMobile) {
      setControlsVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isPlaying, isFullscreen, isMobile]);

  return { controlsVisible, showControls };
}
