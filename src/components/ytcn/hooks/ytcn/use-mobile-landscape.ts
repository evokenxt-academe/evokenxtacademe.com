"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseMobileLandscapeReturn {
  /**
   * True when the mobile-landscape CSS rotation is actively applied.
   * This is true when:
   *   - Device is a touch/mobile device
   *   - Fullscreen is requested
   *   - Device is in portrait orientation (rotation needed)
   */
  isMobileLandscape: boolean;
  /**
   * True when the device is a touch/mobile device.
   */
  isTouchDevice: boolean;
  /**
   * Activate mobile landscape mode on the container.
   * No-op on desktop or when already active.
   */
  enterMobileLandscape: () => void;
  /**
   * Deactivate mobile landscape mode on the container.
   */
  exitMobileLandscape: () => void;
}

/* ================================================================ */
/*  Helpers                                                          */
/* ================================================================ */

/** Returns true when the screen is in portrait orientation. */
function isPortrait(): boolean {
  // Primary: matchMedia (works everywhere including iOS)
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(orientation: portrait)").matches;
  }
  // Fallback: compare dimensions
  return window.innerHeight > window.innerWidth;
}

/** Returns true on touch/mobile devices. */
function detectTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(hover: none), (pointer: coarse)");
  return media.matches || navigator.maxTouchPoints > 0;
}

/**
 * Try to lock the screen orientation to landscape.
 * Returns true if the lock was successfully initiated (Android Chrome).
 * Returns false on iOS and browsers that don't support it.
 */
async function tryOrientationLock(): Promise<boolean> {
  try {
    const orientation = screen.orientation as any;
    if (orientation && typeof orientation.lock === "function") {
      await orientation.lock("landscape");
      return true;
    }
  } catch {
    // iOS Safari, Firefox, etc. — orientation lock not supported
  }
  return false;
}

/** Unlock screen orientation if previously locked. */
function tryOrientationUnlock(): void {
  try {
    const orientation = screen.orientation as any;
    if (orientation && typeof orientation.unlock === "function") {
      orientation.unlock();
    }
  } catch {
    // Ignore — may not be locked
  }
}

/* ================================================================ */
/*  CSS application helpers                                          */
/* ================================================================ */

const MOBILE_LS_ATTR = "data-ytcn-mobile-landscape";
const BODY_LOCK_CLASS = "ytcn-body-locked";

/**
 * Apply the CSS rotation + fixed positioning to the container.
 * Uses inline styles to guarantee specificity and avoid className conflicts.
 */
function applyLandscapeStyles(container: HTMLElement): void {
  container.setAttribute(MOBILE_LS_ATTR, "true");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vh";
  container.style.height = "100vw";
  container.style.maxWidth = "none";
  container.style.maxHeight = "none";
  container.style.transform = "rotate(90deg)";
  container.style.transformOrigin = "top left";
  container.style.translate = "100vw 0";
  container.style.zIndex = "99999";
  container.style.borderRadius = "0";
  container.style.border = "none";

  // Lock body scrolling
  document.body.classList.add(BODY_LOCK_CLASS);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
}

/**
 * Remove all landscape styles from the container.
 */
function removeLandscapeStyles(container: HTMLElement): void {
  container.removeAttribute(MOBILE_LS_ATTR);
  container.style.position = "";
  container.style.top = "";
  container.style.left = "";
  container.style.width = "";
  container.style.height = "";
  container.style.maxWidth = "";
  container.style.maxHeight = "";
  container.style.transform = "";
  container.style.transformOrigin = "";
  container.style.translate = "";
  container.style.zIndex = "";
  container.style.borderRadius = "";
  container.style.border = "";

  // Restore body scrolling
  document.body.classList.remove(BODY_LOCK_CLASS);
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.height = "";
}

/**
 * When the device is physically in landscape, we don't need the CSS
 * rotation — just fill the viewport with fixed positioning.
 */
function applyNativeLandscapeStyles(container: HTMLElement): void {
  container.setAttribute(MOBILE_LS_ATTR, "native");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.maxWidth = "none";
  container.style.maxHeight = "none";
  container.style.transform = "none";
  container.style.transformOrigin = "";
  container.style.translate = "none";
  container.style.zIndex = "99999";
  container.style.borderRadius = "0";
  container.style.border = "none";

  document.body.classList.add(BODY_LOCK_CLASS);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
}

/* ================================================================ */
/*  useMobileLandscape hook                                          */
/* ================================================================ */

/**
 * useMobileLandscape — Provides iOS-compatible landscape fullscreen
 * for video player containers using CSS rotation.
 *
 * On iOS Safari/PWA, `Element.requestFullscreen()` is not supported
 * for non-<video> elements, and `screen.orientation.lock()` is not
 * supported at all. This hook provides a CSS-based alternative that
 * rotates the container 90° when the device is in portrait mode,
 * simulating landscape fullscreen.
 *
 * On Android Chrome, we first try the native `screen.orientation.lock("landscape")`
 * which works perfectly. The CSS rotation is the fallback.
 *
 * The hook monitors device orientation changes and adapts:
 * - Portrait → applies 90° rotation
 * - Landscape → removes rotation (device already provides landscape layout)
 */
export function useMobileLandscape(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseMobileLandscapeReturn {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const orientationLockedRef = useRef(false);
  const scrollYRef = useRef(0);

  // Detect touch device
  useEffect(() => {
    const detect = () => setIsTouchDevice(detectTouchDevice());
    detect();
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    media.addEventListener("change", detect);
    return () => media.removeEventListener("change", detect);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (activeRef.current) {
        const container = containerRef.current;
        if (container) {
          removeLandscapeStyles(container);
        }
        tryOrientationUnlock();
        document.body.classList.remove(BODY_LOCK_CLASS);
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";
      }
    };
  }, [containerRef]);

  /**
   * Update the container styles based on current orientation.
   * Called on orientation changes while mobile landscape is active.
   */
  const updateOrientation = useCallback(() => {
    const container = containerRef.current;
    if (!container || !activeRef.current) return;

    if (isPortrait()) {
      // Device is portrait — apply CSS rotation to simulate landscape
      applyLandscapeStyles(container);
    } else {
      // Device is physically landscape — just use fixed fullscreen (no rotation)
      applyNativeLandscapeStyles(container);
    }
  }, [containerRef]);

  // Listen for orientation changes while active
  useEffect(() => {
    if (!isMobileLandscape) return;

    const handleOrientationChange = () => {
      // Small delay to let the browser settle orientation dimensions
      requestAnimationFrame(() => {
        setTimeout(updateOrientation, 50);
      });
    };

    // Listen to multiple events for maximum compatibility
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    const portraitMq = window.matchMedia("(orientation: portrait)");
    portraitMq.addEventListener("change", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      portraitMq.removeEventListener("change", handleOrientationChange);
    };
  }, [isMobileLandscape, updateOrientation]);

  const enterMobileLandscape = useCallback(async () => {
    const container = containerRef.current;
    if (!container || activeRef.current) return;
    if (!detectTouchDevice()) return;

    // Save scroll position for restoration on exit
    scrollYRef.current = window.scrollY;
    activeRef.current = true;

    // First, try native orientation lock (works on Android Chrome)
    const locked = await tryOrientationLock();
    orientationLockedRef.current = locked;

    if (locked) {
      // Android: orientation lock succeeded — use simple fixed fullscreen
      // The orientation change event will trigger, but we can set up now
      applyNativeLandscapeStyles(container);
    } else {
      // iOS / unsupported: use CSS rotation
      if (isPortrait()) {
        applyLandscapeStyles(container);
      } else {
        applyNativeLandscapeStyles(container);
      }
    }

    if (mountedRef.current) {
      setIsMobileLandscape(true);
    }
  }, [containerRef]);

  const exitMobileLandscape = useCallback(() => {
    const container = containerRef.current;
    activeRef.current = false;

    if (container) {
      removeLandscapeStyles(container);
    }

    if (orientationLockedRef.current) {
      tryOrientationUnlock();
      orientationLockedRef.current = false;
    }

    // Restore scroll position
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollYRef.current);
    });

    if (mountedRef.current) {
      setIsMobileLandscape(false);
    }
  }, [containerRef]);

  return {
    isMobileLandscape,
    isTouchDevice,
    enterMobileLandscape,
    exitMobileLandscape,
  };
}
