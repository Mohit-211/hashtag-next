/** Shown wherever an image is missing or can't be resolved. */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";

/**
 * Turns an API image path into a usable URL: absolute URLs pass through,
 * relative paths are joined onto NEXT_PUBLIC_IMAGE_URL, and anything that
 * can't be resolved falls back to the placeholder.
 */
export function resolveImageSrc(image?: string | null): string {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith("http")) return image;

  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
  if (!base) return PLACEHOLDER_IMAGE;

  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}
