"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface YouTubeLivePlayerProps {
  videoId: string;
  isLive?: boolean;
  autoplay?: boolean;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  className?: string;
}



export function YouTubeLivePlayer({
  videoId,
  isLive = false,
  autoplay = false,
  onReady,
  onStateChange,
  className = "",
}: YouTubeLivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !videoId || !(window as any).YT?.Player) return;

    const playerId = `yt-player-${videoId}`;
    const div = document.createElement("div");
    div.id = playerId;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(div);

    playerRef.current = new (window as any).YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        origin: window.location.origin,
        ...(isLive ? { livemonitor: 1 } : {}),
      },
      events: {
        onReady: () => {
          setPlayerReady(true);
          onReady?.();
        },
        onStateChange: (e: any) => {
          onStateChange?.(e.data);
        },
        onError: (e: any) => {
          const errorMessages: Record<number, string> = {
            2: "Invalid video ID",
            5: "HTML5 player error",
            100: "Video not found or private",
            101: "Embedding disabled for this video",
            150: "Embedding disabled for this video",
          };
          setError(errorMessages[e.data] || "Player error occurred");
        },
      },
    });
  }, [autoplay, isLive, onReady, onStateChange, videoId]);

  useEffect(() => {
    if (!videoId) return;

    if ((window as any).YT?.Player) {
      initPlayer();
      return () => {
        playerRef.current?.destroy?.();
      };
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      initPlayer();
    };

    return () => {
      playerRef.current?.destroy?.();
    };
  }, [videoId, initPlayer]);

  if (error) {
    return (
      <div className={`flex aspect-video flex-col items-center justify-center gap-3 rounded-lg bg-muted p-4 text-center ${className}`}>
        <p className="text-sm font-medium text-muted-foreground">{error}</p>
        {videoId && (
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Watch on YouTube
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden rounded-lg bg-black ${className}`}>
      <div ref={containerRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
      {isLive && playerReady ? (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </div>
      ) : null}
    </div>
  );
}
