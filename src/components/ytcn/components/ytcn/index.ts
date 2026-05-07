/* ================================================================ */
/*  ytcn — Public API barrel export                                  */
/*                                                                    */
/*  This file re-exports everything a consumer needs. It must not     */
/*  cause side effects on import (no module-level DOM access, no      */
/*  script injection). The YouTube API is loaded lazily via           */
/*  loadYouTubeAPI() inside the hooks.                                */
/* ================================================================ */

// ── Components ──
export { YtcnPlayer } from "./ytcn-player";
export { YtcnControls } from "./ytcn-controls";
export { YtcnProgress } from "./ytcn-progress";
export { YtcnVolume } from "./ytcn-volume";
export { YtcnSpeed } from "./ytcn-speed";
export { YtcnQuality } from "./ytcn-quality";
export { YtcnFullscreen } from "./ytcn-fullscreen";
export { YtcnOverlay } from "./ytcn-overlay";
export { YtcnLoader } from "./ytcn-loader";

// ── Component Props ──
export type { YtcnPlayerProps } from "./ytcn-player";
export type { YtcnControlsProps } from "./ytcn-controls";
export type { YtcnProgressProps } from "./ytcn-progress";
export type { YtcnSpeedProps } from "./ytcn-speed";
export type { YtcnFullscreenProps } from "./ytcn-fullscreen";
export type { YtcnLoaderProps } from "./ytcn-loader";
export type { YtcnOverlayProps } from "./ytcn-overlay";
export type { YtcnVolumeProps } from "./ytcn-volume";

// ── Types ──
export type {
  PlayerState,
  PlayerControls,
  PlaybackSpeed,
  PlayerPhase,
  YtcnPlayerOptions,
  KeyboardBindings,
} from "./types";

export { PLAYBACK_SPEEDS, DEFAULT_KEYBOARD_BINDINGS } from "./types";
