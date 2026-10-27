/** Site-wide facts shared by the layout, the SEO files and contact copy. */

export const SITE_NAME = "HashtagBillionaire";

export const SITE_DESCRIPTION =
  "Custom apparel, promotional products and branded merchandise. Add your logo with embroidery, DTF, screen print or DTG and order online.";

/** The one address customers write to (client decision Q58). */
export const CONTACT_EMAIL = "patrick@hashtagbillionaire.com";

/**
 * Canonical origin, used for metadata, the sitemap and robots.txt. The live
 * site answers on both the bare domain and www; links always use this one.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hashtagbillionaire.com").replace(/\/+$/, "");

/** Staging and preview deployments set NEXT_PUBLIC_NOINDEX=true to stay out of search results. */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_NOINDEX !== "true";
