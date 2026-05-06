/**
 * YouTube IFrame API type declarations.
 *
 * These types cover the subset of the YouTube IFrame API that ytcn uses.
 * The full API is more extensive, but these types are sufficient for our
 * player implementation and avoid pulling in @types/youtube which can
 * conflict with other versions.
 *
 * Note: `any` is used only for the YT API boundary (playerVars) where
 * YouTube accepts arbitrary key-value pairs with mixed types.
 */

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    target: Player;
    data: number;
  }

  interface OnPlaybackRateChangeEvent {
    target: Player;
    data: number;
  }

  interface OnErrorEvent {
    target: Player;
    data: number;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    /** YouTube playerVars accept mixed types — `any` is correct at this API boundary */
    playerVars?: Record<string, string | number | undefined>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    };
  }

  class Player {
    constructor(element: HTMLElement | string, options: PlayerOptions);
    destroy(): void;
    getIframe(): HTMLIFrameElement;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getPlayerState(): number;
    getCurrentTime(): number;
    getDuration(): number;
    getVideoLoadedFraction(): number;
    getPlaybackRate(): number;
    setPlaybackRate(rate: number): void;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    /** Unload a YouTube module (e.g. "captions", "cc") to suppress features */
    unloadModule(module: string): void;
    /** Set an option on a YouTube module */
    setOption(module: string, option: string, value: unknown): void;
  }
}

/**
 * Window augmentation for YouTube IFrame API globals.
 *
 * Avoids `(window as any).YT` casts throughout the codebase by declaring
 * the shape that YouTube injects onto `window`.
 */
interface YTWindow extends Window {
  YT?: typeof YT & {
    Player: typeof YT.Player;
    PlayerState: typeof YT.PlayerState;
  };
  onYouTubeIframeAPIReady?: () => void;
}
