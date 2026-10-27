import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";

// One shopper's pages, the image proxy and the customizer: nothing to index.
const PRIVATE_PATHS = [
  "/api/",
  "/account",
  "/cart",
  "/checkout",
  "/confirmation",
  "/customization/",
  "/forgot-password",
  "/login",
  "/orders",
  "/payment-history",
  "/reset-password",
  "/saved",
  "/track-order",
  "/verify-email",
];

// Catalog filters and search: endless URL variants of the same products. The
// category, brand and industry pages themselves stay crawlable.
const FILTER_PARAMS = [
  "brand_id",
  "category_id",
  "color",
  "fabric",
  "gender",
  "in_stock",
  "industry_id",
  "max_price",
  "min_price",
  "picker_industry",
  "search",
  "size",
  "sort",
  "tier",
  "use_case_id",
  "variant_id",
];

export default function robots(): MetadataRoute.Robots {
  // Staging and previews: keep every crawler out.
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATHS, ...FILTER_PARAMS.map((param) => `/*?*${param}=`)],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
