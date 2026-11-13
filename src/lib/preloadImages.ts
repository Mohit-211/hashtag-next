import { resolveProxiedSrc } from "@/components/ProxyImage";

// URLs already requested this session; the browser cache (the proxy sends a
// one-day Cache-Control) keeps the bytes, this just avoids re-asking.
const requested = new Set<string>();

/**
 * Warm the browser cache with images that are likely to be shown next (e.g.
 * other colours of a product), so switching to them is instant. Uses the same
 * URL ProxyImage will request, otherwise the cache entry wouldn't be reused.
 */
export function preloadImages(srcs: Array<string | null | undefined>): void {
  if (typeof window === "undefined") return;
  for (const src of srcs) {
    if (!src) continue;
    const url = resolveProxiedSrc(src);
    if (requested.has(url)) continue;
    requested.add(url);
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }
}
