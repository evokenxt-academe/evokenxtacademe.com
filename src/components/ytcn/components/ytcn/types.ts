/* ================================================================ */
/*  Playback Speed                                                   */
/* ================================================================ */

export type PlaybackSpeed = 0.75 | 1 | 1.5 | 2;

export const PLAYBACK_SPEEDS = [0.75, 1, 1.5, 2] as const;

/* ================================================================ */
/*  Player Phase — thumbnail-first state machine                     */
/* ================================================================ */

/**
 * PlayerPhase — Controls the player's lifecycle from thumbnail to video.
 *
 * "thumbnail" → Thumbnail shown, zero iframe, zero YouTube JS loaded.
 * "loading"   → Thumbnail stays visible, iframe initializing in background.
 * "ready"     → Video is playing, thumbnail fades out.
 *
 * Transitions:
 *   "thumbnail" → "loading"  on user click or autoplay
 *   "loading"   → "ready"    on onStateChange PLAYING(1)
 *   any         → "thumbnail" on videoId prop change
 */
export type PlayerPhase = "thumbnail" | "loading" | "ready";

/* ================================================================ */
/*  Player State                                                     */
/* ================================================================ */

export interface PlayerState {
  /** Current phase of the player lifecycle */
  phase: PlayerPhase;
  /** True when YouTube reports PLAYING state */
  isPlaying: boolean;
  /** Current mute state */
  isMuted: boolean;
  /** Volume level 0–100 */
  volume: number;
  /** Current playback position in seconds, polled every 250ms */
  currentTime: number;
  /** Total video duration in seconds */
  duration: number;
  /** Buffer progress as a fraction from 0 to 1 */
  loadedFraction: number;
  /** True during player initialization */
  isLoading: boolean;
  /** True when YouTube reports CUED or UNSTARTED state */
  isCued: boolean;
  /** True when document.fullscreenElement matches player container */
  isFullscreen: boolean;
  /** Current playback speed */
  playbackRate: PlaybackSpeed;
  /** True when player is rendering a live stream */
  isLive: boolean;
}

/* ================================================================ */
/*  Player Options                                                   */
/* ================================================================ */

export interface YtcnPlayerOptions {
  /** YouTube video ID (the 11-character string, not a full URL) */
  videoId: string;
  /** Start playback automatically. Browsers require muted audio for this. */
  autoplay?: boolean;
  /** Enables live mode controls and UI */
  isLive?: boolean;
  /** Initial playback rate */
  defaultSpeed?: PlaybackSpeed;
  /** Resume from this timestamp (seconds) */
  startAt?: number;
  /** Fired when the video reaches its end */
  onEnd?: () => void;
  /** Polled every 250ms during playback */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Fired when the playback rate changes */
  onPlaybackRateChange?: (rate: number) => void;
  /**
   * Internal: passed from YtcnPlayer when thumbnail probe fails.
   * When true, the hook skips thumbnail phase and goes straight to loading.
   */
  thumbnailFailed?: boolean;
}

/* ================================================================ */
/*  Controls Interface                                               */
/* ================================================================ */

export interface PlayerControls {
  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Toggle between play and pause */
  togglePlay: () => void;
  /** Seek to an absolute position in seconds */
  seekTo: (seconds: number) => void;
  /** Seek relative to current position (positive = forward) */
  seekRelative: (delta: number) => void;
  /** Set volume level (0–100) */
  setVolume: (vol: number) => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Set playback speed */
  setSpeed: (rate: PlaybackSpeed) => void;
  /** Enter or exit fullscreen */
  toggleFullscreen: () => void;
  /** Click handler for thumbnail play button */
  handleThumbnailClick: () => void;
}

/* ================================================================ */
/*  Keyboard Shortcut Bindings                                       */
/* ================================================================ */

export interface KeyboardBindings {
  /** Key for play/pause (default: Space) */
  play?: string;
  /** Key for mute toggle (default: M) */
  mute?: string;
  /** Key for fullscreen toggle (default: F) */
  fullscreen?: string;
  /** Key for seeking backward (default: ArrowLeft) */
  seekBack?: string;
  /** Key for seeking forward (default: ArrowRight) */
  seekForward?: string;
}

export const DEFAULT_KEYBOARD_BINDINGS: Required<KeyboardBindings> = {
  play: " ",
  mute: "m",
  fullscreen: "f",
  seekBack: "ArrowLeft",
  seekForward: "ArrowRight",
};
