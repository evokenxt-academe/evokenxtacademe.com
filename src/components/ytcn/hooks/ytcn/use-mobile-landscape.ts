"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseMobileLandscapeReturn {
  /**
   * True when mobile landscape mode (rotated or native fixed) is active.
   */
  isMobileLandscape: boolean;
  /**
   * True when the device is a touch/mobile device.
   */
  isTouchDevice: boolean;
  /**
   * True when the screen is physically in landscape orientation.
   */
  isLandscapeOrientation: boolean;
  /**
   * Activate mobile landscape mode on the container.
   */
  enterMobileLandscape: () => Promise<boolean>;
  /**
   * Deactivate mobile landscape mode on the container.
   */
  exitMobileLandscape: () => Promise<void>;
  /**
   * Update container layout based on current orientation.
   */
  updateOrientation: () => void;
}

/* ================================================================ */
/*  Helpers                                                          */
/* ================================================================ */

/** Returns true when the screen is in portrait orientation. */
export function isPortrait(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia) {
    return window.matchMedia("(orientation: portrait)").matches;
  }
  return window.innerHeight > window.innerWidth;
}

/** Returns true when the screen is in landscape orientation. */
export function isLandscape(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia) {
    return window.matchMedia("(orientation: landscape)").matches;
  }
  return window.innerWidth > window.innerHeight;
}

/** Returns true on touch/mobile devices. */
export function detectTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(hover: none), (pointer: coarse)");
  return media.matches || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
}

/** Returns true on iOS devices (iPhone, iPad, iPod, or iPadOS Safari). */
export function detectIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Returns true on Android devices. */
export function detectAndroid(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

export type OrientationLockMode =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

/**
 * Try to lock the screen orientation to landscape.
 * Returns true if the lock was successfully initiated (Android Chrome / supporting PWAs).
 */
export async function tryOrientationLock(type: OrientationLockMode = "landscape"): Promise<boolean> {
  if (typeof screen === "undefined") return false;
  try {
    const orientation = (screen as any).orientation;
    if (orientation && typeof orientation.lock === "function") {
      await orientation.lock(type);
      return true;
    }
  } catch {
    // Unsupported or requires fullscreen
  }
  return false;
}

/** Unlock screen orientation if previously locked. */
export function tryOrientationUnlock(): void {
  if (typeof screen === "undefined") return;
  try {
    const orientation = (screen as any).orientation;
    if (orientation && typeof orientation.unlock === "function") {
      orientation.unlock();
    }
  } catch {
    // Ignore
  }
}

/* ================================================================ */
/*  CSS application helpers                                          */
/* ================================================================ */

export const MOBILE_LS_ATTR = "data-ytcn-mobile-landscape";
export const BODY_LOCK_CLASS = "ytcn-body-locked";

/**
 * Apply the 90° CSS rotation + fixed positioning to the container for portrait devices.
 * Uses dynamic viewport units (100dvh / 100dvw) and robust transform.
 */
function applyLandscapeStyles(container: HTMLElement): void {
  container.setAttribute(MOBILE_LS_ATTR, "rotated");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100dvh";
  container.style.height = "100dvw";
  container.style.maxWidth = "none";
  container.style.maxHeight = "none";
  container.style.transform = "rotate(90deg) translateY(-100%)";
  container.style.transformOrigin = "top left";
  container.style.zIndex = "99999";
  container.style.borderRadius = "0";
  container.style.border = "none";
  container.style.backgroundColor = "#000000";

  // Lock body scrolling
  lockBodyScroll();
}

/**
 * When the device is physically in landscape, fill the full viewport without rotation.
 */
function applyNativeLandscapeStyles(container: HTMLElement): void {
  container.setAttribute(MOBILE_LS_ATTR, "native");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100dvw";
  container.style.height = "100dvh";
  container.style.maxWidth = "none";
  container.style.maxHeight = "none";
  container.style.transform = "none";
  container.style.transformOrigin = "";
  container.style.zIndex = "99999";
  container.style.borderRadius = "0";
  container.style.border = "none";
  container.style.backgroundColor = "#000000";

  lockBodyScroll();
}

/**
 * Remove all landscape styles from the container and restore document flow.
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
  container.style.zIndex = "";
  container.style.borderRadius = "";
  container.style.border = "";
  container.style.backgroundColor = "";

  unlockBodyScroll();
}

function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  document.body.classList.add(BODY_LOCK_CLASS);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  document.body.classList.remove(BODY_LOCK_CLASS);
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
}

/* ================================================================ */
/*  useMobileLandscape hook                                          */
/* ================================================================ */

/**
 * useMobileLandscape — Provides comprehensive landscape fullscreen
 * for video player containers across Android, iOS Safari, and PWAs.
 */
export function useMobileLandscape(
  containerRef: React.RefObject<HTMLDivElement | null>
): UseMobileLandscapeReturn {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isLandscapeOrientation, setIsLandscapeOrientation] = useState(false);

  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const orientationLockedRef = useRef(false);
  const scrollYRef = useRef(0);

  // Detect touch device and orientation
  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsTouchDevice(detectTouchDevice());
      setIsLandscapeOrientation(isLandscape());
    };

    updateDeviceInfo();

    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const landscapeMedia = window.matchMedia("(orientation: landscape)");

    media.addEventListener?.("change", updateDeviceInfo);
    landscapeMedia.addEventListener?.("change", updateDeviceInfo);

    return () => {
      media.removeEventListener?.("change", updateDeviceInfo);
      landscapeMedia.removeEventListener?.("change", updateDeviceInfo);
    };
  }, []);

  // Update container styles based on current orientation while active
  const updateOrientation = useCallback(() => {
    const container = containerRef.current;
    if (!container || !activeRef.current) return;

    const landscape = isLandscape();
    setIsLandscapeOrientation(landscape);

    if (landscape) {
      // Device is physically in landscape — fill screen without 90deg rotation
      applyNativeLandscapeStyles(container);
    } else {
      // Device is in portrait — apply 90° rotation to simulate landscape
      applyLandscapeStyles(container);
    }
  }, [containerRef]);

  // Listen for orientation changes while active
  useEffect(() => {
    if (!isMobileLandscape) return;

    const handleOrientationChange = () => {
      requestAnimationFrame(() => {
        setTimeout(updateOrientation, 60);
      });
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    const portraitMq = window.matchMedia("(orientation: portrait)");
    portraitMq.addEventListener?.("change", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      portraitMq.removeEventListener?.("change", handleOrientationChange);
    };
  }, [isMobileLandscape, updateOrientation]);

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
        unlockBodyScroll();
      }
    };
  }, [containerRef]);

  const enterMobileLandscape = useCallback(async (): Promise<boolean> => {
    const container = containerRef.current;
    if (!container || activeRef.current) return false;

    // Save scroll position for restoration on exit
    scrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    activeRef.current = true;

    // Try orientation lock first (Android Chrome / PWA)
    const locked = await tryOrientationLock("landscape");
    orientationLockedRef.current = locked;

    if (locked) {
      applyNativeLandscapeStyles(container);
    } else {
      if (isPortrait()) {
        applyLandscapeStyles(container);
      } else {
        applyNativeLandscapeStyles(container);
      }
    }

    if (mountedRef.current) {
      setIsMobileLandscape(true);
      setIsLandscapeOrientation(isLandscape());
    }

    return true;
  }, [containerRef]);

  const exitMobileLandscape = useCallback(async (): Promise<void> => {
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
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollYRef.current);
      });
    }

    if (mountedRef.current) {
      setIsMobileLandscape(false);
      setIsLandscapeOrientation(isLandscape());
    }
  }, [containerRef]);

  return {
    isMobileLandscape,
    isTouchDevice,
    isLandscapeOrientation,
    enterMobileLandscape,
    exitMobileLandscape,
    updateOrientation,
  };
}
