// ─── YouTube IFrame Player API Type Declarations ──────────────────
// Minimal typings for the YouTube IFrame Player API
// https://developers.google.com/youtube/iframe_api_reference

declare namespace YT {
  interface PlayerOptions {
    width?: number | string;
    height?: number | string;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: PlayerEvents;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    iv_load_policy?: 1 | 3;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    fs?: 0 | 1;
    playsinline?: 0 | 1;
    origin?: string;
    cc_load_policy?: 0 | 1;
    start?: number;
    end?: number;
    loop?: 0 | 1;
    mute?: 0 | 1;
  }

  interface PlayerEvents {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onPlaybackQualityChange?: (event: any) => void;
    onPlaybackRateChange?: (event: any) => void;
    onError?: (event: OnErrorEvent) => void;
    onApiChange?: (event: any) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: number;
    target: Player;
  }

  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  class Player {
    constructor(
      elementId: string | HTMLElement,
      options: PlayerOptions
    );

    // Playback controls
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;

    // Volume
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;

    // Playback rate
    getPlaybackRate(): number;
    setPlaybackRate(suggestedRate: number): void;
    getAvailablePlaybackRates(): number[];

    // Video info
    getDuration(): number;
    getCurrentTime(): number;
    getVideoLoadedFraction(): number;
    getPlayerState(): number;
    getVideoUrl(): string;
    getVideoEmbedCode(): string;

    // Player state
    getIframe(): HTMLIFrameElement;
    destroy(): void;

    // Size
    setSize(width: number, height: number): object;
  }

  // Player states
  const PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}
