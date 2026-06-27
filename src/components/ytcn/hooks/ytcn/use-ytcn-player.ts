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
import {
  isValidStreamTime,
  sanitizeStreamTime,
} from "@/components/ytcn/lib/ytcn/format";
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
    liveOnly: (options.isLive ?? false) && (options.liveOnly ?? true),
    isAtLiveEdge: false,
    currentQuality: "auto",
    availableQualities: [],
    errorCode: null,
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

/** Seconds behind the DVR window end before we show "GO LIVE" instead of "LIVE". */
const LIVE_EDGE_THRESHOLD_SEC = 15;

function computeIsAtLiveEdge(
  currentTime: number,
  duration: number,
  isLive: boolean,
  seekingToLiveUntil: number,
): boolean {
  if (!isLive) return false;
  if (Date.now() < seekingToLiveUntil) return true;
  if (!isValidStreamTime(duration) || duration <= 0) return true;
  if (!isValidStreamTime(currentTime)) return true;
  return Math.max(0, duration - currentTime) <= LIVE_EDGE_THRESHOLD_SEC;
}

function readLiveTiming(player: YT.Player, prevDuration: number) {
  const rawCurrent = (player as any).getCurrentTime?.() ?? 0;
  const rawDuration = (player as any).getDuration?.() ?? 0;

  const duration =
    sanitizeStreamTime(rawDuration) ||
    (isValidStreamTime(prevDuration) ? prevDuration : 0);

  let currentTime = sanitizeStreamTime(rawCurrent, duration);

  // YouTube can briefly return corrupt times right after a live-edge seek.
  if (duration > 0 && !isValidStreamTime(rawCurrent)) {
    currentTime = duration;
  }

  if (duration > 0) {
    currentTime = Math.min(currentTime, duration);
  }

  return { currentTime, duration };
}

function getLiveDrift(player: YT.Player): number {
  const duration = sanitizeStreamTime((player as any).getDuration?.() ?? 0);
  const currentTime = sanitizeStreamTime(
    (player as any).getCurrentTime?.() ?? 0,
    duration,
  );
  if (duration <= 0) return 0;
  return Math.max(0, duration - currentTime);
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
    liveOnly: liveOnlyOption,
    defaultSpeed = 1,
    startAt = 0,
    onEnd,
    onTimeUpdate,
    onPlaybackRateChange,
    thumbnailFailed = false,
  } = options;

  const liveOnly = isLive && (liveOnlyOption ?? true);

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
      // Clean up quality enforcement timer
      if (qualityEnforceTimerRef.current) {
        clearTimeout(qualityEnforceTimerRef.current);
        qualityEnforceTimerRef.current = null;
      }
    };
  }, []);

  // ── Stale closure safety refs ──
  // All values consumed inside YT event callbacks (onReady, onStateChange)
  // must be stored in refs and kept in sync. Never rely on closure-captured
  // state inside YT callbacks — they fire asynchronously outside React's
  // render cycle and would capture stale values.
  const volumeRef = useRef(100);
  const shouldStartMuted = autoplay && isLive;
  const isMutedRef = useRef(shouldStartMuted);
  const playbackSpeedRef = useRef<PlaybackSpeed>(defaultSpeed);
  const preferredQualityRef = useRef<string | null>(null);
  const qualityEnforceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qualityEnforceCountRef = useRef(0);
  const skipQualityEventRef = useRef(false);
  const autoplayAttemptRef = useRef(0);
  const liveRetryRef = useRef(0);
  const isLiveRef = useRef(isLive);
  const liveOnlyRef = useRef(liveOnly);
  const seekingToLiveUntilRef = useRef(0);
  const autoplayRef = useRef(autoplay);
  const videoIdRef = useRef(videoId);
  const liveResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLiveSeekAtRef = useRef(0);

  useEffect(() => {
    isLiveRef.current = isLive;
    liveOnlyRef.current = liveOnly;
    autoplayRef.current = autoplay;
    videoIdRef.current = videoId;
    isMutedRef.current = shouldStartMuted;
  }, [isLive, liveOnly, autoplay, videoId, shouldStartMuted]);

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

  /**
   * enforceQuality — Forces the YouTube player to use the preferred quality.
   *
   * YouTube's `setPlaybackQuality()` is a "suggestion" that YouTube often
   * ignores. The only reliable way to force a quality change is:
   *   1. Call `setPlaybackQuality(quality)` to suggest the level.
   *   2. If `setPlaybackQualityRange` exists, lock min=max.
   *   3. Micro-seek to the current position — this forces YouTube to
   *      re-buffer and re-evaluate quality at the suggested level.
   *
   * An enforcement counter prevents infinite loops: if we've tried 3+
   * times and YouTube keeps overriding, we accept its choice (it may
   * not have that quality available at the current bitrate/connection).
   *
   * @param withSeek  If true, performs a micro-seek to force re-buffering.
   *                  Set false for "soft" enforcement (e.g., PLAYING state)
   *                  to avoid visible playback disruption.
   */
  const enforceQuality = useCallback((
    player: YT.Player,
    quality: string,
    withSeek: boolean = false,
  ): void => {
    if (!quality || quality === "auto" || quality === "default") return;
    try {
      const anyPlayer = player as any;

      // Set the skip flag so onPlaybackQualityChange doesn't fight us
      skipQualityEventRef.current = true;

      // 1. Suggest the quality level
      if (typeof anyPlayer.setPlaybackQuality === "function") {
        anyPlayer.setPlaybackQuality(quality);
      }

      // 2. If available, lock the quality range min=max
      if (typeof anyPlayer.setPlaybackQualityRange === "function") {
        anyPlayer.setPlaybackQualityRange(quality, quality);
      }

      // 3. Micro-seek to force YouTube to re-buffer at the suggested quality.
      //    This is the key operation — without it, YouTube ignores the suggestion.
      if (withSeek) {
        const currentTime = anyPlayer.getCurrentTime();
        if (currentTime !== undefined && currentTime >= 0) {
          anyPlayer.seekTo(currentTime, true);
        }
      }

      // Clear the skip flag after a tick so the next real quality event is handled
      setTimeout(() => {
        skipQualityEventRef.current = false;
      }, 200);
    } catch {
      skipQualityEventRef.current = false;
      /* player may not be ready */
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
        mute: shouldStartMuted ? 1 : 0,
        origin: window.location.origin,
        ...(isLive ? {} : { start: Math.floor(seekSeconds) }),
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
              if (playbackSpeedRef.current !== 1 && !isLive) {
                player.setPlaybackRate(playbackSpeedRef.current);
              }
              // First caption suppression — before any frames render
              suppressCaptions(player);
              player.playVideo();
              if (isLiveRef.current && liveOnlyRef.current) {
                window.setTimeout(() => {
                  if (!mountedRef.current || !playerRef.current) return;
                  const drift = getLiveDrift(player);
                  if (drift > LIVE_EDGE_THRESHOLD_SEC) {
                    const d = sanitizeStreamTime((player as any).getDuration?.() ?? 0);
                    if (d > 0) {
                      try {
                        (player as any).seekTo(d, true);
                        lastLiveSeekAtRef.current = Date.now();
                      } catch {
                        /* player may not be ready */
                      }
                    }
                  }
                }, 800);
              } else if (isLiveRef.current) {
                const snapLive = () => {
                  try {
                    const d = (player as any).getDuration?.() ?? 0;
                    if (isValidStreamTime(d) && d > 0) {
                      (player as any).seekTo(d, true);
                    }
                  } catch {
                    /* player may not be ready */
                  }
                };
                snapLive();
                window.setTimeout(snapLive, 600);
              }
            } catch {
              /* player may reject these calls during initialization */
            }

            // Auto-set highest available quality on ready
            try {
              const availableQualities: string[] = (player as any).getAvailableQualityLevels() || [];
              if (availableQualities.length > 0) {
                // YouTube returns qualities sorted highest-first
                // e.g., ["hd1080", "hd720", "large", "medium", "small", "tiny", "auto"]
                const highestQuality = availableQualities.find((q: string) => q !== "auto" && q !== "default") || availableQualities[0];
                if (highestQuality && highestQuality !== "auto" && highestQuality !== "default") {
                  preferredQualityRef.current = highestQuality;
                  qualityEnforceCountRef.current = 0;
                  enforceQuality(player, highestQuality, false);
                }
              }
            } catch {
              /* quality APIs may not be available yet */
            }

            const attemptId = ++autoplayAttemptRef.current;
            window.setTimeout(() => {
              if (!mountedRef.current || attemptId !== autoplayAttemptRef.current) return;
              const yt3 = getYT();
              if (!yt3) return;
              try {
                const playerState = player.getPlayerState();
                if (
                  playerState === yt3.PlayerState.PLAYING ||
                  playerState === yt3.PlayerState.BUFFERING
                ) {
                  return;
                }
                if (
                  playerState === yt3.PlayerState.CUED ||
                  playerState === yt3.PlayerState.UNSTARTED ||
                  playerState === yt3.PlayerState.PAUSED
                ) {
                  player.playVideo();
                }
                setState((prev) =>
                  prev.phase === "loading"
                    ? {
                        ...prev,
                        phase: "ready",
                        isPlaying: false,
                        isCued: true,
                        isLoading: false,
                      }
                    : prev,
                );
              } catch {
                /* player may be destroyed */
              }
            }, 1800);

            if (!mountedRef.current) return;
            const readyQualities: string[] = (player as any).getAvailableQualityLevels() || [];
            const readyCurrentQuality: string = preferredQualityRef.current || (player as any).getPlaybackQuality() || "auto";
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isMuted: shouldStartMuted,
              duration: player.getDuration() || prev.duration,
              availableQualities: readyQualities,
              currentQuality: readyCurrentQuality,
            }));
          },

          onStateChange: (event: any) => {
            const yt2 = getYT();
            if (!yt2) return;
            const player = event.target;

            switch (event.data) {
              case yt2.PlayerState.UNSTARTED:
                if (!mountedRef.current) return;
                setState((prev) => ({
                  ...prev,
                  phase: prev.phase === "loading" ? "ready" : prev.phase,
                  isCued: true,
                  isPlaying: false,
                  isLoading: false,
                }));
                break;

              case yt2.PlayerState.CUED:
                if (!mountedRef.current) return;
                setState((prev) => ({
                  ...prev,
                  phase: prev.phase === "loading" ? "ready" : prev.phase,
                  isCued: true,
                  isPlaying: false,
                  isLoading: false,
                }));
                break;

              case yt2.PlayerState.PLAYING: {
                // Suppress captions on every PLAYING event — YouTube re-enables
                // captions after seek for signed-in users
                suppressCaptions(player);
                liveRetryRef.current = 0;

                // Re-enforce preferred quality on every PLAYING transition.
                // YouTube often downgrades quality after buffering/seeking.
                if (preferredQualityRef.current) {
                  enforceQuality(player, preferredQualityRef.current);
                }

                if (!mountedRef.current) return;
                // Phase transition: loading → ready (thumbnail fades out)
                const playingQualities: string[] = (player as any).getAvailableQualityLevels() || [];
                setState((prev) => ({
                  ...prev,
                  phase: "ready",
                  isPlaying: true,
                  isLoading: false,
                  isCued: false,
                  errorCode: null,
                  duration: player.getDuration() || prev.duration,
                  availableQualities: playingQualities.length > 0 ? playingQualities : prev.availableQualities,
                  currentQuality: preferredQualityRef.current || (player as any).getPlaybackQuality() || prev.currentQuality,
                }));
                break;
              }

              case yt2.PlayerState.PAUSED:
                // Suppress captions even when paused — user may have enabled them
                suppressCaptions(player);

                // Live-only: resume if YouTube pauses unexpectedly (debounced).
                if (liveOnlyRef.current) {
                  if (liveResumeTimerRef.current) {
                    clearTimeout(liveResumeTimerRef.current);
                  }
                  liveResumeTimerRef.current = setTimeout(() => {
                    if (!mountedRef.current || !liveOnlyRef.current) return;
                    const activePlayer = playerRef.current;
                    if (!activePlayer) return;
                    const yt = getYT();
                    const playerState = (activePlayer as any).getPlayerState?.();
                    if (yt && playerState === yt.PlayerState.PAUSED) {
                      try {
                        (activePlayer as any).playVideo();
                      } catch {
                        /* player may not be ready */
                      }
                    }
                  }, 400);
                  return;
                }

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
                  errorCode: null,
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

            // Skip events triggered by our own enforceQuality calls
            if (skipQualityEventRef.current) return;

            const nextQuality = event.data || "auto";
            const preferred = preferredQualityRef.current;

            // Detect YouTube-initiated quality downgrade.
            // If the user has locked a quality and YouTube tries to switch
            // to something different, attempt to re-enforce — but only up
            // to 3 times to prevent infinite loops (YouTube may not support
            // the requested quality at the current connection/bitrate).
            if (
              preferred &&
              preferred !== "auto" &&
              preferred !== "default" &&
              nextQuality !== preferred &&
              qualityEnforceCountRef.current < 3
            ) {
              qualityEnforceCountRef.current += 1;
              const player = playerRef.current;
              if (player) {
                if (qualityEnforceTimerRef.current) {
                  clearTimeout(qualityEnforceTimerRef.current);
                }
                qualityEnforceTimerRef.current = setTimeout(() => {
                  if (!mountedRef.current || !playerRef.current) return;
                  enforceQuality(playerRef.current, preferred, true);
                }, 400);
              }
              // Don't update state to the downgraded quality yet
              return;
            }

            // Quality matched our preference, or we've given up enforcing
            qualityEnforceCountRef.current = 0;
            setState((prev) => ({ ...prev, currentQuality: nextQuality }));
          },

          onError: (event: any) => {
            if (!mountedRef.current) return;
            const errCode = event.data;
            setState((prev) => ({ ...prev, isLoading: false, errorCode: errCode }));

            // If embedding is disabled (101 or 150), do not retry — it's non-recoverable.
            if (errCode === 101 || errCode === 150) {
              return;
            }

            if (!isLiveRef.current || liveRetryRef.current >= 15) {
              return;
            }

            liveRetryRef.current += 1;
            const retryDelay = Math.min(2_000 + liveRetryRef.current * 1_000, 8_000);
            window.setTimeout(() => {
              if (!mountedRef.current || !videoIdRef.current) return;
              const player = playerRef.current;
              try {
                const anyPlayer = player as any;
                if (anyPlayer?.loadVideoById) {
                  anyPlayer.loadVideoById(videoIdRef.current);
                  anyPlayer.playVideo();
                  if (isLiveRef.current) {
                    const d = anyPlayer.getDuration?.() ?? 0;
                    if (isValidStreamTime(d) && d > 0) {
                      const drift = getLiveDrift(anyPlayer);
                      if (drift > LIVE_EDGE_THRESHOLD_SEC) {
                        anyPlayer.seekTo(d, true);
                      }
                    }
                  }
                  return;
                }
              } catch {
                /* fall through to full recreate */
              }
              createPlayer(0);
            }, retryDelay);
          },
        } as any,
      });
    },
    // videoId and suppressCaptions are the only true dependencies.
    // All other values (volumeRef, isMutedRef, etc.) are accessed via refs
    // to avoid stale closures, so they don't need to be in the dep array.
    [videoId, isLive, shouldStartMuted, suppressCaptions, enforceQuality]
  );

  const beginPlayback = useCallback(async () => {
    if (phaseRef.current === "ready" || phaseRef.current === "loading") {
      return;
    }

    phaseRef.current = "loading";
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, phase: "loading", isLoading: true }));
    await loadYouTubeAPI();

    if (!mountedRef.current) return;
    createPlayer(startAt);
  }, [startAt, createPlayer]);

  const handleThumbnailClick = useCallback(async () => {
    await beginPlayback();
  }, [beginPlayback]);

  // Reset player and state when videoId or live mode changes
  useEffect(() => {
    if (!videoId) return;

    liveRetryRef.current = 0;
    seekingToLiveUntilRef.current = 0;
    lastLiveSeekAtRef.current = 0;
    if (liveResumeTimerRef.current) {
      clearTimeout(liveResumeTimerRef.current);
      liveResumeTimerRef.current = null;
    }
    preferredQualityRef.current = null;
    qualityEnforceCountRef.current = 0;
    skipQualityEventRef.current = false;
    if (qualityEnforceTimerRef.current) {
      clearTimeout(qualityEnforceTimerRef.current);
      qualityEnforceTimerRef.current = null;
    }

    try {
      playerRef.current?.destroy();
    } catch {
      /* player may already be destroyed */
    }
    playerRef.current = null;
    phaseRef.current = "thumbnail";

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
      liveOnly,
      isAtLiveEdge: liveOnly ? true : false,
      currentQuality: "auto",
      availableQualities: [],
      isMuted: shouldStartMuted,
      errorCode: null,
    }));

    if (isLive && autoplay) {
      void beginPlayback();
    }
  }, [videoId, isLive, liveOnly, shouldStartMuted, autoplay, beginPlayback]);

  useEffect(() => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, isLive, liveOnly, isMuted: shouldStartMuted ? prev.isMuted : prev.isMuted }));
  }, [isLive, liveOnly, shouldStartMuted]);

  // Autoplay for VOD (live autoplay is handled in the reset effect above)
  useEffect(() => {
    if (!videoId || !autoplay || isLive) return;
    if (phaseRef.current !== "thumbnail") return;
    void beginPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- beginPlayback intentionally excluded
  }, [videoId, autoplay, isLive]);

  // If thumbnail probing fails, skip directly to loading phase
  useEffect(() => {
    if (!thumbnailFailed || phaseRef.current !== "thumbnail") return;
    void beginPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- beginPlayback intentionally excluded
  }, [thumbnailFailed]);

  // Poll for currentTime / buffered every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      // Guard: player may not have getCurrentTime during initialization
      if (!player?.getCurrentTime) return;
      try {
        const loadedFraction = (player as any).getVideoLoadedFraction();

        if (!mountedRef.current) return;

        setState((prev) => {
          if (liveOnlyRef.current) {
            onTimeUpdateRef.current?.(0, 0);
            return {
              ...prev,
              isAtLiveEdge: true,
              liveOnly: true,
              isLive: true,
              loadedFraction,
            };
          }

          const { currentTime, duration } = readLiveTiming(player, prev.duration);
          const isAtLiveEdge = computeIsAtLiveEdge(
            currentTime,
            duration,
            isLive,
            seekingToLiveUntilRef.current,
          );

          onTimeUpdateRef.current?.(currentTime, duration);

          return {
            ...prev,
            currentTime,
            duration: duration > 0 ? duration : prev.duration,
            loadedFraction,
            isAtLiveEdge,
          };
        });
      } catch {
        /* player may be in a destroyed state between intervals */
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isLive, liveOnly]);

  /* ================================================================ */
  /*  Controls — imperative methods exposed to consumers              */
  /* ================================================================ */

  const jumpToLiveEdge = useCallback((player: YT.Player, opts?: { unmute?: boolean; force?: boolean }): void => {
    try {
      if (opts?.unmute && isMutedRef.current) {
        (player as any).unMute();
        isMutedRef.current = false;
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isMuted: false }));
        }
      }

      const now = Date.now();
      const drift = getLiveDrift(player);
      const canSeek =
        opts?.force ||
        (drift > LIVE_EDGE_THRESHOLD_SEC && now - lastLiveSeekAtRef.current > 3_000);

      if (canSeek) {
        const duration = sanitizeStreamTime((player as any).getDuration?.() ?? 0);
        if (duration > 0) {
          (player as any).seekTo(duration, true);
          lastLiveSeekAtRef.current = now;
        }
      }

      (player as any).playVideo();
    } catch {
      /* player may not be ready */
    }
  }, []);

  const seekToLive = useCallback((): void => {
    if (!isLive) return;
    const player = playerRef.current;
    if (!player) return;

    seekingToLiveUntilRef.current = Date.now() + 5_000;

    jumpToLiveEdge(player);

    if (mountedRef.current) {
      setState((prev) => {
        const duration = isValidStreamTime(prev.duration) ? prev.duration : 0;
        return {
          ...prev,
          isAtLiveEdge: true,
          isPlaying: true,
          currentTime: duration > 0 ? duration : prev.currentTime,
        };
      });
    }

    // YouTube live DVR often needs follow-up seeks as the window advances.
    for (const delay of [400, 900, 1800]) {
      window.setTimeout(() => {
        if (!mountedRef.current || !isLiveRef.current) return;
        const activePlayer = playerRef.current;
        if (!activePlayer) return;
        jumpToLiveEdge(activePlayer);
      }, delay);
    }
  }, [isLive, jumpToLiveEdge]);

  // Keep live-only streams pinned to the live edge (no DVR rewind).
  useEffect(() => {
    if (!liveOnly) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !liveOnlyRef.current) return;
      try {
        const yt = getYT();
        const playerState = (player as any).getPlayerState?.();
        if (yt && playerState !== yt.PlayerState.PLAYING && playerState !== yt.PlayerState.BUFFERING) {
          return;
        }
        const drift = getLiveDrift(player);
        if (drift > LIVE_EDGE_THRESHOLD_SEC) {
          jumpToLiveEdge(player);
        }
      } catch {
        /* noop */
      }
    }, 8_000);

    return () => clearInterval(interval);
  }, [liveOnly, jumpToLiveEdge]);

  const play = useCallback((): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (liveOnly) {
        jumpToLiveEdge(player, { unmute: true, force: true });
      } else {
        if (isLive && isMutedRef.current) {
          (player as any).unMute();
          isMutedRef.current = false;
          if (mountedRef.current) {
            setState((prev) => ({ ...prev, isMuted: false }));
          }
        }
        (player as any).playVideo();
      }
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          phase: prev.phase === "loading" ? "ready" : prev.phase,
          isCued: false,
          ...(liveOnly ? { isAtLiveEdge: true, isPlaying: true } : {}),
        }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [isLive, liveOnly, jumpToLiveEdge]);

  const pause = useCallback((): void => {
    if (liveOnlyRef.current) return;
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

      if (liveOnlyRef.current) {
        jumpToLiveEdge(player, { unmute: true, force: true });
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isAtLiveEdge: true, isPlaying: true }));
        }
        return;
      }

      if ((player as any).getPlayerState() === yt.PlayerState.PLAYING) {
        (player as any).pauseVideo();
      } else {
        (player as any).playVideo();
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [jumpToLiveEdge]);

  const seekTo = useCallback((seconds: number): void => {
    if (liveOnly) {
      seekToLive();
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    try {
      const rawDuration = (player as any).getDuration?.() ?? 0;
      const duration = sanitizeStreamTime(rawDuration);

      if (isLive) {
        seekingToLiveUntilRef.current = 0;

        if (duration <= 0) {
          seekToLive();
          return;
        }

        const safeSeconds = sanitizeStreamTime(seconds);
        const nearLiveEdge =
          duration > 0 &&
          (safeSeconds >= duration - LIVE_EDGE_THRESHOLD_SEC ||
            safeSeconds / duration >= 0.95);

        if (nearLiveEdge) {
          seekToLive();
          return;
        }
      }

      const clamped =
        duration > 0
          ? Math.max(0, Math.min(sanitizeStreamTime(seconds), duration))
          : Math.max(0, sanitizeStreamTime(seconds));

      (player as any).seekTo(clamped, true);
      (player as any).playVideo();

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          currentTime: clamped,
          isPlaying: true,
          isAtLiveEdge: computeIsAtLiveEdge(
            clamped,
            duration || prev.duration,
            isLive,
            seekingToLiveUntilRef.current,
          ),
        }));
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [isLive, liveOnly, seekToLive]);

  const seekRelative = useCallback((delta: number): void => {
    if (isLive || liveOnly) return;
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
  }, [isLive, liveOnly]);

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

      // Re-enforce quality after speed change.
      // YouTube's adaptive bitrate algorithm downgrades quality when
      // speed increases (especially at 2x) to reduce decoding load.
      const preferred = preferredQualityRef.current;
      if (preferred && preferred !== "auto" && preferred !== "default") {
        // Reset enforcement counter — new speed is a new context
        qualityEnforceCountRef.current = 0;

        // Soft enforcement first (no seek — avoids visible stutter)
        enforceQuality(player, preferred, false);

        // Delayed hard enforcement with micro-seek: YouTube sometimes
        // downgrades quality asynchronously ~300-500ms after a speed change.
        // The seek forces it to re-buffer at our preferred quality.
        if (qualityEnforceTimerRef.current) {
          clearTimeout(qualityEnforceTimerRef.current);
        }
        qualityEnforceTimerRef.current = setTimeout(() => {
          if (!mountedRef.current || !playerRef.current) return;
          // Only hard-enforce if YouTube actually downgraded
          try {
            const currentQ = (playerRef.current as any).getPlaybackQuality();
            if (currentQ !== preferred) {
              enforceQuality(playerRef.current, preferred, true);
            }
          } catch {
            /* noop */
          }
        }, 600);
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [enforceQuality]);

  const setQuality = useCallback((quality: string): void => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const normalized = normalizeQualityValue(quality, state.availableQualities);

      // Clear any pending quality enforcement timers
      if (qualityEnforceTimerRef.current) {
        clearTimeout(qualityEnforceTimerRef.current);
        qualityEnforceTimerRef.current = null;
      }

      if (normalized === "auto" || normalized === "default") {
        // "Auto" mode: let YouTube manage quality adaptively
        preferredQualityRef.current = null;
        try {
          const anyPlayer = player as any;
          if (typeof anyPlayer.setPlaybackQualityRange === "function") {
            // Set range from lowest to highest to allow full adaptive range
            const qualities = anyPlayer.getAvailableQualityLevels() || [];
            if (qualities.length > 1) {
              const lowest = qualities[qualities.length - 1];
              const highest = qualities[0];
              anyPlayer.setPlaybackQualityRange(lowest, highest);
            }
          }
          anyPlayer.setPlaybackQuality("default");
        } catch {
          /* noop */
        }
      } else {
        // Locked quality mode: persist preference and enforce it with seek
        preferredQualityRef.current = normalized;
        qualityEnforceCountRef.current = 0;
        enforceQuality(player, normalized, true);
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, currentQuality: normalized }));
      }
    } catch {
      /* noop */
    }
  }, [state.availableQualities, enforceQuality]);

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
