import { resolveProxiedSrc } from "@/components/ProxyImage";

// URLs already requested this session; the browser cache (the proxy sends a
// one-day Cache-Control) keeps the bytes, this just avoids re-asking.
const requested = new Set<string>();
// Hovering product cards adds every colour's URL, so the set is capped
// (BUG-039). Past the cap the oldest URL is forgotten; asking for it again
// only costs a browser-cache hit.
const MAX_REQUESTED = 200;

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
    if (requested.size >= MAX_REQUESTED) {
      // A Set iterates in insertion order, so its first entry is the oldest.
      const oldest = requested.values().next().value;
      if (oldest !== undefined) requested.delete(oldest);
    }
    requested.add(url);
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }
}
