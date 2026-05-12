"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlayerState,
  PlayerControls,
  PlaybackSpeed,
  YtcnPlayerOptions,
} from "@/components/ytcn/components/ytcn/types";
import { QUALITY_LABELS } from "@/components/ytcn/components/ytcn/types";
import { loadYouTubeAPI, styleIframe } from "@/components/ytcn/lib/ytcn/loader";
import { useFullscreen } from "./use-fullscreen";

/* ================================================================ */
/*  Return type                                                      */
/* ================================================================ */

export interface UseYtcnPlayerReturn {
  /** Ref for the outer container div (used for fullscreen) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for the div that YouTube replaces with an iframe */
  playerDivRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the underlying YT.Player instance */
  playerRef: React.RefObject<YT.Player | null>;
  /** Reactive player state */
  state: PlayerState;
  /** Imperative control methods */
  controls: PlayerControls;
}

/* ================================================================ */
/*  Initial state factory                                            */
/* ================================================================ */

function createInitialState(
  options: YtcnPlayerOptions,
  prev?: Partial<PlayerState>
): PlayerState {
  return {
    phase: "thumbnail",
    isPlaying: false,
    isMuted: prev?.isMuted ?? false,
    volume: prev?.volume ?? 100,
    currentTime: 0,
    duration: 0,
    loadedFraction: 0,
    isLoading: false,
    isCued: false,
    // SSR guard — document may not exist in server environments
    isFullscreen: typeof document !== "undefined" ? !!document.fullscreenElement : false,
    playbackRate: options.defaultSpeed ?? (prev?.playbackRate ?? 1),
    isLive: options.isLive ?? false,
    isAtLiveEdge: false,
    currentQuality: "auto",
    availableQualities: [],
  };
}

/* ================================================================ */
/*  Typed window accessor — avoids `any` casts for YT globals        */
/* ================================================================ */

function getYT(): typeof YT | undefined {
  return (window as unknown as YTWindow).YT;
}

function normalizeQualityValue(requested: string, availableQualities: string[]): string {
  if (!requested) return "auto";

  // Already a valid YouTube quality key.
  if (availableQualities.includes(requested) || requested === "auto") {
    return requested;
  }

  // Allow UI labels like "720p", "360p", etc.
  const matchedKey = Object.entries(QUALITY_LABELS).find(([, label]) => label === requested)?.[0];
  if (matchedKey && (availableQualities.includes(matchedKey) || matchedKey === "auto")) {
    return matchedKey;
  }

  return "auto";
}

/* ================================================================ */
/*  useYtcnPlayer — Core player lifecycle hook                       */
/* ================================================================ */

/**
 * useYtcnPlayer — The primary hook for managing a YouTube player instance.
 *
 * Handles:
 *   - Three-phase lifecycle: thumbnail → loading → ready
 *   - YouTube API loading (singleton, lazy)
 *   - Thumbnail-first: iframe only created after user click or autoplay
 *   - State polling (currentTime, buffered) every 250ms
 *   - Stale closure safety via refs for all values consumed in YT callbacks
 *   - Imperative controls (play, pause, seek, volume, speed, fullscreen)
 *
 * Returns containerRef and playerDivRef for DOM attachment, reactive state,
 * and an imperative controls object.
 */
export function useYtcnPlayer(options: YtcnPlayerOptions): UseYtcnPlayerReturn {
  const {
    videoId,
    autoplay = false,
    isLive = false,
    defaultSpeed = 1,
    startAt = 0,
    onEnd,
    onTimeUpdate,
    onPlaybackRateChange,
    thumbnailFailed = false,
  } = options;

  // ── DOM refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  // ── Mounted ref — prevents setState after unmount ──
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Stale closure safety refs ──
  // All values consumed inside YT event callbacks (onReady, onStateChange)
  // must be stored in refs and kept in sync. Never rely on closure-captured
  // state inside YT callbacks — they fire asynchronously outside React's
  // render cycle and would capture stale values.
  const volumeRef = useRef(100);
  const isMutedRef = useRef(true);
  const playbackSpeedRef = useRef<PlaybackSpeed>(defaultSpeed);

  // Phase ref — allows async functions to read latest phase without stale closure
  const phaseRef = useRef<PlayerState["phase"]>("thumbnail");

  // Callback refs — avoids re-creating the player when callbacks change.
  // This effect intentionally has no dependency array: it runs on every
  // render to keep refs always in sync with the latest callback props.
  const onEndRef = useRef(onEnd);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlaybackRateChangeRef = useRef(onPlaybackRateChange);

  useEffect(() => {
    onEndRef.current = onEnd;
    onTimeUpdateRef.current = onTimeUpdate;
    onPlaybackRateChangeRef.current = onPlaybackRateChange;
  });

  // ── State ──
  const [state, setState] = useState<PlayerState>(() =>
    createInitialState(options)
  );

  // Keep refs in sync so YT callbacks always see the latest values
  useEffect(() => {
    volumeRef.current = state.volume;
    isMutedRef.current = state.isMuted;
    playbackSpeedRef.current = state.playbackRate;
    phaseRef.current = state.phase;
  }, [state.volume, state.isMuted, state.playbackRate, state.phase]);

  // ── Fullscreen ──
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);

  useEffect(() => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, isFullscreen }));

    // Strip captions again when fullscreen state changes —
    // YouTube may re-enable captions when entering/exiting fullscreen
    try {
      const player = playerRef.current;
      if (player) {
        player.unloadModule("captions");
        player.unloadModule("cc");
        player.setOption("captions", "track", {});
        player.setOption("cc", "track", {});
      }
    } catch {
      /* player may not be initialized yet */
    }
  }, [isFullscreen]);

  /**
   * suppressCaptions — Aggressively disable YouTube captions.
   *
   * YouTube re-enables captions for signed-in users with captions enabled
   * in their account settings, even with cc_load_policy: 0. We call this
   * on every state change that matters to keep them suppressed.
   */
  const suppressCaptions = useCallback((player: YT.Player): void => {
    try {
      (player as any).unloadModule("captions");
      (player as any).unloadModule("cc");
      (player as any).setOption("captions", "track", {});
      (player as any).setOption("cc", "track", {});
    } catch {
      /* player may be in a transitional state */
    }
  }, []);

  /* ----------------------------------------------------------------
   *  createPlayer
   *
   *  Creates a new YT.Player instance on the playerDivRef element.
   *  Called after YouTube API is loaded and user initiates playback.
   * --------------------------------------------------------------- */
  const createPlayer = useCallback(
    (seekSeconds: number) => {
      if (!videoId || !playerDivRef.current) return;

      // Destroy existing player (safety net for videoId changes)
      try {
        playerRef.current?.destroy();
      } catch {
        /* player may already be destroyed */
      }
      playerRef.current = null;

      // YT.Player replaces the target div with an iframe. After destroy()
      // that element is gone — inject a fresh div before each creation.
      const container = playerDivRef.current.parentElement;
      if (!container) return;
      const newDiv = document.createElement("div");
      newDiv.style.width = "100%";
      newDiv.style.height = "100%";
      container.replaceChild(newDiv, playerDivRef.current);
      (playerDivRef as React.MutableRefObject<HTMLDivElement>).current = newDiv;

      const yt = getYT();
      if (!yt) return;

      // playerVars — YouTube IFrame URL parameters for branding suppression.
      // Every flag here is intentional: see /docs/advanced/branding-removal
      const playerVars: Record<string, string | number | undefined> = {
        controls: 0,         // Hide native controls
        modestbranding: 1,   // Suppress YouTube logo
        rel: 0,              // No related videos at end
        showinfo: 0,         // No video title/uploader (deprecated but still respected)
        iv_load_policy: 3,   // Disable annotations
        cc_load_policy: 0,   // Captions off by default
        cc_lang_pref: "",    // Empty language preference to avoid auto-enabling
        fs: 0,               // Disable native fullscreen button
        disablekb: 1,        // Disable YouTube's keyboard controls (we have our own)
        playsinline: 1,      // Inline playback on iOS
        autoplay: 1,         // Start immediately when iframe loads
        mute: 0,             // Start with sound on by default
        origin: window.location.origin,
        start: Math.floor(seekSeconds),
      };

      playerRef.current = new yt.Player(newDiv, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars,
        events: {
          onReady: (event: any) => {
            const player = event.target;

            // First operation: offset the iframe to crop YouTube's native chrome
            styleIframe(player);

            // Restore volume / mute / speed from refs (always fresh values)
            try {
              player.setVolume(volumeRef.current);
              if (!isMutedRef.current) player.unMute();
              if (playbackSpeedRef.current !== 1) {
                player.setPlaybackRate(playbackSpeedRef.current);
              }
              // First caption suppression — before any frames render
              suppressCaptions(player);
            } catch {
              /* player may reject these calls during initialization */
            }

            if (!mountedRef.current) return;
            setState((prev) => ({
              ...prev,
              isLoading: false,
              duration: player.getDuration() || prev.duration,
              availableQualities: (player as any).getAvailableQualityLevels() || [],
              currentQuality: (player as any).getPlaybackQuality() || "auto",
            }));
          },

          onStateChange: (event: any) => {
            const yt2 = getYT();
            if (!yt2) return;
            const player = event.target;

            switch (event.data) {
              case yt2.PlayerState.UNSTARTED:
                if (!mountedRef.current) return;
                setState((prev) => ({ ...prev, isCued: true, isPlaying: false }));
                break;

              case yt2.PlayerState.CUED:
                if (!mountedRef.current) return;
                setState((prev) => ({ ...prev, isCued: true, isPlaying: false }));
                break;

              case yt2.PlayerState.PLAYING: {
                // Suppress captions on every PLAYING event — YouTube re-enables
                // captions after seek for signed-in users
                suppressCaptions(player);

                if (!mountedRef.current) return;
                // Phase transition: loading → ready (thumbnail fades out)
                setState((prev) => ({
                  ...prev,
                  phase: "ready",
                  isPlaying: true,
                  isLoading: false,
                  isCued: false,
                  duration: player.getDuration() || prev.duration,
                  availableQualities: (player as any).getAvailableQualityLevels() || prev.availableQualities,
                  currentQuality: (player as any).getPlaybackQuality() || prev.currentQuality,
                }));
                break;
              }

              case yt2.PlayerState.PAUSED:
                // Suppress captions even when paused — user may have enabled them
                suppressCaptions(player);

                if (!mountedRef.current) return;
                setState((prev) => ({ ...prev, isPlaying: false }));
                break;

              case yt2.PlayerState.BUFFERING:
                if (!mountedRef.current) return;
                // Phase: BUFFERING can also signal readiness if we're in loading phase
                setState((prev) => ({
                  ...prev,
                  phase: prev.phase === "thumbnail"
                    ? prev.phase
                    : prev.phase === "loading" ? "ready" : prev.phase,
                  isLoading: true,
                  isCued: false,
                }));
                break;

              case yt2.PlayerState.ENDED:
                if (!mountedRef.current) return;
                setState((prev) => ({ ...prev, isPlaying: false }));
                onEndRef.current?.();
                break;
            }
          },

          onPlaybackRateChange: (event: any) => {
            const rate = event.data as PlaybackSpeed;
            if (!mountedRef.current) return;
            setState((prev) => ({ ...prev, playbackRate: rate }));
            onPlaybackRateChangeRef.current?.(rate);
          },

          onPlaybackQualityChange: (event: any) => {
            if (!mountedRef.current) return;
            const nextQuality = event.data || "auto";
            setState((prev) => ({ ...prev, currentQuality: nextQuality }));
          },

          onError: () => {
            if (!mountedRef.current) return;
            setState((prev) => ({ ...prev, isLoading: false }));
          },
        } as any,
      });
    },
    // videoId and suppressCaptions are the only true dependencies.
    // All other values (volumeRef, isMutedRef, etc.) are accessed via refs
    // to avoid stale closures, so they don't need to be in the dep array.
    [videoId, isLive, suppressCaptions]
  );

  const handleThumbnailClick = useCallback(async () => {
    // Use ref to read latest phase — avoids stale closure in async flow
    if (phaseRef.current !== "thumbnail") return;

    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, phase: "loading", isLoading: true }));
    await loadYouTubeAPI();

    // Guard: component may have unmounted during API load
    if (!mountedRef.current) return;
    createPlayer(startAt);
  }, [startAt, createPlayer]);

  // Reset player and state when videoId changes
  useEffect(() => {
    if (!videoId) return;

    try {
      playerRef.current?.destroy();
    } catch {
      /* player may already be destroyed */
    }
    playerRef.current = null;

    setState((prev) => ({
      ...prev,
      phase: "thumbnail",
      isPlaying: false,
      isCued: false,
      currentTime: 0,
      loadedFraction: 0,
      isLoading: false,
      duration: 0,
      isLive,
      isAtLiveEdge: false,
      currentQuality: "auto",
      availableQualities: [],
    }));
  }, [videoId, isLive]);

  useEffect(() => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, isLive }));
  }, [isLive]);

  // Autoplay: skip thumbnail phase and start loading immediately
  useEffect(() => {
    if (autoplay && videoId && phaseRef.current === "thumbnail") {
      handleThumbnailClick();
    }
    // Only trigger on videoId/autoplay changes — handleThumbnailClick is
    // intentionally excluded to prevent re-triggering on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [videoId, autoplay]);

  // If thumbnail probing fails, skip directly to loading phase
  useEffect(() => {
    if (thumbnailFailed && phaseRef.current === "thumbnail") {
      handleThumbnailClick();
    }
    // Only trigger when thumbnailFailed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [thumbnailFailed]);

  // Poll for currentTime / buffered every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      // Guard: player may not have getCurrentTime during initialization
      if (!player?.getCurrentTime) return;
      try {
        const currentTime = (player as any).getCurrentTime();
        const duration = (player as any).getDuration();
        const loadedFraction = (player as any).getVideoLoadedFraction();

        if (!mountedRef.current) return;
        const isAtLiveEdge = isLive ? (duration - currentTime <= 5) : false;

        setState((prev) => ({
          ...prev,
          currentTime,
          duration: duration > 0 ? duration : prev.duration,
          loadedFraction,
          isAtLiveEdge,
        }));

        onTimeUpdateRef.current?.(currentTime, duration);
      } catch {
        /* player may be in a destroyed state between intervals */
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isLive]);

  /* ================================================================ */
  /*  Controls — imperative methods exposed to consumers              */
  /* ================================================================ */

  const play = useCallback((): void => {
    try {
      (playerRef.current as any)?.playVideo();
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const pause = useCallback((): void => {
    try {
      (playerRef.current as any)?.pauseVideo();
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const togglePlay = useCallback((): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const yt = getYT();
      if (!yt) return;
      if ((player as any).getPlayerState() === yt.PlayerState.PLAYING) {
        (player as any).pauseVideo();
      } else {
        (player as any).playVideo();
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const seekTo = useCallback((seconds: number): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      (player as any).seekTo(seconds, true);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, currentTime: seconds }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [isLive]);

  const seekRelative = useCallback((delta: number): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const current = (player as any).getCurrentTime();
      const duration = (player as any).getDuration();
      const newTime = Math.max(0, Math.min(duration, current + delta));
      (player as any).seekTo(newTime, true);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, currentTime: newTime }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [isLive]);

  const setVolume = useCallback((vol: number): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      (player as any).setVolume(vol);
      if (vol > 0) {
        (player as any).unMute();
        isMutedRef.current = false;
      } else {
        (player as any).mute();
        isMutedRef.current = true;
      }
      volumeRef.current = vol;
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const toggleMute = useCallback((): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isMutedRef.current) {
        (player as any).unMute();
        isMutedRef.current = false;
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isMuted: false }));
        }
      } else {
        (player as any).mute();
        isMutedRef.current = true;
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isMuted: true }));
        }
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const setSpeed = useCallback((rate: PlaybackSpeed): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      (player as any).setPlaybackRate(rate);
      playbackSpeedRef.current = rate;
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, playbackRate: rate }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, []);

  const seekToLive = useCallback((): void => {
    if (!isLive) return;
    const player = playerRef.current;
    if (!player) return;
    try {
      const duration = (player as any).getDuration();
      (player as any).seekTo(duration, true);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, currentTime: duration, isAtLiveEdge: true }));
      }
    } catch {
      /* noop */
    }
  }, [isLive]);

  const setQuality = useCallback((quality: string): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const normalized = normalizeQualityValue(quality, state.availableQualities);

      if (normalized === "auto") {
        (player as any).setPlaybackQuality("default");
      } else {
        (player as any).setPlaybackQuality(normalized);
        // Ask YouTube to prefer this range when supported.
        if (typeof (player as any).setPlaybackQualityRange === "function") {
          (player as any).setPlaybackQualityRange(normalized);
        }
      }

      // Force quality re-evaluation at current position.
      const currentTime = player.getCurrentTime();
      player.seekTo(currentTime, true);

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, currentQuality: normalized }));
      }
    } catch {
      /* noop */
    }
  }, [state.availableQualities]);

  // ── Compose controls object ──
  const controls: PlayerControls = {
    play,
    pause,
    togglePlay,
    seekTo,
    seekRelative,
    seekToLive,
    setVolume,
    toggleMute,
    setSpeed,
    setQuality,
    toggleFullscreen,
    handleThumbnailClick,
  };

  return {
    playerRef,
    containerRef,
    playerDivRef,
    state,
    controls,
  };
}
