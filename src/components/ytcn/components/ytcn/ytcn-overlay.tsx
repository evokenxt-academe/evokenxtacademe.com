"use client";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnOverlayProps {
  /** Called when the overlay is clicked (typically toggles play/pause) */
  onClick: () => void;
}

/* ================================================================ */
/*  YtcnOverlay                                                      */
/* ================================================================ */

/**
 * YtcnOverlay — Transparent click-intercept div above the iframe.
 *
 * Sits between the YouTube iframe (z-10) and the custom controls (z-30).
 * Serves two purposes:
 *   1. Captures click events for play/pause without them reaching the
 *      iframe (which has pointerEvents: none anyway, but defense in depth).
 *   2. Provides the cursor: pointer visual feedback over the video area.
 */
export function YtcnOverlay({ onClick }: YtcnOverlayProps): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 z-[25] cursor-pointer"
      onClick={onClick}
      aria-label="Toggle playback"
      role="button"
      tabIndex={-1}
    />
  );
}
