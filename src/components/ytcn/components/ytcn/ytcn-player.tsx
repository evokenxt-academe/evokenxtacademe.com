"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useYtcnPlayer } from "@/components/ytcn/hooks/ytcn/use-ytcn-player";
import { useKeyboardShortcuts } from "@/components/ytcn/hooks/ytcn/use-keyboard-shortcuts";
import { useThumbnail } from "@/components/ytcn/hooks/ytcn/use-thumbnail";
import type {
  YtcnPlayerOptions,
  KeyboardBindings,
} from "./types";
import { YtcnControls } from "./ytcn-controls";
import { VideoForensicWatermark } from "./video-forensic-watermark";
import { useIdleControls } from "@/components/ytcn/hooks/ytcn/use-idle-controls";
import { 
  IconPlayerPlayFilled, 
  IconPlayerPauseFilled,
  IconLoader2, 
  IconBrandYoutube, 
  IconAlertCircle,
  IconRewindBackward10,
  IconRewindForward10,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsRight
} from "@tabler/icons-react";

/* ================================================================ */
/*  Props                                                            */
/* ================================================================ */

export interface YtcnPlayerProps extends Omit<YtcnPlayerOptions, "thumbnailFailed"> {
  /** Enable built-in keyboard shortcuts (default: true) */
  keyboardShortcuts?: boolean;
  /** Override default keyboard bindings */
  keyboardBindings?: KeyboardBindings;
  /** Additional CSS class for the outer container */
  className?: string;
}

/* ================================================================ */
/*  YtcnPlayer                                                       */
/* ================================================================ */

/**
 * YtcnPlayer — Top-level composed YouTube player with thumbnail-first loading.
 *
 * Phase lifecycle:
 *   1. "thumbnail" — Shows CDN thumbnail instantly, zero iframe loaded.
 *   2. "loading"   — Thumbnail stays visible, iframe initializing in background.
 *   3. "ready"     — Video playing, thumbnail fades out, controls shown.
 *
 * For full customisation, use the `useYtcnPlayer` hook directly and
 * compose your own UI.
 */
export function YtcnPlayer({
  videoId,
  autoplay = false,
  isLive = false,
  defaultSpeed = 1,
  startAt = 0,
  onEnd,
  onTimeUpdate,
  onPlaybackRateChange,
  keyboardShortcuts = true,
  keyboardBindings,
  className,
  forensicUserId,
}: YtcnPlayerProps): React.JSX.Element {
  // ── Thumbnail probe — tries CDN URLs in priority order ──
  const { thumbnailUrl, thumbnailLoaded, thumbnailFailed } = useThumbnail(videoId);

  // ── Core player hook ──
  const { containerRef, playerDivRef, state, controls } = useYtcnPlayer({
    videoId,
    autoplay,
    isLive,
    defaultSpeed,
    startAt,
    onEnd,
    onTimeUpdate,
    onPlaybackRateChange,
    thumbnailFailed,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (state.isPlaying) {
      setHasPlayed(true);
    }
  }, [state.isPlaying]);

  useEffect(() => {
    setHasPlayed(false);
  }, [videoId]);

  const { controlsVisible, showControls, toggleControls } = useIdleControls({
    isPlaying: state.isPlaying,
    isFullscreen: state.isFullscreen,
    isSettingsOpen,
  });

  // Controls visibility — handled by useIdleControls and group-hover
  const [isHovering, setIsHovering] = useState(false);
  const [lastTouchTs, setLastTouchTs] = useState(0);

  // States & Refs for Mobile Touch Gestures
  const [isHolding2x, setIsHolding2x] = useState(false);
  const [activeRipple, setActiveRipple] = useState<"left" | "right" | null>(null);

  const finalControlsVisible = controlsVisible && !isHolding2x;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preHoldRateRef = useRef<number | null>(null);
  const isHoldActiveRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setIsTouchDevice(media.matches || navigator.maxTouchPoints > 0);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcuts — only active during "ready" phase
  useKeyboardShortcuts({
    enabled: keyboardShortcuts && state.phase === "ready",
    onPlay: controls.togglePlay,
    onMute: controls.toggleMute,
    onFullscreen: controls.toggleFullscreen,
    onSeekBack: () => {
      if (!state.isLive) controls.seekRelative(-10);
    },
    onSeekForward: () => {
      if (!state.isLive) controls.seekRelative(10);
    },
    bindings: keyboardBindings,
  });

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Video player"
      className={cn(
        "relative w-full bg-black select-none overflow-hidden",
        state.isFullscreen && !finalControlsVisible && "cursor-none",
        state.isFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-screen bg-black"
          : "aspect-video rounded-none sm:rounded-lg group",
        className
      )}
      onMouseEnter={() => {
        setIsHovering(true);
        showControls();
      }}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => {
        if (!isHovering) setIsHovering(true);
        showControls();
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════
       *  z-0 — YouTube iframe (only mounted when phase !== "thumbnail")
       *
       *  No iframe exists during thumbnail phase. Zero YouTube JS loaded.
       *  This prevents any branding from appearing before user intent.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase !== "thumbnail" && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div ref={playerDivRef} className="w-full h-full" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-10 — Black cover (blocks YouTube branding during loading)
       *
       *  Sits above iframe during "loading" phase to prevent any flash
       *  of YouTube's red play button or watermark.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "loading" && (
        <div className="absolute inset-0 z-10 bg-black/90" aria-hidden="true" />
      )}

      {state.phase === "loading" && isLive && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-50 flex justify-center">
          <div className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10">
            Connecting to live broadcast…
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-20 — Thumbnail (visible in thumbnail + loading, fades in ready)
       *
       *  The thumbnail image stays on screen while the iframe loads behind
       *  it. When phase becomes "ready", opacity transitions to 0 over
       *  500ms, creating a seamless reveal of the already-playing video.
       * ═══════════════════════════════════════════════════════════════ */}
      {thumbnailUrl && !isLive && (
        <div
          className={cn(
            "absolute inset-0 z-20 transition-opacity duration-500",
            (state.phase === "ready" && hasPlayed) ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            aria-hidden="true"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-20 — Pulsing placeholder while thumbnail image fetches
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "thumbnail" && !thumbnailLoaded && !thumbnailFailed && (
        <div className="absolute inset-0 z-20 bg-muted animate-pulse" />
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-40 — Loading spinner (shown during loading phase)
       *
       *  Visible in "loading" (while iframe initializes).
       *  pointer-events-none so click/touch passes through.
       * ═══════════════════════════════════════════════════════════════ */}
      {state.phase === "loading" && (
        <>
          <div className="absolute inset-0 z-21 bg-black/50 pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            aria-label="Loading video"
          >
            <IconLoader2 className="h-10 w-10 animate-spin text-white/80" />
          </div>
        </>
      )}

      {/* Centered Play Button Overlay */}
      {(state.phase === "thumbnail" && thumbnailLoaded) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            showControls();
            if (state.phase === "thumbnail") {
              controls.handleThumbnailClick();
            } else {
              controls.play();
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            showControls();
            if (state.phase === "thumbnail") {
              controls.handleThumbnailClick();
            } else {
              controls.play();
            }
          }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-transparent border-0 cursor-pointer touch-manipulation group/center-play"
          aria-label="Play video"
        >
          <div
            className={cn(
              "flex items-center justify-center",
              "h-16 w-16 rounded-full",
              "bg-black/60 text-white shadow-xl ring-1 ring-white/10",
              "transition-transform duration-200",
              "group-hover/center-play:scale-110",
            )}
          >
            <IconPlayerPlayFilled className="h-8 w-8 translate-x-0.5" fill="currentColor" />
          </div>
          {state.isLive && state.isMuted ? (
            <span className="absolute bottom-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white/90">
              Tap to play with sound
            </span>
          ) : null}
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  z-[25] + z-30 — Click overlay + Controls (ready phase only)
       *
       *  Only rendered once the video is playing. The click overlay
       *  intercepts clicks for play/pause. Controls bar sits at bottom.
       * ═══════════════════════════════════════════════════════════════ */}
      {forensicUserId && state.phase === "ready" && (
        <VideoForensicWatermark userId={forensicUserId} />
      )}

      {state.phase === "ready" && (
        <>
          <div
            className="absolute inset-0 z-25 cursor-pointer touch-manipulation"
            onClick={controls.togglePlay}
            onDoubleClick={(e) => {
              e.preventDefault();
              controls.toggleFullscreen();
            }}
            onTouchStart={(e) => {
              if (state.isPlaying) {
                const touch = e.touches[0];
                touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                isHoldActiveRef.current = false;

                if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
                
                holdTimeoutRef.current = setTimeout(() => {
                  isHoldActiveRef.current = true;
                  setIsHolding2x(true);
                  preHoldRateRef.current = state.playbackRate;
                  controls.setSpeed(2); // Set speed to 2x
                  
                  if (typeof navigator !== "undefined" && navigator.vibrate) {
                    try {
                      navigator.vibrate(60);
                    } catch (err) {}
                  }
                }, 350); // 350ms hold detection
              }
            }}
            onTouchMove={(e) => {
              if (!touchStartRef.current) return;
              const touch = e.touches[0];
              const diffX = Math.abs(touch.clientX - touchStartRef.current.x);
              const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
              
              if (diffX > 15 || diffY > 15) {
                if (holdTimeoutRef.current) {
                  clearTimeout(holdTimeoutRef.current);
                  holdTimeoutRef.current = null;
                }
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              
              if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
                holdTimeoutRef.current = null;
              }

              if (isHolding2x || isHoldActiveRef.current) {
                const prevSpeed = preHoldRateRef.current ?? 1;
                controls.setSpeed(prevSpeed as any);
                setIsHolding2x(false);
                isHoldActiveRef.current = false;
                touchStartRef.current = null;
                return;
              }

              const now = Date.now();
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const touch = e.changedTouches[0];
              const x = touch.clientX - rect.left;
              const zone = x < rect.width * 0.33 ? "left" : x > rect.width * 0.66 ? "right" : "center";
              const isDoubleTap = now - lastTouchTs < 280;

              setLastTouchTs(now);

              if (isDoubleTap) {
                if (zone === "left" && !state.isLive) {
                  controls.seekRelative(-10);
                  setActiveRipple("left");
                  if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
                  rippleTimeoutRef.current = setTimeout(() => setActiveRipple(null), 600);
                  showControls();
                  return;
                }
                if (zone === "right" && !state.isLive) {
                  controls.seekRelative(10);
                  setActiveRipple("right");
                  if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
                  rippleTimeoutRef.current = setTimeout(() => setActiveRipple(null), 600);
                  showControls();
                  return;
                }
              }

              if (isTouchDevice) {
                toggleControls();
              } else {
                controls.togglePlay();
              }
            }}
            onTouchCancel={() => {
              if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
                holdTimeoutRef.current = null;
              }
              if (isHolding2x || isHoldActiveRef.current) {
                const prevSpeed = preHoldRateRef.current ?? 1;
                controls.setSpeed(prevSpeed as any);
                setIsHolding2x(false);
                isHoldActiveRef.current = false;
              }
              touchStartRef.current = null;
            }}
            aria-label="Toggle playback or controls"
            role="button"
            tabIndex={-1}
          />

          {/* Double Tap Ripple Overlays */}
          {activeRipple === "left" && (
            <div className="absolute inset-y-0 left-0 w-1/3 bg-white/5 rounded-r-full pointer-events-none flex flex-col items-center justify-center z-26 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 rounded-r-full scale-0 animate-yt-ripple origin-left" />
              <div className="relative z-10 flex flex-col items-center gap-1 text-white/95">
                <div className="flex gap-0.5">
                  <IconChevronLeft className="size-5 animate-bounce-left" />
                  <IconChevronLeft className="size-5 animate-bounce-left [animation-delay:75ms]" />
                  <IconChevronLeft className="size-5 animate-bounce-left [animation-delay:150ms]" />
                </div>
                <span className="text-xs font-semibold tracking-wider">-10s</span>
              </div>
            </div>
          )}

          {activeRipple === "right" && (
            <div className="absolute inset-y-0 right-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none flex flex-col items-center justify-center z-26 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 rounded-l-full scale-0 animate-yt-ripple origin-right" />
              <div className="relative z-10 flex flex-col items-center gap-1 text-white/95">
                <div className="flex gap-0.5">
                  <IconChevronRight className="size-5 animate-bounce-right" />
                  <IconChevronRight className="size-5 animate-bounce-right [animation-delay:75ms]" />
                  <IconChevronRight className="size-5 animate-bounce-right [animation-delay:150ms]" />
                </div>
                <span className="text-xs font-semibold tracking-wider">+10s</span>
              </div>
            </div>
          )}

          {/* Centered Controls Overlay (Play/Pause, Rewind, Fast Forward) */}
          <div
            className={cn(
              "absolute inset-0 z-30 flex items-center justify-center gap-8 pointer-events-none transition-opacity duration-300",
              (isTouchDevice && finalControlsVisible) ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Center Rewind 10s */}
            {!state.isLive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  controls.seekRelative(-10);
                  showControls();
                }}
                className="pointer-events-auto flex items-center justify-center h-12 w-12 rounded-full bg-black/50 text-white shadow-lg border border-white/10 transition-all duration-200 hover:bg-black/70 hover:scale-110 active:scale-95"
                aria-label="Rewind 10 seconds"
              >
                <IconRewindBackward10 className="size-6" />
              </button>
            )}

            {/* Center Play/Pause */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                controls.togglePlay();
                showControls();
              }}
              className="pointer-events-auto flex items-center justify-center h-16 w-16 rounded-full bg-black/60 text-white shadow-xl border border-white/15 transition-all duration-200 hover:bg-black/80 hover:scale-115 active:scale-90"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <IconPlayerPauseFilled className="size-8" />
              ) : (
                <IconPlayerPlayFilled className="size-8 translate-x-0.5" />
              )}
            </button>

            {/* Center Forward 10s */}
            {!state.isLive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  controls.seekRelative(10);
                  showControls();
                }}
                className="pointer-events-auto flex items-center justify-center h-12 w-12 rounded-full bg-black/50 text-white shadow-lg border border-white/10 transition-all duration-200 hover:bg-black/70 hover:scale-110 active:scale-95"
                aria-label="Forward 10 seconds"
              >
                <IconRewindForward10 className="size-6" />
              </button>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <YtcnControls
            state={state}
            onTogglePlay={controls.togglePlay}
            onSeek={controls.seekTo}
            onVolumeChange={controls.setVolume}
            onToggleMute={controls.toggleMute}
            onSpeedChange={controls.setSpeed}
            onToggleFullscreen={controls.toggleFullscreen}
            onSeekToLive={controls.seekToLive}
            visible={finalControlsVisible}
            containerRef={containerRef}
            onSettingsOpenChange={setIsSettingsOpen}
            onInteraction={showControls}
            isTouchDevice={isTouchDevice}
          />
        </>
      )}

      {/* 2X Speed Hold Overlay Pill */}
      {isHolding2x && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[45] pointer-events-none transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white shadow-xl ring-1 ring-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <IconChevronsRight className="size-3.5 text-red-500 animate-pulse" />
            <span>2X SPEED</span>
          </div>
        </div>
      )}

      {state.errorCode !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center select-text">
          <div className="mb-4 rounded-full bg-red-500/10 p-3 ring-1 ring-red-500/20">
            <IconBrandYoutube className="h-8 w-8 text-red-500 animate-pulse" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-100 tracking-tight">
            {state.errorCode === 101 || state.errorCode === 150
              ? "YouTube Playback Restricted"
              : "Video Playback Error"}
          </h3>
          <p className="mb-6 max-w-md text-sm text-zinc-400 leading-relaxed">
            {state.errorCode === 101 || state.errorCode === 150
              ? "YouTube has restricted playback on external websites for this video/stream. You can watch it directly on YouTube."
              : "YouTube encountered an error playing this video. It may be private, deleted, or restricted."}
            {isLive && (
              <span className="block mt-2.5 text-xs text-zinc-500 font-medium">
                You can watch the stream on YouTube and keep this tab open to participate in the live chat and mark your attendance.
              </span>
            )}
            <span className="block mt-3 text-xs text-zinc-500 font-normal italic">
              Note for host: If this is your channel, ensure "Allow embedding" is checked in your YouTube Studio stream/video settings.
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white",
                "bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              )}
            >
              <IconBrandYoutube className="h-4 w-4" />
              Watch on YouTube
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
