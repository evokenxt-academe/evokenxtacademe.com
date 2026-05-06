/**
 * formatTime — Converts seconds to a human-readable timestamp string.
 *
 * Returns "H:MM:SS" for videos ≥ 1 hour, "M:SS" otherwise.
 * Handles edge cases: negative values, NaN, Infinity all return "0:00".
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
