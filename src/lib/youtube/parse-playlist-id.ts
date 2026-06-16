/**
 * Extract a YouTube playlist ID from a raw ID or URL.
 * Supports: PLxxx, UUxxx, LLxxx, RUxxx, OLAK5uy_xxx
 */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already a playlist ID
  if (/^(PL|UU|LL|RU|OLAK5uy_)[\w-]+$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("list");
    if (listParam) return listParam;

    const segments = url.pathname.split("/").filter(Boolean);
    const listIdx = segments.indexOf("playlist");
    if (listIdx >= 0 && segments[listIdx + 1]) {
      return segments[listIdx + 1];
    }
  } catch {
    return null;
  }

  return null;
}
