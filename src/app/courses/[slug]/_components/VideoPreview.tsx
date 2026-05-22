"use client";

import { useState, useEffect } from "react";
import { YtcnPlayer } from "@/components/ytcn/components/ytcn/ytcn-player";

interface VideoPreviewProps {
  videoId: string | null;
  courseTitle: string;
}

export function VideoPreview({ videoId, courseTitle }: VideoPreviewProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    // Simple check for viewport — sticky only on desktop
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsSticky(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSticky(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500">No preview available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${isSticky ? "lg:sticky lg:top-24" : ""}`}
    >
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-950/50 bg-black">
        <YtcnPlayer
          videoId={videoId}
          autoplay={false}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
