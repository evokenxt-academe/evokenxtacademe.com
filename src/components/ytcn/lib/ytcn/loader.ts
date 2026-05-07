/**
 * loadYouTubeAPI — Singleton YouTube IFrame API loader.
 *
 * Idempotent: multiple calls from different components share a single script
 * load and a single global `onYouTubeIframeAPIReady` callback. Returns a
 * promise that resolves once `YT.Player` is available on window.
 *
 * SSR-safe: guards all `window` access behind a typeof check. In SSR
 * environments (Next.js App Router, Remix, etc.) this returns a resolved
 * promise that does nothing.
 */

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  // SSR guard — no window in server environments
  if (typeof window === "undefined") return Promise.resolve();

  // Already loaded (e.g. user included the script manually)
  const ytWindow = window as unknown as YTWindow;
  if (ytWindow.YT?.Player) return Promise.resolve();

  // Singleton: return existing promise if we've already started loading
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    (window as unknown as YTWindow).onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

/**
 * styleIframe — Offsets the YouTube iframe to crop native chrome.
 *
 * YouTube renders its own controls bar (~60px tall) at the bottom of the
 * iframe. Since the iframe is cross-origin, we can't remove these via CSS
 * inside the iframe. Instead we push the iframe 60px above its container
 * and add 120px to its total height, effectively cropping the native bar
 * out of the visible area.
 *
 * The slight horizontal overflow (102% width, -1% left) accounts for
 * YouTube's thin side borders on some resolutions.
 *
 * `pointerEvents: none` ensures any remaining clickable YouTube chrome
 * is blocked — our overlay div handles all user interaction instead.
 */
export function styleIframe(player: YT.Player): void {
  try {
    const iframe = player.getIframe();
    if (iframe) {
      iframe.style.pointerEvents = "none";
      iframe.style.position = "absolute";
      iframe.style.top = "-80px";
      iframe.style.left = "-1%";
      iframe.style.width = "102%";
      iframe.style.height = "calc(100% + 160px)";
    }
  } catch {
    /* player.getIframe() can throw if player is in a destroyed state */
  }
}
