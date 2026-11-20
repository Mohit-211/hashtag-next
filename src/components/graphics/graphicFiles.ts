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

/**
 * The only files customers can upload as artwork (BUG-033), by extension and
 * the MIME type browsers give it. Saved graphics are not re-checked.
 */
const UPLOAD_MIME_TYPES = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["svg", "image/svg+xml"],
  ["webp", "image/webp"],
]);
export const GRAPHIC_UPLOAD_ACCEPT = [...UPLOAD_MIME_TYPES.keys()].map((ext) => `.${ext}`).join(",");
export const GRAPHIC_UPLOAD_FORMATS = "PNG, JPG, JPEG, SVG or WEBP";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

/** PNG, JPEG or WebP by its first bytes, whatever the file is called. */
const isRasterImage = (head: Uint8Array) =>
  startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ||
  startsWith(head, [0xff, 0xd8, 0xff]) ||
  (startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8));

/** Index just after the next `marker`, or the end of the text. */
const after = (text: string, marker: string, from: number) => {
  const at = text.indexOf(marker, from);
  return at === -1 ? text.length : at + marker.length;
};

/** An SVG document: past any XML declaration, comments and doctype, the root element is <svg>. */
const isSvgMarkup = (head: Uint8Array) => {
  const encoding =
    head[0] === 0xff && head[1] === 0xfe ? "utf-16le" : head[0] === 0xfe && head[1] === 0xff ? "utf-16be" : "utf-8";
  const text = new TextDecoder(encoding).decode(head);
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) i += 1;
    else if (text.startsWith("<?", i)) i = after(text, "?>", i + 2);
    else if (text.startsWith("<!--", i)) i = after(text, "-->", i + 4);
    else if (/^<!doctype/i.test(text.slice(i, i + 9))) {
      // The doctype may carry an internal subset: <!DOCTYPE svg [ <!ENTITY …> ]>
      const subset = text.indexOf("[", i);
      const close = text.indexOf(">", i);
      i = subset !== -1 && subset < close ? after(text, ">", after(text, "]", subset)) : after(text, ">", i);
    } else return /^<(?:[\w.-]+:)?svg[\s/>]/i.test(text.slice(i, i + 64));
  }
  return false;
};

// Room for long editor comments and doctypes before the <svg> tag.
const SVG_SNIFF_BYTES = 256 * 1024;

/**
 * Why `file` can't be uploaded as artwork, or null when it can. Checks the
 * extension, the MIME type, the size and the first bytes, so a ZIP renamed to
 * .png is rejected too.
 */
export async function graphicUploadError(file: File): Promise<string | null> {
  const ext = fileExtension(file.name);
  const mime = UPLOAD_MIME_TYPES.get(ext);
  const wrongType = `${file.name} isn't a ${GRAPHIC_UPLOAD_FORMATS} file. Please choose another file.`;
  // Browsers leave the type empty only for extensions they don't know; the bytes still decide.
  if (!mime || (file.type !== "" && file.type.toLowerCase() !== mime)) return wrongType;
  if (file.size > GRAPHIC_MAX_BYTES) {
    return `${file.name} is larger than ${GRAPHIC_MAX_MB} MB. Please choose a smaller file.`;
  }
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, ext === "svg" ? SVG_SNIFF_BYTES : 16).arrayBuffer());
  } catch {
    return `We couldn't read ${file.name}. Please choose it again.`;
  }
  return (ext === "svg" ? isSvgMarkup(head) : isRasterImage(head)) ? null : wrongType;
}

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
