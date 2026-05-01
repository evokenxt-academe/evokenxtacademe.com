"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";

interface RecordingVideoPlayerProps {
  videoUrl: string;
  title: string;
  description?: string;
  duration?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export function RecordingVideoPlayer({
  videoUrl,
  title,
  description,
  duration,
  onTimeUpdate,
  onEnded,
}: RecordingVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(100);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [videoDuration, setVideoDuration] = React.useState(duration || 0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Play/Pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Mute/Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Volume control
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
  };

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, videoDuration);
    }
  };

  // Duration loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  // Video ended
  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  // Seek
  const handleSeek = (newTime: number[]) => {
    const time = newTime[0];
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg leading-tight md:text-xl">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
            Recording
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0" ref={containerRef}>
        {/* ── Video Container ──────────────────────────────── */}
        <div className="group relative flex aspect-video items-center justify-center overflow-hidden bg-black">
          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="size-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            crossOrigin="anonymous"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
            </div>
          )}

          {/* Center play button */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={togglePlayPause}
              >
                <IconPlayerPlay size={32} />
              </Button>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Progress bar */}
            <Slider
              value={[currentTime]}
              max={videoDuration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlayPause}
                  className="hover:bg-white/20"
                >
                  {isPlaying ? (
                    <IconPlayerPause size={20} className="text-white" />
                  ) : (
                    <IconPlayerPlay size={20} className="text-white" />
                  )}
                </Button>

                {/* Volume */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="hover:bg-white/20"
                  >
                    {isMuted ? (
                      <IconVolumeOff size={20} className="text-white" />
                    ) : (
                      <IconVolume size={20} className="text-white" />
                    )}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-20 cursor-pointer"
                  />
                </div>

                {/* Time display */}
                <div className="ml-auto text-sm text-white">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </div>
              </div>

              {/* Fullscreen */}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="hover:bg-white/20"
              >
                {isFullscreen ? (
                  <IconMinimize size={20} className="text-white" />
                ) : (
                  <IconMaximize size={20} className="text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
