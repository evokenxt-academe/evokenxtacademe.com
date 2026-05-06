"use client";

import { useState, useEffect } from "react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface UseThumbnailReturn {
  /** URL of the best available thumbnail, or null if still probing */
  thumbnailUrl: string | null;
  /** True once a thumbnail URL has been successfully loaded */
  thumbnailLoaded: boolean;
  /** True if all thumbnail URLs failed (private/embeds-disabled videos) */
  thumbnailFailed: boolean;
}

/* ================================================================ */
/*  Thumbnail priority                                               */
/* ================================================================ */

/**
 * THUMBNAIL_PRIORITY — Ordered list of YouTube thumbnail URLs by quality.
 *
 * maxresdefault (1280×720) — highest quality but not always available.
 * hqdefault (480×360) — available for most videos.
 * mqdefault (320×180) — always available.
 * default (120×90) — always available, lowest quality fallback.
 *
 * WHY new Image() and not <img> onError in JSX:
 *   React remounts <img> elements on src change causing visible flicker.
 *   Imperative Image() probing happens off-screen with no DOM side effects.
 */
const THUMBNAIL_PRIORITY = (id: string): string[] => [
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  `https://i.ytimg.com/vi/${id}/default.jpg`,
];

/* ================================================================ */
/*  useThumbnail                                                     */
/* ================================================================ */

/**
 * useThumbnail — Probes YouTube CDN for the best available thumbnail.
 *
 * Tries URLs in priority order using imperative Image() objects.
 * Returns the first URL that loads successfully. If all fail
 * (private/embeds-disabled videos), sets thumbnailFailed=true.
 *
 * @param videoId - YouTube video ID, or null to clear state.
 */
export function useThumbnail(videoId: string | null): UseThumbnailReturn {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setThumbnailUrl(null);
      setThumbnailLoaded(false);
      setThumbnailFailed(false);
      return;
    }

    // Reset on videoId change
    setThumbnailUrl(null);
    setThumbnailLoaded(false);
    setThumbnailFailed(false);

    const urls = THUMBNAIL_PRIORITY(videoId);
    let cancelled = false;
    let i = 0;

    const tryNext = (): void => {
      if (cancelled || i >= urls.length) {
        if (!cancelled) setThumbnailFailed(true);
        return;
      }
      const img = new Image();
      const url = urls[i++]!;
      img.onload = () => {
        if (!cancelled) {
          setThumbnailUrl(url);
          setThumbnailLoaded(true);
        }
      };
      img.onerror = tryNext;
      img.src = url;
    };

    tryNext();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return { thumbnailUrl, thumbnailLoaded, thumbnailFailed };
}
