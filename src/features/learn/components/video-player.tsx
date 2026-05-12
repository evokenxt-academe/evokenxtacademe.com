"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";

import { extractYouTubeId } from "../hooks";
import type { FlatLecture } from "../types";

/* ================================================================ */
/*  Constants & Types                                               */
/* ================================================================ */

const QUALITY_LEVELS = {
  highres: { label: "4K+", order: 0 },
  hd2160: { label: "4K", order: 1 },
  hd1440: { label: "1440p", order: 2 },
  hd1080: { label: "1080p", order: 3 },
  hd720: { label: "720p", order: 4 },
  large: { label: "480p", order: 5 },
  medium: { label: "360p", order: 6 },
  small: { label: "240p", order: 7 },
} as const;

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

type QualityLevel = keyof typeof QUALITY_LEVELS;
type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface VideoPlayerProps {
  lecture: FlatLecture | null;
  onVideoEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
}

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  loadedFraction: number;
  isLoading: boolean;
  isFullscreen: boolean;
  playbackSpeed: PlaybackSpeed;
  selectedQuality: QualityLevel | "auto";
  actualQuality: QualityLevel | "";
  availableQualities: QualityLevel[];
}

/* ================================================================ */
/*  Utilities                                                       */
/* ================================================================ */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  if ((window as any).YT?.Player) return Promise.resolve();

  ytApiPromise = new Promise<void>((resolve) => {
    (window as any).onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

function styleIframe(player: any) {
  try {
    const iframe = player.getIframe();
    if (iframe) {
      iframe.style.pointerEvents = "none";
      iframe.style.position = "absolute";
      iframe.style.top = "-60px";
      iframe.style.left = "-1%";
      iframe.style.width = "102%";
      iframe.style.height = "calc(100% + 120px)";
    }
  } catch { }
}

/* ================================================================
 *  enforceQuality
 *
 *  DUAL-STRATEGY quality enforcement (both must be applied):
 *
 *  Strategy A — vq param (set at player creation via playerVars):
 *    YouTube reads this as the initial quality hint from the embed URL.
 *    Works well for higher qualities (720p+) but YouTube may ignore it
 *    for lower qualities like 360p/240p if it deems the connection capable
 *    of more.
 *
 *  Strategy B — player.setPlaybackQualityRange(min, max) JS method:
 *    This is a REAL method on the YT.Player instance (not postMessage).
 *    Setting both min and max to the same level forces YouTube to stay
 *    within that range. This is what actually makes 360p stick.
 *    Must be called AFTER onReady fires (player is fully initialised).
 *
 *  Together: vq ensures the video loads at the right quality from the
 *  start; setPlaybackQualityRange prevents YouTube from auto-upgrading
 *  during playback.
 * ================================================================ */
function enforceQuality(player: any, quality: QualityLevel | "auto") {
  if (!player) return;
  try {
    if (quality === "auto") {
      // Release the quality lock — let YouTube choose freely
      if (typeof player.setPlaybackQualityRange === "function") {
        player.setPlaybackQualityRange("small", "highres");
      }
    } else {
      // Lock both min and max to the same level
      if (typeof player.setPlaybackQualityRange === "function") {
        player.setPlaybackQualityRange(quality, quality);
      }
      // Fallback: also call the single-quality setter if available
      if (typeof player.setPlaybackQuality === "function") {
        player.setPlaybackQuality(quality);
      }
    }
  } catch { }
}

/* ================================================================ */
/*  Main Component                                                  */
/* ================================================================ */

export function VideoPlayer({
  lecture,
  onVideoEnd,
  onTimeUpdate,
}: VideoPlayerProps) {
  // containerRef: the outermost div — used for fullscreen AND as the
  // portal target for DropdownMenuContent so it stays visible in fullscreen.
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Refs for values YT callbacks must always read fresh (avoids stale closures)
  const volumeRef = useRef<number>(100);
  const isMutedRef = useRef<boolean>(true);
  const playbackSpeedRef = useRef<PlaybackSpeed>(1);
  // Keeps the chosen quality accessible inside onReady without closure issues
  const selectedQualityRef = useRef<QualityLevel | "auto">("auto");

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isMuted: true,
    volume: 100,
    currentTime: 0,
    duration: 0,
    loadedFraction: 0,
    isLoading: true,
    isFullscreen: false,
    playbackSpeed: 1,
    selectedQuality: "auto",
    actualQuality: "",
    availableQualities: [],
  });

  const [timelineState, setTimelineState] = useState({
    isHovering: false,
    isDragging: false,
    hoverX: 0,
    hoverTime: 0,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const videoId = extractYouTubeId(lecture?.video_url ?? null);

  // Keep refs in sync so YT callbacks always see the latest values
  useEffect(() => {
    volumeRef.current = state.volume;
    isMutedRef.current = state.isMuted;
    playbackSpeedRef.current = state.playbackSpeed;
    selectedQualityRef.current = state.selectedQuality;
  }, [state.volume, state.isMuted, state.playbackSpeed, state.selectedQuality]);

  /* ----------------------------------------------------------------
   *  createPlayer
   *
   *  Destroys the current YT.Player instance and recreates it fresh.
   *  Called on initial mount and on quality changes.
   *
   *  After onReady fires we ALSO call enforceQuality() (Strategy B)
   *  to lock the quality range via the JS API — this is what makes
   *  low qualities like 360p actually stick.
   * --------------------------------------------------------------- */
  const createPlayer = useCallback(
    (
      startSeconds: number,
      quality: QualityLevel | "auto",
      wasPlaying: boolean,
    ) => {
      if (!videoId || !playerDivRef.current) return;

      // Update ref immediately so onReady closure reads the right value
      selectedQualityRef.current = quality;

      try { playerRef.current?.destroy(); } catch { }
      playerRef.current = null;

      // YT.Player replaces the target div with an iframe. After destroy()
      // that element is gone — inject a fresh div before each creation.
      const container = playerDivRef.current.parentElement;
      if (!container) return;
      const newDiv = document.createElement("div");
      newDiv.style.width = "100%";
      newDiv.style.height = "100%";
      container.replaceChild(newDiv, playerDivRef.current);
      (playerDivRef as any).current = newDiv;

      setState((prev) => ({ ...prev, isLoading: true }));

      const YT = (window as any).YT;

      // playerVars.vq = Strategy A quality hint (works well for high qualities)
      const playerVars: Record<string, any> = {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        autoplay: 1,
        mute: 1, // always start muted for autoplay policy; restored in onReady
        enablejsapi: 1,
        origin: window.location.origin,
        playsinline: 1,
        showinfo: 0,
        iv_load_policy: 3,
        disablekb: 0,
        fs: 0,
        cc_load_policy: 0,
        start: Math.floor(startSeconds),
      };

      if (quality !== "auto") {
        playerVars.vq = quality;
      }

      playerRef.current = new YT.Player(newDiv, {
        videoId,
        playerVars,
        events: {
          onReady: (event: any) => {
            const player = event.target;
            styleIframe(player);

            // Restore volume / mute / speed from refs (always fresh)
            try {
              player.setVolume(volumeRef.current);
              if (!isMutedRef.current) player.unMute();
              if (playbackSpeedRef.current !== 1)
                player.setPlaybackRate(playbackSpeedRef.current);
            } catch { }

            // Strategy B: lock quality range via JS API.
            // This is what makes 360p / 240p actually stick — vq alone
            // is not enough for lower qualities.
            enforceQuality(player, selectedQualityRef.current);

            setState((prev) => ({
              ...prev,
              isLoading: false,
              duration: player.getDuration() || prev.duration,
              actualQuality: player.getPlaybackQuality() || prev.actualQuality,
            }));

            if (wasPlaying) {
              try { player.playVideo(); } catch { }
            }
          },

          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            const player = event.target;

            switch (event.data) {
              case YT.PlayerState.PLAYING: {
                // Collect quality list here — returns [] in onReady (not buffered yet)
                const levels: string[] = player.getAvailableQualityLevels() || [];
                const validQualities = levels
                  .filter((q): q is QualityLevel => q in QUALITY_LEVELS)
                  .sort(
                    (a, b) =>
                      QUALITY_LEVELS[a].order - QUALITY_LEVELS[b].order,
                  );

                // Re-enforce quality on every PLAYING event.
                // YouTube can reset the quality lock after buffering/seeking —
                // calling it here ensures it sticks for the lifetime of playback.
                enforceQuality(player, selectedQualityRef.current);

                setState((prev) => ({
                  ...prev,
                  isPlaying: true,
                  isLoading: false,
                  duration: player.getDuration() || prev.duration,
                  actualQuality:
                    player.getPlaybackQuality() || prev.actualQuality,
                  availableQualities:
                    validQualities.length > 0
                      ? validQualities
                      : prev.availableQualities,
                }));
                break;
              }

              case YT.PlayerState.PAUSED:
                setState((prev) => ({ ...prev, isPlaying: false }));
                break;

              case YT.PlayerState.ENDED:
                setState((prev) => ({ ...prev, isPlaying: false }));
                onVideoEnd();
                break;
            }
          },

          onPlaybackQualityChange: (event: any) => {
            setState((prev) => ({ ...prev, actualQuality: event.data }));
          },

          onError: () => {
            setState((prev) => ({ ...prev, isLoading: false }));
          },
        },
      });
    },
    [videoId, onVideoEnd],
  );

  /* ---- Initialize player on lecture / videoId change ---- */
  useEffect(() => {
    if (!videoId || !lecture) return;

    let isCancelled = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (isCancelled) return;

      setState((prev) => ({
        isPlaying: false,
        isMuted: prev.isMuted,
        volume: prev.volume,
        currentTime: 0,
        duration: 0,
        loadedFraction: 0,
        isLoading: true,
        isFullscreen: !!document.fullscreenElement,
        playbackSpeed: prev.playbackSpeed,
        selectedQuality: "auto",
        actualQuality: "",
        availableQualities: [],
      }));

      createPlayer(0, "auto", false);
    };

    init();

    return () => {
      isCancelled = true;
      try { playerRef.current?.destroy(); } catch { }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, lecture]);

  /* ---- Poll for currentTime / buffered / quality ---- */
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const loadedFraction = player.getVideoLoadedFraction();
        const actualQuality = player.getPlaybackQuality();

        setState((prev) => ({
          ...prev,
          currentTime,
          duration: duration > 0 ? duration : prev.duration,
          loadedFraction,
          actualQuality: actualQuality || prev.actualQuality,
        }));

        onTimeUpdate(currentTime, duration);
      } catch { }
    }, 250);

    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  /* ---- Fullscreen handling ---- */
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement || !!(document as any).webkitFullscreenElement,
      }));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isFallbackFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFallbackFullscreen]);

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "arrowleft":
          seekRelative(-10);
          break;
        case "arrowright":
          seekRelative(10);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.isMuted, state.currentTime, state.duration]);

  /* ---- Player controls ---- */
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (state.isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch { }
  }, [state.isPlaying]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (isMutedRef.current) {
        player.unMute();
        isMutedRef.current = false;
        setState((prev) => ({ ...prev, isMuted: false }));
      } else {
        player.mute();
        isMutedRef.current = true;
        setState((prev) => ({ ...prev, isMuted: true }));
      }
    } catch { }
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const volume = value[0];
    const player = playerRef.current;
    if (!player) return;
    try {
      player.setVolume(volume);
      if (volume > 0) {
        player.unMute();
        isMutedRef.current = false;
      } else {
        player.mute();
        isMutedRef.current = true;
      }
      volumeRef.current = volume;
      setState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
    } catch { }
  }, []);

  /* ----------------------------------------------------------------
   *  handleQualityChange
   *
   *  Captures timestamp + playing state, then recreates the player
   *  with the new quality. onReady will call enforceQuality() (Strategy B)
   *  to lock the range via the JS API after the player is ready.
   * --------------------------------------------------------------- */
  const handleQualityChange = useCallback(
    (quality: QualityLevel | "auto") => {
      setIsSettingsOpen(false);
      const player = playerRef.current;
      if (!player || !videoId) return;

      let currentTime = 0;
      let wasPlaying = false;

      try {
        currentTime = player.getCurrentTime() || 0;
        const YT = (window as any).YT;
        wasPlaying = player.getPlayerState() === YT.PlayerState.PLAYING;
      } catch { }

      setState((prev) => ({ ...prev, selectedQuality: quality }));
      createPlayer(currentTime, quality, wasPlaying);
    },
    [videoId, createPlayer],
  );

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.setPlaybackRate(speed);
      playbackSpeedRef.current = speed;
      setState((prev) => ({ ...prev, playbackSpeed: speed }));
      setIsSettingsOpen(false);
    } catch { }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement || isFallbackFullscreen) {
        if (isFallbackFullscreen) {
          setIsFallbackFullscreen(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        }
      } else {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => setIsFallbackFullscreen(true));
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        } else {
          setIsFallbackFullscreen(true);
        }
      }
    } catch {
      setIsFallbackFullscreen(!isFallbackFullscreen);
    }
  }, [isFallbackFullscreen]);

  const seekTo = useCallback(
    (fraction: number) => {
      const player = playerRef.current;
      if (!player || state.duration <= 0) return;
      try {
        const time = fraction * state.duration;
        player.seekTo(time, true);
        setState((prev) => ({ ...prev, currentTime: time }));
      } catch { }
    },
    [state.duration],
  );

  const seekRelative = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player || state.duration <= 0) return;
      try {
        const newTime = Math.max(
          0,
          Math.min(state.duration, state.currentTime + seconds),
        );
        player.seekTo(newTime, true);
        setState((prev) => ({ ...prev, currentTime: newTime }));
      } catch { }
    },
    [state.currentTime, state.duration],
  );

  /* ---- Timeline interaction ---- */
  const getTimelineFraction = useCallback(
    (e: React.MouseEvent | MouseEvent): number => {
      const bar = progressRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    },
    [],
  );

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const fraction = getTimelineFraction(e);
      seekTo(fraction);
      setTimelineState((prev) => ({ ...prev, isDragging: true }));
    },
    [getTimelineFraction, seekTo],
  );

  const handleTimelineMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const fraction = getTimelineFraction(e);
      setTimelineState((prev) => ({
        ...prev,
        hoverX: fraction,
        hoverTime: fraction * state.duration,
      }));
    },
    [getTimelineFraction, state.duration],
  );

  useEffect(() => {
    if (!timelineState.isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const fraction = getTimelineFraction(e);
      setTimelineState((prev) => ({
        ...prev,
        hoverX: fraction,
        hoverTime: fraction * state.duration,
      }));
      seekTo(fraction);
    };

    const handleUp = () => {
      setTimelineState((prev) => ({ ...prev, isDragging: false }));
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [timelineState.isDragging, getTimelineFraction, seekTo, state.duration]);

  /* ---- Computed values ---- */
  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const buffered = state.loadedFraction * 100;

  const activeFullscreen = state.isFullscreen || isFallbackFullscreen;

  /* ---- Empty states ---- */
  if (!lecture) {
    return (
      <div className="relative w-full aspect-video rounded-lg border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Select a lecture to begin
        </p>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="relative w-full aspect-video rounded-lg border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Video unavailable for this lecture
        </p>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-black select-none group overflow-hidden",
        activeFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-black"
          : "aspect-video rounded-lg border shadow-lg",
      )}
    >
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      )}

      {/* YouTube player mount point */}
      <div className="absolute inset-0 overflow-hidden">
        <div ref={playerDivRef} className="w-full h-full" />
      </div>

      {/* Click overlay for play/pause */}
      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={togglePlay}
      />

      {/* Controls container */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-30 flex flex-col transition-opacity duration-300",
          timelineState.isDragging
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        {/* Timeline */}
        <div
          ref={progressRef}
          className="relative w-full cursor-pointer px-4 pb-2 group/timeline"
          onMouseEnter={() =>
            setTimelineState((prev) => ({ ...prev, isHovering: true }))
          }
          onMouseLeave={() =>
            setTimelineState((prev) => ({ ...prev, isHovering: false }))
          }
          onMouseMove={handleTimelineMouseMove}
          onMouseDown={handleTimelineMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hover tooltip */}
          {(timelineState.isHovering || timelineState.isDragging) &&
            state.duration > 0 && (
              <div
                className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none z-40"
                style={{ left: `${timelineState.hoverX * 100}%` }}
              >
                <div className="rounded-md bg-popover border px-2 py-1 text-xs font-medium shadow-lg">
                  {formatTime(timelineState.hoverTime)}
                </div>
              </div>
            )}

          {/* Progress bar track */}
          <div className="relative h-1 group-hover/timeline:h-1.5 transition-all duration-150">
            <div className="absolute inset-0 bg-muted-foreground/30 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-muted-foreground/50 transition-[width] duration-500"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Scrubber thumb */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-[opacity,transform] duration-150",
                timelineState.isHovering || timelineState.isDragging
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-0",
              )}
              style={{ left: `${progress}%` }}
            >
              <div className="h-3 w-3 rounded-full bg-primary border-2 border-background shadow-lg" />
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/80 to-transparent px-4 pb-3 pt-2">
          <div className="flex items-center justify-between gap-2">

            {/* ── Left controls ── */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="text-white hover:text-white hover:bg-white/20"
              >
                {state.isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {state.isMuted || state.volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300">
                  <Slider
                    value={[state.isMuted ? 0 : state.volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="text-xs text-white/90 font-mono tabular-nums ml-1">
                <span>{formatTime(state.currentTime)}</span>
                <span className="text-white/50 mx-1">/</span>
                <span className="text-white/70">{formatTime(state.duration)}</span>
              </div>
            </div>

            {/* ── Right controls ── */}
            <div className="flex items-center gap-2">
              {state.actualQuality &&
                QUALITY_LEVELS[state.actualQuality as QualityLevel] && (
                  <span className="text-xs font-semibold text-white/90 px-2 py-1 rounded bg-white/10">
                    {QUALITY_LEVELS[state.actualQuality as QualityLevel].label}
                  </span>
                )}

              {state.playbackSpeed !== 1 && (
                <span className="text-xs font-semibold text-white/90 px-2 py-1 rounded bg-white/10">
                  {state.playbackSpeed}x
                </span>
              )}

              {/* ----------------------------------------------------------------
               *  Settings dropdown
               *
               *  FIX: DropdownMenuContent uses the `container` prop pointing
               *  to containerRef.current (the player's outermost div).
               *
               *  WHY: By default shadcn/Radix portals the dropdown content to
               *  document.body. When the player is in fullscreen mode, the browser
               *  only renders elements INSIDE the fullscreen element — anything
               *  portaled to body becomes invisible and unclickable.
               *
               *  Setting container={containerRef.current} makes the portal append
               *  inside the fullscreen element, so the dropdown is always visible
               *  regardless of fullscreen state.
               * --------------------------------------------------------------- */}
              <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48"
                  // Portal into the player container — visible in fullscreen
                  container={containerRef.current}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => handleQualityChange("auto")}
                    className={cn(
                      "cursor-pointer",
                      state.selectedQuality === "auto" && "bg-accent",
                    )}
                  >
                    <span className="flex-1">Auto</span>
                    {state.selectedQuality === "auto" && (
                      <span className="text-primary">✓</span>
                    )}
                  </DropdownMenuItem>

                  {state.availableQualities.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <span className="text-muted-foreground text-xs italic">
                        Play video to load qualities
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    state.availableQualities.map((quality) => (
                      <DropdownMenuItem
                        key={quality}
                        onClick={() => handleQualityChange(quality)}
                        className={cn(
                          "cursor-pointer",
                          state.selectedQuality === quality && "bg-accent",
                        )}
                      >
                        <span className="flex-1">
                          {QUALITY_LEVELS[quality].label}
                        </span>
                        {state.selectedQuality === quality && (
                          <span className="text-primary">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        "cursor-pointer",
                        state.playbackSpeed === speed && "bg-accent",
                      )}
                    >
                      <span className="flex-1">
                        {speed === 1 ? "Normal" : `${speed}x`}
                      </span>
                      {state.playbackSpeed === speed && (
                        <span className="text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white hover:text-white hover:bg-white/20"
              >
                {state.isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}