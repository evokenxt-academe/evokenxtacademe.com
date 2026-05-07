"use client";

import { IconMaximize, IconMinimize } from "@tabler/icons-react";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnFullscreenProps {
  /** Whether the player is currently in fullscreen mode */
  isFullscreen: boolean;
  /** Toggle fullscreen on/off */
  onToggle: () => void;
}

/* ================================================================ */
/*  YtcnFullscreen                                                   */
/* ================================================================ */

/**
 * YtcnFullscreen — Fullscreen toggle button.
 *
 * Switches icon between maximize and minimize based on current state.
 * aria-label updates dynamically for screen reader clarity.
 */
export function YtcnFullscreen({ isFullscreen, onToggle }: YtcnFullscreenProps): React.JSX.Element {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-sm p-1.5 text-white transition-colors hover:bg-white/10 touch-manipulation sm:min-h-0 sm:min-w-0"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        <IconMinimize className="size-5" />
      ) : (
        <IconMaximize className="size-5" />
      )}
    </button>
  );
}
