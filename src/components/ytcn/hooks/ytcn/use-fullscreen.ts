"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMobileLandscape } from "./use-mobile-landscape";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseFullscreenReturn {
  /** Whether the container is currently in fullscreen */
  isFullscreen: boolean;
  /** True when mobile landscape CSS rotation is active */
  isMobileLandscape: boolean;
  /** Toggle between fullscreen and normal mode */
  toggle: () => void;
  /** Enter fullscreen */
  enter: () => void;
  /** Exit fullscreen */
  exit: () => void;
}

/* ================================================================ */
/*  useFullscreen                                                     */
/* ================================================================ */

/**
 * useFullscreen — Abstracts the Fullscreen API for a given container ref.
 *
 * Listens for `fullscreenchange` events on `document` rather than the
 * element itself, because the event bubbles and the spec guarantees it
 * fires on `document`. This avoids issues with vendor-prefixed events
 * on older browsers.
 *
 * On mobile/touch devices where the native Fullscreen API is unavailable
 * (e.g. iOS Safari, iOS PWA), this hook automatically activates a
 * CSS rotation-based landscape fullscreen via `useMobileLandscape`.
 */
export function useFullscreen(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const mounted = useRef(true);

  // Mobile landscape hook — provides iOS-compatible landscape fullscreen
  const {
    isMobileLandscape,
    isTouchDevice,
    enterMobileLandscape,
    exitMobileLandscape,
  } = useMobileLandscape(containerRef);

  useEffect(() => {
    mounted.current = true;

    const handleChange = (): void => {
      if (mounted.current) {
        setIsFullscreen(
          !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
        );
      }
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const enter = useCallback((): void => {
    try {
      const container = containerRef.current;
      if (!container) return;

      // On touch devices, use mobile landscape mode (CSS rotation)
      // This handles iOS Safari/PWA where requestFullscreen on <div> is unsupported
      if (isTouchDevice) {
        enterMobileLandscape();
        return;
      }

      // Desktop: use native Fullscreen API
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          // Fallback: try mobile landscape even on "desktop" if fullscreen fails
          enterMobileLandscape();
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else {
        enterMobileLandscape();
      }
    } catch {
      enterMobileLandscape();
    }
  }, [containerRef, isTouchDevice, enterMobileLandscape]);

  const exit = useCallback((): void => {
    // If mobile landscape is active, exit that
    if (isMobileLandscape) {
      exitMobileLandscape();
      return;
    }

    // If CSS fallback fullscreen is active, exit that
    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }

    // Exit native fullscreen
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    } catch {
      /* exit can throw if not in fullscreen */
    }
  }, [isMobileLandscape, isFallbackFullscreen, exitMobileLandscape]);

  const toggle = useCallback((): void => {
    const isCurrentlyFullscreen =
      !!document.fullscreenElement ||
      !!(document as any).webkitFullscreenElement ||
      isFallbackFullscreen ||
      isMobileLandscape;

    if (isCurrentlyFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit, isFallbackFullscreen, isMobileLandscape]);

  // Combined fullscreen state: native fullscreen OR CSS fallback OR mobile landscape
  const activeFullscreen = isFullscreen || isFallbackFullscreen || isMobileLandscape;

  // Add body class for fallback to hide scrollbars
  useEffect(() => {
    if (isFallbackFullscreen) {
      document.body.style.overflow = "hidden";
    } else if (!isMobileLandscape) {
      // Only restore if mobile landscape isn't managing body overflow
      document.body.style.overflow = "";
    }
    return () => {
      if (!isMobileLandscape) {
        document.body.style.overflow = "";
      }
    };
  }, [isFallbackFullscreen, isMobileLandscape]);

  return {
    isFullscreen: activeFullscreen,
    isMobileLandscape,
    toggle,
    enter,
    exit,
  };
}
