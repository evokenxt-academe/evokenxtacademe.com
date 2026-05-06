"use client";

import { useEffect } from "react";
import type { KeyboardBindings } from "@/components/ytcn/components/ytcn/types";
import { DEFAULT_KEYBOARD_BINDINGS } from "@/components/ytcn/components/ytcn/types";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseKeyboardShortcutsOptions {
  /** Master toggle — set to false to disable all shortcuts */
  enabled: boolean;
  /** Called on play/pause key */
  onPlay?: () => void;
  /** Called on mute key */
  onMute?: () => void;
  /** Called on fullscreen key */
  onFullscreen?: () => void;
  /** Called on seek backward key */
  onSeekBack?: () => void;
  /** Called on seek forward key */
  onSeekForward?: () => void;
  /** Override default key bindings */
  bindings?: KeyboardBindings;
}

/* ================================================================ */
/*  useKeyboardShortcuts                                             */
/* ================================================================ */

/**
 * useKeyboardShortcuts — Global keyboard listener for player controls.
 *
 * Attaches to `window` so shortcuts work regardless of focus. Skips
 * events when the active element is an <input>, <textarea>, or any
 * element with [contenteditable], to avoid hijacking text input.
 *
 * Bindings are configurable via the `bindings` prop. Defaults match
 * YouTube's native shortcuts (Space, F, M, ←, →).
 */
export function useKeyboardShortcuts({
  enabled,
  onPlay,
  onMute,
  onFullscreen,
  onSeekBack,
  onSeekForward,
  bindings: customBindings,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const bindings = { ...DEFAULT_KEYBOARD_BINDINGS, ...customBindings };

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Skip when user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (key === bindings.play) {
        e.preventDefault();
        onPlay?.();
      } else if (key.toLowerCase() === bindings.mute?.toLowerCase()) {
        onMute?.();
      } else if (key.toLowerCase() === bindings.fullscreen?.toLowerCase()) {
        onFullscreen?.();
      } else if (key === bindings.seekBack) {
        onSeekBack?.();
      } else if (key === bindings.seekForward) {
        onSeekForward?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onPlay, onMute, onFullscreen, onSeekBack, onSeekForward, customBindings]);
}
