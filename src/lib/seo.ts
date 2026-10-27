import type { Metadata } from "next";
import { SITE_NAME } from "./site";

/**
 * Open Graph fields every page shares. A page that sets its own `openGraph`
 * replaces the layout's whole object, so pages spread this first.
 */
export const baseOpenGraph = {
  siteName: SITE_NAME,
  locale: "en_US",
  type: "website",
  images: [{ url: "/assets/hero-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
} satisfies NonNullable<Metadata["openGraph"]>;

/** A public page: its title, search description and canonical path. */
export function publicPage({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, url: path, title: title ? `${title} | ${SITE_NAME}` : SITE_NAME, description },
  };
}

/** A page that belongs to one shopper (cart, account, checkout…): titled, kept out of search results. */
export const privatePage = (title: string): Metadata => ({
  title,
  robots: { index: false, follow: false },
});

const ENTITIES: Record<string, string> = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };

export const decodeEntities = (text: string) => text.replace(/&(amp|nbsp|quot|#39|lt|gt);/g, (m) => ENTITIES[m] ?? m);

/** Plain text from an HTML description, cut to search-snippet length. */
export function toMetaDescription(html: string | null | undefined, max = 160): string | undefined {
  if (!html) return undefined;
  const text = decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const SMALL_WORDS = new Set(["a", "and", "for", "in", "of", "or", "the", "to"]);

/** "apparel-and-uniforms" → "Apparel and Uniforms". Route params arrive already decoded. */
export const titleFromSlug = (slug?: string) =>
  (slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
