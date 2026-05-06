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
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const handleChange = (): void => {
      if (mounted.current) {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  const enter = useCallback((): void => {
    try {
      containerRef.current?.requestFullscreen();
    } catch {
      /* fullscreen may be denied by browser policy */
    }
  }, [containerRef]);

  const exit = useCallback((): void => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
    } catch {
      /* exit can throw if not in fullscreen */
    }
  }, []);

  const toggle = useCallback((): void => {
    if (document.fullscreenElement) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit]);

  return { isFullscreen, toggle, enter, exit };
}
