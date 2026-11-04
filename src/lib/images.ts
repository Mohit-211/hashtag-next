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

/** One gallery image, normalized across suppliers. */
export interface GalleryAsset {
  assetType: string;
  label: string;
  /** Fully resolved image URL. */
  image: string;
}

/** Gallery display order; Front and Back always come last (pinned in the gallery). */
const ASSET_ORDER = [
  "Style", "Product", "ColorProduct", "OnModel_Front", "OnModel_Back", "OnModel_Side",
  "Thumbnail", "ColorSwatch", "Front", "Back",
];

const ASSET_LABELS: Record<string, string> = {
  Style: "Style",
  Product: "Product Image",
  ColorProduct: "Color Product Image",
  OnModel_Front: "On Model Front",
  OnModel_Back: "On Model Back",
  OnModel_Side: "On Model Side",
  Thumbnail: "Thumbnail",
  ColorSwatch: "Color Swatch",
  Front: "Front",
  Back: "Back",
};

/** meta may be an object, a JSON string, or a double-encoded JSON string. */
const parseMeta = (meta: unknown): Record<string, unknown> | null => {
  let parsed: unknown = meta;
  try {
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
  } catch {
    return null;
  }
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
};

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const isAbsoluteUrl = (v: string) => /^https?:\/\//i.test(v);

/* ── S&S Activewear (e.g. Lane Seven): meta.supplier_raw.mediaAssets ── */

/** S&S serves the relative paths in its API (`Images/Color/…`) from this CDN. */
const SS_IMAGE_BASE_URL = "https://cdn.ssactivewear.com/";

const SS_ASSET_TYPES = ["Style", "Front", "Back", "OnModel_Front", "OnModel_Back", "OnModel_Side"];

const resolveSsImage = (path: unknown): string | undefined => {
  const p = str(path);
  if (!p) return undefined;
  return isAbsoluteUrl(p) ? p : `${SS_IMAGE_BASE_URL}${p.replace(/^\//, "")}`;
};

function getSsAssets(variantMeta: Record<string, unknown> | null): GalleryAsset[] | null {
  const raw = variantMeta?.supplier_raw as { mediaAssets?: unknown } | undefined;
  if (!raw || !Array.isArray(raw.mediaAssets)) return null;
  const assets = raw.mediaAssets as Array<{ image?: unknown; assetType?: unknown } | null>;
  return SS_ASSET_TYPES.flatMap((assetType) => {
    const image = resolveSsImage(assets.find((a) => a?.assetType === assetType)?.image);
    return image ? [{ assetType, label: ASSET_LABELS[assetType], image }] : [];
  });
}

/* ── SanMar: product meta.raw_product + variant meta.raw_variant.images ── */

const SANMAR_FIELDS: { field: string; assetType: string }[] = [
  { field: "FRONT_MODEL_IMAGE_URL", assetType: "OnModel_Front" },
  { field: "BACK_MODEL_IMAGE", assetType: "OnModel_Back" },
  { field: "FRONT_FLAT_IMAGE", assetType: "Front" },
  { field: "BACK_FLAT_IMAGE", assetType: "Back" },
  { field: "PRODUCT_IMAGE", assetType: "Product" },
  { field: "COLOR_PRODUCT_IMAGE", assetType: "ColorProduct" },
  { field: "THUMBNAIL_IMAGE", assetType: "Thumbnail" },
  { field: "COLOR_SQUARE_IMAGE", assetType: "ColorSwatch" },
];

const fileNameOf = (url: string) => url.split(/[?#]/)[0].split("/").pop()?.toLowerCase() ?? "";

/**
 * SanMar sends full URLs only in the variant's `raw_variant.images` (and
 * FRONT_MODEL_IMAGE_URL); the other raw_product fields are bare filenames with
 * no published base URL. A field is used only when it is a full URL, or when
 * its filename matches one of those variant URLs. raw_product describes a
 * single colour, so it is ignored unless its COLOR_NAME is the variant's colour.
 */
function getSanmarAssets(
  variantMeta: Record<string, unknown> | null,
  productMeta: Record<string, unknown> | null,
  variantColor: string | null | undefined,
): GalleryAsset[] | null {
  const rawVariant = variantMeta?.raw_variant as { images?: unknown } | undefined;
  const variantUrls = (Array.isArray(rawVariant?.images) ? rawVariant.images : [])
    .map(str)
    .filter((u): u is string => !!u && isAbsoluteUrl(u));

  const rawProduct = productMeta?.raw_product as Record<string, unknown> | undefined;
  const sameColor =
    !!rawProduct && !!variantColor &&
    str(rawProduct.COLOR_NAME)?.toLowerCase() === variantColor.trim().toLowerCase();
  if (!variantUrls.length && !sameColor) return null;

  const byFileName = new Map(variantUrls.map((u) => [fileNameOf(u), u]));
  const result: GalleryAsset[] = [];
  const used = new Set<string>();
  const add = (assetType: string, image: string | undefined) => {
    if (!image || used.has(image) || result.some((a) => a.assetType === assetType)) return;
    used.add(image);
    result.push({ assetType, label: ASSET_LABELS[assetType], image });
  };

  if (sameColor && rawProduct) {
    SANMAR_FIELDS.forEach(({ field, assetType }) => {
      const value = str(rawProduct[field]);
      if (!value) return;
      add(assetType, isAbsoluteUrl(value) ? value : byFileName.get(value.toLowerCase()));
    });
  }
  // Variant URLs not matched above, identified by SanMar's `_model_front` /
  // `_model_back` / `_flat_front` / `_flat_back` file naming.
  variantUrls.forEach((url) => {
    const name = fileNameOf(url);
    const assetType =
      /_model_front\./.test(name) ? "OnModel_Front"
      : /_model_back\./.test(name) ? "OnModel_Back"
      : /_flat_front\./.test(name) ? "Front"
      : /_flat_back\./.test(name) ? "Back"
      : undefined;
    if (assetType) add(assetType, url);
  });
  return result;
}

/**
 * Normalized gallery images for the selected variant, detected from whichever
 * meta structure is present (S&S mediaAssets, or SanMar raw_variant/raw_product).
 * Returns null when no supported structure is found, so callers keep their
 * existing images; null/invalid meta never throws.
 */
export function getGalleryAssets(
  variantMeta: unknown,
  productMeta?: unknown,
  variantColor?: string | null,
): GalleryAsset[] | null {
  const vMeta = parseMeta(variantMeta);
  const assets = getSsAssets(vMeta) ?? getSanmarAssets(vMeta, parseMeta(productMeta), variantColor);
  if (!assets) return null;
  const seen = new Set<string>();
  return assets
    .filter((a) => (seen.has(a.image) ? false : (seen.add(a.image), true)))
    .sort((a, b) => ASSET_ORDER.indexOf(a.assetType) - ASSET_ORDER.indexOf(b.assetType));
}
