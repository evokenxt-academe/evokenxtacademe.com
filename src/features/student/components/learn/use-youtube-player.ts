"use client";

import { useCallback, useEffect, useRef, useState } from "react";



// YouTube Player States
const YT_UNSTARTED = -1;
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;
const YT_CUED = 5;

// ─── Player State ─────────────────────────────────────────────────

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isBuffering: boolean;
  isReady: boolean;
  hasError: boolean;
  quality: YouTubeQuality;
  availableQualities: YouTubeQuality[];
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
export type YouTubeQuality =
  | "auto"
  | "small"
  | "medium"
  | "large"
  | "hd720"
  | "hd1080"
  | "highres";

// ─── Extract YouTube video ID from URL ────────────────────────────

export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /studio\.youtube\.com\/video\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // bare video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ─── Load YouTube IFrame API script ───────────────────────────────

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;
  if (typeof window !== "undefined" && window.YT?.Player) {
    return Promise.resolve();
  }

  apiLoadPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined") return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;

    window.onYouTubeIframeAPIReady = () => resolve();

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);
  });

  return apiLoadPromise;
}

// ─── Hook ─────────────────────────────────────────────────────────

interface UseYouTubePlayerOptions {
  containerId: string;
  videoId: string | null;
  onVideoEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function useYouTubePlayer({
  containerId,
  videoId,
  onVideoEnd,
  onTimeUpdate,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onVideoEndRef = useRef(onVideoEnd);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
    playbackRate: 1,
    isBuffering: false,
    isReady: false,
    hasError: false,
    quality: "auto",
    availableQualities: ["auto"],
  });

  const syncQualityState = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const available = player.getAvailableQualityLevels?.() ?? [];
      const current = (player.getPlaybackQuality?.() as YouTubeQuality | undefined) ?? "auto";
      setState((prev) => ({
        ...prev,
        quality: current,
        availableQualities: [
          "auto",
          ...available.filter((q): q is YouTubeQuality => Boolean(q && q !== "auto")),
        ],
      }));
    } catch {
      // ignore read errors while player transitions
    }
  }, []);

  // ── Time update polling ──
  const startTimePolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      try {
        const currentTime = player.getCurrentTime() ?? 0;
        const duration = player.getDuration() ?? 0;
        setState((prev) => ({ ...prev, currentTime, duration }));
        onTimeUpdateRef.current?.(currentTime, duration);
      } catch {
        // Player might be destroyed
      }
    }, 500);
  }, []);

  const stopTimePolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Initialize / destroy player ──
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (destroyed) return;

      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isReady: false,
        hasError: false,
        isBuffering: true,
        currentTime: 0,
        duration: 0,
      }));

      playerRef.current = new (window as any).YT.Player(containerId, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,           // Hide default controls
          disablekb: 1,          // Disable default keyboard (we handle it)
          enablejsapi: 1,
          iv_load_policy: 3,     // Hide annotations
          modestbranding: 1,     // Minimize YouTube branding
          rel: 0,                // No related videos at end
          showinfo: 0,           // Hide title bar
          fs: 0,                 // Hide default fullscreen button
          cc_load_policy: 0,     // Captions off by default
          controlslist: "nodownload noplaybackrate",
          playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: any) => {
            if (destroyed) return;
            const dur = event.target.getDuration() ?? 0;
            setState((prev) => ({
              ...prev,
              isReady: true,
              isBuffering: false,
              duration: dur,
            }));
            syncQualityState();
          },
          onStateChange: (event: any) => {
            if (destroyed) return;
            syncQualityState();
            switch (event.data) {
              case YT_PLAYING:
                setState((prev) => ({ ...prev, isPlaying: true, isBuffering: false }));
                startTimePolling();
                break;
              case YT_PAUSED:
                setState((prev) => ({ ...prev, isPlaying: false, isBuffering: false }));
                stopTimePolling();
                break;
              case YT_BUFFERING:
                setState((prev) => ({ ...prev, isBuffering: true }));
                break;
              case YT_ENDED:
                setState((prev) => ({ ...prev, isPlaying: false, isBuffering: false }));
                stopTimePolling();
                onVideoEndRef.current?.();
                break;
              case YT_CUED:
              case YT_UNSTARTED:
                setState((prev) => ({ ...prev, isPlaying: false, isBuffering: false }));
                break;
            }
          },
          onError: () => {
            if (destroyed) return;
            setState((prev) => ({
              ...prev,
              hasError: true,
              isBuffering: false,
              isReady: false,
            }));
            stopTimePolling();
          },
        },
      });
    };

    init();

    return () => {
      destroyed = true;
      stopTimePolling();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerId, startTimePolling, stopTimePolling]);

  // ── Controls ──

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) pause();
    else play();
  }, [state.isPlaying, play, pause]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setState((prev) => ({ ...prev, currentTime: seconds }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    playerRef.current?.setVolume(clamped);
    if (clamped > 0) playerRef.current?.unMute();
    setState((prev) => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (state.isMuted) {
      player.unMute();
      player.setVolume(state.volume || 50);
      setState((prev) => ({ ...prev, isMuted: false, volume: prev.volume || 50 }));
    } else {
      player.mute();
      setState((prev) => ({ ...prev, isMuted: true }));
    }
  }, [state.isMuted, state.volume]);

  const setPlaybackRate = useCallback((rate: PlaybackSpeed) => {
    playerRef.current?.setPlaybackRate(rate);
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const setQuality = useCallback((quality: YouTubeQuality) => {
    const player = playerRef.current;
    if (!player) return;
    if (quality === "auto") {
      player.setPlaybackQuality?.("default");
      setState((prev) => ({ ...prev, quality: "auto" }));
      return;
    }
    player.setPlaybackQuality?.(quality);
    setState((prev) => ({ ...prev, quality }));
  }, []);

  return {
    state,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setQuality,
    playerRef,
  };
}
