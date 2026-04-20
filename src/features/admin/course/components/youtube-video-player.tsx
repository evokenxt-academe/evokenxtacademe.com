"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const QUALITY_MAP: Record<string, { label: string; badge: string }> = {
  highres: { label: "4K+", badge: "text-amber-400" },
  hd2160: { label: "4K", badge: "text-amber-400" },
  hd1440: { label: "1440p", badge: "text-orange-400" },
  hd1080: { label: "1080p", badge: "text-green-400" },
  hd720: { label: "720p", badge: "text-blue-400" },
  large: { label: "480p", badge: "text-zinc-400" },
  medium: { label: "360p", badge: "text-zinc-500" },
  small: { label: "240p", badge: "text-zinc-600" },
};

const QUALITY_ORDER = [
  "highres",
  "hd2160",
  "hd1440",
  "hd1080",
  "hd720",
  "large",
  "medium",
  "small",
];

type YoutubePlayerApi = {
  getIframe: () => HTMLIFrameElement | null;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
  getPlaybackQuality: () => string;
  getDuration: () => number;
  getCurrentTime: () => number;
  getVideoLoadedFraction: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  loadVideoById: (params: {
    videoId: string;
    startSeconds?: number;
    suggestedQuality?: string;
  }) => void;
  destroy: () => void;
};

type YoutubeNamespace = {
  Player: new (
    element: HTMLElement,
    config: {
      videoId: string;
      playerVars: Record<string, unknown>;
      events: {
        onReady?: (event: { target: YoutubePlayerApi }) => void;
        onStateChange?: (event: {
          target: YoutubePlayerApi;
          data: number;
        }) => void;
        onPlaybackQualityChange?: (event: { data: string }) => void;
      };
    },
  ) => YoutubePlayerApi;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYTApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;

  if (window.YT?.Player) {
    ytApiPromise = Promise.resolve();
    return ytApiPromise;
  }

  ytApiPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    window.onYouTubeIframeAPIReady = () => resolve();

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () =>
      reject(new Error("Failed to load YouTube iframe API"));
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      const searchId = url.searchParams.get("v");
      if (searchId) return searchId;

      const segments = url.pathname.split("/").filter(Boolean);
      const knownPrefixes = ["embed", "shorts", "live"];
      if (segments.length >= 2 && knownPrefixes.includes(segments[0])) {
        return segments[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function YoutubeVideoPlayer({
  videoUrl,
  className,
}: {
  videoUrl: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerApi | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const videoId = useMemo(() => extractYoutubeVideoId(videoUrl), [videoUrl]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState("default");
  const [actualQuality, setActualQuality] = useState("");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedFraction, setLoadedFraction] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [apiError, setApiError] = useState("");

  const selectedQualityRef = useRef(selectedQuality);
  selectedQualityRef.current = selectedQuality;

  const forceQuality = useCallback(
    (player: YoutubePlayerApi, quality: string) => {
      if (quality === "default") {
        player.setPlaybackQuality("default");
        try {
          const iframe = player.getIframe();
          iframe?.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: "setPlaybackQualityRange",
              args: ["small", "highres"],
            }),
            "*",
          );
        } catch {
          // ignore
        }
        return;
      }

      player.setPlaybackQuality(quality);
      try {
        const iframe = player.getIframe();
        iframe?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "setPlaybackQualityRange",
            args: [quality, quality],
          }),
          "*",
        );
      } catch {
        // ignore
      }
    },
    [],
  );

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      if (!videoId) {
        setIsLoading(false);
        return;
      }

      try {
        await loadYTApi();
        if (destroyed || !playerDivRef.current || !window.YT?.Player) return;

        const yt = window.YT;

        playerRef.current = new yt.Player(playerDivRef.current, {
          videoId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: videoId,
            enablejsapi: 1,
            iv_load_policy: 3,
            disablekb: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (destroyed) return;
              setIsLoading(false);

              const player = event.target;

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
              } catch {
                // ignore
              }

              const levels = player.getAvailableQualityLevels() || [];
              const filtered = levels
                .filter(
                  (quality) =>
                    quality !== "auto" &&
                    quality !== "default" &&
                    QUALITY_MAP[quality],
                )
                .sort(
                  (a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b),
                );

              if (filtered.length > 0) {
                setAvailableQualities(filtered);
              }

              const quality = selectedQualityRef.current;
              forceQuality(player, quality);
              setActualQuality(player.getPlaybackQuality());
              setDuration(player.getDuration());
            },
            onStateChange: (event) => {
              if (destroyed) return;

              const ytState = window.YT?.PlayerState;
              const player = event.target;

              if (!ytState) return;

              if (event.data === ytState.PLAYING) {
                setIsPlaying(true);

                const quality = selectedQualityRef.current;
                forceQuality(player, quality);

                const levels = player.getAvailableQualityLevels() || [];
                const filtered = levels
                  .filter(
                    (level) =>
                      level !== "auto" &&
                      level !== "default" &&
                      QUALITY_MAP[level],
                  )
                  .sort(
                    (a, b) =>
                      QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b),
                  );

                if (filtered.length > 0) {
                  setAvailableQualities(filtered);
                }

                setActualQuality(player.getPlaybackQuality());
                setDuration(player.getDuration());
              } else if (event.data === ytState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === ytState.BUFFERING) {
                const quality = selectedQualityRef.current;
                forceQuality(player, quality);
              }
            },
            onPlaybackQualityChange: (event) => {
              if (destroyed) return;
              setActualQuality(event.data);
            },
          },
        });
      } catch (error) {
        if (!destroyed) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Unable to load the YouTube player",
          );
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      destroyed = true;

      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }

      playerRef.current = null;
    };
  }, [forceQuality, videoId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;

      try {
        setCurrentTime(player.getCurrentTime());

        const nextDuration = player.getDuration();
        if (nextDuration > 0) {
          setDuration(nextDuration);
        }

        setLoadedFraction(player.getVideoLoadedFraction());

        const nextQuality = player.getPlaybackQuality();
        if (nextQuality) {
          setActualQuality(nextQuality);
        }
      } catch {
        // player may be destroyed
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      void containerRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "f" && event.key !== "F") return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;

      toggleFullscreen();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleFullscreen]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
      return;
    }

    player.playVideo();
    setIsPlaying(true);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isMuted) {
      player.unMute();
      setIsMuted(false);
      return;
    }

    player.mute();
    setIsMuted(true);
  }, [isMuted]);

  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextVolume = Number.parseInt(event.target.value, 10);
      setVolume(nextVolume);

      const player = playerRef.current;
      if (!player) return;

      player.setVolume(nextVolume);

      if (nextVolume > 0 && isMuted) {
        player.unMute();
        setIsMuted(false);
      } else if (nextVolume === 0) {
        player.mute();
        setIsMuted(true);
      }
    },
    [isMuted],
  );

  const handleQualityChange = useCallback(
    (quality: string) => {
      setSelectedQuality(quality);
      setIsSettingsOpen(false);

      const player = playerRef.current;
      if (!player || !videoId) return;

      forceQuality(player, quality);

      const startSeconds = player.getCurrentTime();
      if (quality !== "default") {
        player.loadVideoById({
          videoId,
          startSeconds,
          suggestedQuality: quality,
        });
        window.setTimeout(() => forceQuality(player, quality), 500);
        window.setTimeout(() => forceQuality(player, quality), 1500);
        return;
      }

      player.loadVideoById({ videoId, startSeconds });
    },
    [forceQuality, videoId],
  );

  const getTimelineFraction = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      const bar = progressRef.current;
      if (!bar) return 0;

      const rect = bar.getBoundingClientRect();
      if (rect.width <= 0) return 0;

      return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    },
    [],
  );

  const seekTo = useCallback(
    (fraction: number) => {
      if (duration <= 0) return;

      const seconds = fraction * duration;
      playerRef.current?.seekTo(seconds, true);
      setCurrentTime(seconds);
    },
    [duration],
  );

  const handleTimelineMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
      const fraction = getTimelineFraction(event);
      seekTo(fraction);
    },
    [getTimelineFraction, seekTo],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: MouseEvent) => {
      const fraction = getTimelineFraction(event);
      setHoverX(fraction);
      setHoverTime(fraction * duration);
      seekTo(fraction);
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [duration, getTimelineFraction, isDragging, seekTo]);

  const handleTimelineMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const fraction = getTimelineFraction(event);
      setHoverX(fraction);
      setHoverTime(fraction * duration);
    },
    [duration, getTimelineFraction],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = loadedFraction * 100;

  const displayQualityInfo =
    actualQuality && QUALITY_MAP[actualQuality]
      ? QUALITY_MAP[actualQuality]
      : null;

  const qualityOptions = [
    { label: "Auto", value: "default", badge: "text-white" },
    ...availableQualities.map((quality) => ({
      label: QUALITY_MAP[quality]?.label ?? quality,
      value: quality,
      badge: QUALITY_MAP[quality]?.badge ?? "text-zinc-400",
    })),
  ];

  if (!videoId) {
    return (
      <div className={className}>
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/80 px-6 text-center">
          <div className="max-w-sm space-y-2">
            <p className="text-sm font-medium text-zinc-100">
              Preview unavailable
            </p>
            <p className="text-xs leading-5 text-zinc-400">
              The uploaded value does not look like a YouTube URL or video ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative w-full select-none overflow-hidden bg-black ${isFullscreen ? "rounded-none border-0" : "aspect-video rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50"} ${className ?? ""}`}
      style={isFullscreen ? { width: "100vw", height: "100vh" } : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
            <div
              className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-red-500 border-r-red-500/20"
              style={{ animationDuration: "1.2s" }}
            />
            <span className="text-lg font-black tracking-tight text-red-500">
              YT
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-400">
            Loading video preview…
          </p>
          {apiError && <p className="mt-2 text-xs text-red-400">{apiError}</p>}
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden">
        <div ref={playerDivRef} className="h-full w-full" />
      </div>

      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={togglePlay}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <div
          ref={progressRef}
          className="group/timeline relative w-full cursor-pointer px-0"
          onMouseEnter={() => setIsHoveringTimeline(true)}
          onMouseLeave={() => setIsHoveringTimeline(false)}
          onMouseMove={handleTimelineMouseMove}
          onMouseDown={handleTimelineMouseDown}
          onClick={(event) => event.stopPropagation()}
        >
          {(isHoveringTimeline || isDragging) && duration > 0 && (
            <div
              className="pointer-events-none absolute bottom-full z-40 mb-2 -translate-x-1/2"
              style={{ left: `${hoverX * 100}%` }}
            >
              <div className="whitespace-nowrap rounded-md border border-zinc-700 bg-black/90 px-2.5 py-1 font-mono text-[11px] font-bold text-white shadow-xl backdrop-blur-sm">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}

          <div className="relative flex h-5 items-end">
            <div
              className={`relative w-full overflow-hidden rounded-full transition-all duration-150 ${isHoveringTimeline || isDragging ? "h-[6px]" : "h-[3px]"}`}
            >
              <div className="absolute inset-0 bg-white/20" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                style={{ width: `${buffered}%` }}
              />
              {(isHoveringTimeline || isDragging) && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                  style={{ width: `${hoverX * 100}%` }}
                />
              )}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-red-500 transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div
              className={`absolute top-1/2 transition-all duration-150 ${isHoveringTimeline || isDragging ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
              style={{
                left: `${progress}%`,
                transform: "translateX(-50%) translateY(calc(-50% + 5px))",
              }}
            >
              <div className="h-[14px] w-[14px] rounded-full bg-red-500 shadow-lg shadow-red-500/30 ring-2 ring-white/20" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-t from-black/90 via-black/70 to-transparent px-4 pb-3 pt-1">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  togglePlay();
                }}
                className="text-zinc-200 transition-colors hover:text-white p-1"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              <div className="group/vol relative flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMute();
                  }}
                  className="text-zinc-300 transition-colors hover:text-white p-1"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeOffIcon className="h-5 w-5" />
                  ) : (
                    <VolumeIcon className="h-5 w-5" />
                  )}
                </button>
                <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 group-hover/vol:w-[72px] group-hover/vol:opacity-100">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(event) => {
                      event.stopPropagation();
                      handleVolumeChange(event);
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="h-1 w-full cursor-pointer accent-white hover:accent-red-500"
                  />
                </div>
              </div>

              <div
                className="ml-1 text-[12px] font-mono tabular-nums text-zinc-400"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="text-zinc-200">{formatTime(currentTime)}</span>
                <span className="mx-1 text-zinc-600">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {displayQualityInfo && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${displayQualityInfo.badge}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {displayQualityInfo.label}
                </span>
              )}
              {!displayQualityInfo && selectedQuality === "default" && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-white"
                  onClick={(event) => event.stopPropagation()}
                >
                  Auto
                </span>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsSettingsOpen((current) => !current);
                  }}
                  className={`p-1 text-zinc-300 transition-all duration-300 hover:text-white ${isSettingsOpen ? "rotate-45 text-white" : ""}`}
                  title="Quality"
                >
                  <SettingsIcon className="h-5 w-5" />
                </button>

                {isSettingsOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] right-0 min-w-[160px] overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/98 shadow-2xl shadow-black/60 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span>Quality</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsSettingsOpen(false);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-zinc-600 transition-colors hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex flex-col py-1">
                      {qualityOptions.map((quality) => (
                        <button
                          key={quality.value}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleQualityChange(quality.value);
                          }}
                          className={`flex items-center justify-between gap-4 px-4 py-2 text-left text-[13px] transition-colors hover:bg-white/5 ${selectedQuality === quality.value ? "font-bold text-white" : "text-zinc-400"}`}
                        >
                          <span className="flex items-center gap-2">
                            {quality.label}
                            {quality.value === "default" && (
                              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                                ADAPTIVE
                              </span>
                            )}
                            {(quality.value === "hd2160" ||
                              quality.value === "highres") && (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                                ULTRA
                              </span>
                            )}
                            {(quality.value === "hd1080" ||
                              quality.value === "hd1440") && (
                              <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-500">
                                HD
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {actualQuality === quality.value &&
                              quality.value !== "default" && (
                                <span className="text-[8px] font-bold text-emerald-400">
                                  ●
                                </span>
                              )}
                            {selectedQuality === quality.value && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-1 text-zinc-300 transition-colors hover:text-white"
                title={isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
              >
                {isFullscreen ? (
                  <ExitFullscreenIcon className="h-5 w-5" />
                ) : (
                  <FullscreenIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );
}
