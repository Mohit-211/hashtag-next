import type { SavedGraphic } from "@/api/operations/graphics.api";

export const GRAPHIC_MAX_MB = 100;
export const GRAPHIC_MAX_BYTES = GRAPHIC_MAX_MB * 1024 * 1024;

/**
 * Only for the warning before adding to the cart: the API works out the real
 * fee, and the cart's figure is the final one.
 */
export const GRAPHIC_SETUP_FEE = 35;
export const GRAPHIC_FEE_WAIVED_FROM = 12;

const DRAWABLE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "svg"];

export const fileExtension = (name: string) =>
  name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";

/** AI, EPS, PSD, CDR and the like won't load in an <img> or a canvas. */
export const canDrawGraphic = (graphic: Pick<SavedGraphic, "original_name" | "mime_type">) =>
  DRAWABLE_EXTENSIONS.includes(fileExtension(graphic.original_name)) ||
  /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/i.test(graphic.mime_type ?? "");

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
