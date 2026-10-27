/**
 * GET a public API path from the server (the sitemap, page metadata), cached
 * for `revalidate` seconds. Null on any failure, so callers can fall back.
 * The browser goes through the axios client in src/api instead.
 */
export async function fetchPublicJson<T>(path: string, revalidate = 3600): Promise<T | null> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  if (!base) return null;
  try {
    const res = await fetch(`${base}/${path.replace(/^\/+/, "")}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
