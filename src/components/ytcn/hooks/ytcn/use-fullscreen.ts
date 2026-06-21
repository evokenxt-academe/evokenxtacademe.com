"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseFullscreenReturn {
  /** Whether the container is currently in fullscreen */
  isFullscreen: boolean;
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
 */
export function useFullscreen(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const handleChange = (): void => {
      if (mounted.current) {
        setIsFullscreen(!!document.fullscreenElement);
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
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          setIsFallbackFullscreen(true);
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else {
        setIsFallbackFullscreen(true);
      }
    } catch {
      setIsFallbackFullscreen(true);
    }
  }, [containerRef]);

  const exit = useCallback((): void => {
    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    } catch {
      /* exit can throw if not in fullscreen */
    }
  }, [isFallbackFullscreen]);

  const toggle = useCallback((): void => {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement || isFallbackFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit, isFallbackFullscreen]);

  const activeFullscreen = isFullscreen || isFallbackFullscreen;

  // Add body class for fallback to hide scrollbars
  useEffect(() => {
    if (isFallbackFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFallbackFullscreen]);

  // Lock orientation to landscape on mobile when native fullscreen is active
  useEffect(() => {
    const orientation = window.screen?.orientation as any;
    if (isFullscreen) {
      if (window.innerWidth < 768 && orientation && typeof orientation.lock === "function") {
        orientation.lock("landscape").catch((err: any) => {
          console.warn("Screen orientation lock failed:", err);
        });
      }
    } else {
      if (orientation && typeof orientation.unlock === "function") {
        try {
          orientation.unlock();
        } catch (err) {
          console.warn("Screen orientation unlock failed:", err);
        }
      }
    }
  }, [isFullscreen]);

  return { isFullscreen: activeFullscreen, toggle, enter, exit };
}
