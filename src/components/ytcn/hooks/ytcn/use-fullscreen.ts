"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMobileLandscape,
  tryOrientationLock,
  tryOrientationUnlock,
  isLandscape,
  detectTouchDevice,
  detectIOS,
} from "./use-mobile-landscape";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseFullscreenOptions {
  /** Video playing state — used to automatically enter landscape fullscreen on physical rotation */
  isPlaying?: boolean;
  /** Whether auto-rotation is enabled when turning device to landscape (default: true) */
  autoOrientation?: boolean;
  /** Callback fired whenever fullscreen state changes */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export interface UseFullscreenReturn {
  /** Whether the container is currently in fullscreen mode (native or CSS landscape) */
  isFullscreen: boolean;
  /** True when mobile landscape CSS rotation or native fixed layout is active */
  isMobileLandscape: boolean;
  /** True when the screen is physically in landscape orientation */
  isLandscapeOrientation: boolean;
  /** Toggle between fullscreen and normal mode */
  toggle: () => void;
  /** Enter fullscreen */
  enter: () => Promise<void>;
  /** Exit fullscreen */
  exit: () => Promise<void>;
}

/* ================================================================ */
/*  useFullscreen                                                     */
/* ================================================================ */

/**
 * useFullscreen — Production-ready Fullscreen & Orientation hook.
 *
 * Capabilities:
 * - Desktop: Standard W3C Fullscreen API
 * - Android Chrome / PWA: Native Fullscreen + Hardware `screen.orientation.lock("landscape")`
 * - iOS Safari / iOS PWA: Dynamic CSS Landscape Pseudo-Fullscreen (safe-area aware, 90° portrait rotation)
 * - Auto-rotation: Automatically expands to horizontal fullscreen when phone is rotated horizontally while playing
 */
export function useFullscreen(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseFullscreenOptions = {}
): UseFullscreenReturn {
  const { isPlaying = false, autoOrientation = true, onFullscreenChange } = options;

  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const mountedRef = useRef(true);
  const autoEnteredRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const {
    isMobileLandscape,
    isTouchDevice,
    isLandscapeOrientation,
    enterMobileLandscape,
    exitMobileLandscape,
    updateOrientation,
  } = useMobileLandscape(containerRef);

  // Combined fullscreen state
  const isFullscreen = isNativeFullscreen || isMobileLandscape;

  // Notify consumer of fullscreen changes
  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  // Sync native fullscreen state
  useEffect(() => {
    mountedRef.current = true;

    const handleFullscreenChange = (): void => {
      if (!mountedRef.current) return;
      const isNowNative = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsNativeFullscreen(isNowNative);

      if (isNowNative) {
        // When entering native fullscreen on touch devices (Android), lock to landscape
        tryOrientationLock("landscape").catch(() => {});
      } else {
        // When exiting native fullscreen, unlock orientation
        tryOrientationUnlock();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enter = useCallback(async (): Promise<void> => {
    const container = containerRef.current;
    if (!container) return;

    // iOS Safari / iOS PWA: Native requestFullscreen on <div> is not supported.
    // Use dynamic CSS landscape pseudo-fullscreen.
    if (detectIOS()) {
      await enterMobileLandscape();
      return;
    }

    // Android / Desktop: Try native Fullscreen API first
    if (container.requestFullscreen) {
      try {
        await container.requestFullscreen();
        // After native fullscreen request, lock orientation to landscape
        await tryOrientationLock("landscape");
        return;
      } catch {
        // Fallback to mobile landscape CSS
        await enterMobileLandscape();
      }
    } else if ((container as any).webkitRequestFullscreen) {
      try {
        (container as any).webkitRequestFullscreen();
        await tryOrientationLock("landscape");
        return;
      } catch {
        await enterMobileLandscape();
      }
    } else {
      await enterMobileLandscape();
    }
  }, [containerRef, enterMobileLandscape]);

  const exit = useCallback(async (): Promise<void> => {
    autoEnteredRef.current = false;

    // Exit CSS mobile landscape if active
    if (isMobileLandscape) {
      await exitMobileLandscape();
    }

    // Exit native fullscreen if active
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    } catch {
      /* ignore exit errors */
    }

    tryOrientationUnlock();
  }, [isMobileLandscape, exitMobileLandscape]);

  const toggle = useCallback((): void => {
    if (isFullscreen) {
      void exit();
    } else {
      void enter();
    }
  }, [isFullscreen, enter, exit]);

  // Intelligent physical phone rotation handling
  useEffect(() => {
    if (!autoOrientation || !detectTouchDevice()) return;

    let previousLandscape = isLandscape();

    const handleRotation = () => {
      const currentLandscape = isLandscape();
      if (currentLandscape === previousLandscape) return;
      previousLandscape = currentLandscape;

      if (currentLandscape) {
        // Phone rotated horizontally (Landscape)
        if (isPlayingRef.current && !isFullscreen) {
          autoEnteredRef.current = true;
          void enter();
        } else if (isMobileLandscape) {
          updateOrientation();
        }
      } else {
        // Phone rotated back to vertical (Portrait)
        if (autoEnteredRef.current || isFullscreen) {
          autoEnteredRef.current = false;
          void exit();
        }
      }
    };

    window.addEventListener("orientationchange", handleRotation);
    window.addEventListener("resize", handleRotation);
    const media = window.matchMedia("(orientation: landscape)");
    media.addEventListener?.("change", handleRotation);

    return () => {
      window.removeEventListener("orientationchange", handleRotation);
      window.removeEventListener("resize", handleRotation);
      media.removeEventListener?.("change", handleRotation);
    };
  }, [autoOrientation, isFullscreen, isMobileLandscape, enter, exit, updateOrientation]);

  return {
    isFullscreen,
    isMobileLandscape,
    isLandscapeOrientation,
    toggle,
    enter,
    exit,
  };
}

