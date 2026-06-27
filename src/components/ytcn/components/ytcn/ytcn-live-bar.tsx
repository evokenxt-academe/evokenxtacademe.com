"use client";

import { cn } from "@/lib/utils";

type YtcnLiveBarProps = {
  isPlaying?: boolean;
  className?: string;
};

/** Non-interactive live indicator — no DVR timeline or seek. */
export function YtcnLiveBar({ isPlaying = true, className }: YtcnLiveBarProps) {
  return (
    <div className={cn("relative h-1 w-full overflow-hidden rounded-full bg-white/15", className)}>
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-400",
          isPlaying && "animate-pulse",
        )}
      />
      <div className="absolute inset-y-0 right-0 w-1 rounded-full bg-red-300 shadow-[0_0_8px_rgba(248,113,113,0.9)]" />
    </div>
  );
}
