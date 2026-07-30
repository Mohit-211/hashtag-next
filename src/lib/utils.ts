import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────────────────────────────────
// Pure helper functions for the Categories feature.
// ─────────────────────────────────────────────────────────────────────────

import { Brand, GrandCategory, Industry, SelectedIndustryCategory, SelectedSubCategory } from "@/data/types";

export function brandInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Use Case → real category matching helpers ──────────────────────────────
// The Use Case Collections are just plain-English labels ("T-shirts",
// "Drinkware"), not real category ids. To filter products we fuzzy-match
// those labels against the ACTUAL fetched category tree by name, then reuse
// the exact same `activeParents` / `category_id` mechanism the sidebar
// checkboxes already use — no new API params needed.
export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(if added\)/g, "")
    .replace(/[‑-]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function singularize(s: string): string {
  return s
    .split(" ")
    .map((w) => (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
}

export function persistSelection(
  type: string | null,
  id: string | number | null,
  extra?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  try {
    if (type && id !== null && id !== undefined) {
      window.sessionStorage.setItem(
        "activeSelection",
        JSON.stringify({ type, id, ...extra })
      );
    } else {
      window.sessionStorage.removeItem("activeSelection");
    }
  } catch (err) {
    console.error("Error writing selection to sessionStorage:", err);
  }
}

/** Builds the flat query-param object sent to AllProductsApi. Every active
 * multi-select facet is joined into a comma-separated string. */
export function buildFilterParams(opts: {
  page: number;
  limit: number;
  search: string;
  sort: string;
  category: GrandCategory;
  parents: SelectedSubCategory[];
  brands: Brand[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  priceRange: [number, number];
  genders: string[];
  fabrics: string[];
  industry: Industry;
  industryCategories: SelectedIndustryCategory[];
}) {
  const PRICE_MIN = 0;
  const PRICE_MAX = 500;
  const params: Record<string, any> = {
    page: opts.page,
    limit: opts.limit,
  };
  if (opts.sort) params.sort = opts.sort;
  if (opts.search) params.search = opts.search;
  if (opts.brands.length) {
    params.brand_id = opts.brands.map((b) => b.id).join(",");
  }
  // Checked sub-categories from the plain Category tree AND checked real
  // categories from the Industry > Use Case tree are both just categories
  // as far as the API is concerned, so they're merged into ONE comma list
  // on the SAME `category_id` param — never a separate `use_case_id`.
  // They can span several different grand categories / industries at once.
  const allCategoryIds = [
    ...opts.parents.map((p) => p.id),
    ...opts.industryCategories.map((c) => c.id),
  ];
  if (allCategoryIds.length) {
    params.category_id = allCategoryIds.join(",");
  } else if (opts.category?.id != null) {
    // Fallback to the single active grand category id (only reachable
    // for leaf grand categories that have no sub-categories — see
    // handleCategoryTabSelect usage below).
    params.category_id = String(opts.category.id);
  }
  // `industry_id` is only ever sent as a broad, whole-industry filter for
  // a LEAF industry (no use_cases to drill into). The moment any specific
  // category under an industry is checked, that's expressed purely via
  // `category_id` above and `industry_id` is dropped — we never send
  // `use_case_id` to the API at all.
  if (!opts.industryCategories.length && opts.industry?.id != null) {
    params.industry_id = String(opts.industry.id);
  }
  if (opts.sizes.length) params.size = opts.sizes.join(",");
  if (opts.colors.length) params.color = opts.colors.join(",");
  if (opts.inStock) params.in_stock = true;
  if (opts.priceRange[0] > PRICE_MIN) params.min_price = opts.priceRange[0];
  if (opts.priceRange[1] < PRICE_MAX) params.max_price = opts.priceRange[1];
  if (opts.genders.length) params.gender = opts.genders.join(",");
  if (opts.fabrics.length) params.fabric = opts.fabrics.join(",");
  return params;
}