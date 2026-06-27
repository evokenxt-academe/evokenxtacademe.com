/** Longest stream window we treat as valid (48 hours). */
export const MAX_STREAM_SECONDS = 48 * 3600;

export function isValidStreamTime(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds >= 0 && seconds <= MAX_STREAM_SECONDS;
}

export function sanitizeStreamTime(seconds: number, fallback = 0): number {
  return isValidStreamTime(seconds) ? seconds : fallback;
}

/**
 * formatTime — Converts seconds to a human-readable timestamp string.
 *
 * Returns "H:MM:SS" for videos ≥ 1 hour, "M:SS" otherwise.
 * Handles edge cases: negative values, NaN, Infinity, and corrupt live API values.
 */
export function formatTime(seconds: number): string {
  if (!isValidStreamTime(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** How far behind the live edge the viewer is, e.g. "-1:05". */
export function formatLiveBehind(currentTime: number, duration: number): string | null {
  if (!isValidStreamTime(currentTime) || !isValidStreamTime(duration)) return null;
  const behind = Math.max(0, duration - currentTime);
  if (behind <= 15) return null;
  return `-${formatTime(behind)}`;
}
