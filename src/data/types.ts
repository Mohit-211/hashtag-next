// ─────────────────────────────────────────────────────────────────────────
// Shared types for the Categories feature.
// ─────────────────────────────────────────────────────────────────────────
import type { SortOption } from "@/data/typesproduct";
export type Section =
  | "profile"
  | "addresses"
  | "password"
  | "orders"
  | "saved"
  | "logout";

export interface Brand {
  logo: string;
  id: number | string;
  name: string;
  slug: string;
  count?: number;
}

export interface ParentCategory {
  slug?: string;
  id: number;
  title: string;
  count?: number;
}

// A checked sub-category, tagged with which top-level (grand) category it
// belongs to. The sidebar tree (and the header's hover dropdown) allow
// checking sub-categories under several DIFFERENT grand categories at once
// (e.g. Apparel & Uniforms > T-Shirt and Business Cards > Standard
// together), so each selection remembers its own parent so we can build
// pills, remove individual selections, and group correctly.
export interface SelectedSubCategory extends ParentCategory {
  grandId: number;
  grandName: string;
}

export interface GrandCategory {
  id: number | null;
  name: string;
  slug?: string;
  count?: number;
  parent_categories?: ParentCategory[];
}

// ── Industry / Use-case facet — same cross-parent multi-select pattern as
// Category/ParentCategory above, but THREE levels deep for `IndustryApi`:
//   Industry (grand) -> Use Case (mid) -> parent_categories (real, checkable
//   categories, e.g. Tech & Startups -> Employee Onboarding Kits -> Hats,
//   Drinkware, Bags). The leaf `parent_categories` here are the SAME shape
//   (id/title/slug) as the ones under the plain Category tree, and checking
//   one filters products by `category_id` exactly like the Category tree
//   does. Clicking the Use Case row itself is a "select all" shortcut for
//   every category listed under it — it never sends its own id to the API,
//   only the ids of the categories it expands to.
export interface UseCase {
  slug?: string;
  id: number;
  title: string;
  sort_order?: number;
  is_active?: boolean;
  count?: number;
  parent_categories?: ParentCategory[];
}

// A checked REAL category nested three levels deep under an Industry > Use
// Case. Tagged with both ancestors so pills/removal/highlighting can group
// correctly, and kept in a SEPARATE state from `activeParents` (the plain
// Category tree's selection) to avoid id-namespace collisions — but its ids
// are merged into the same `category_id` API param as activeParents.
export interface SelectedIndustryCategory extends ParentCategory {
  industryId: number;
  industryName: string;
  useCaseId: number;
  useCaseName: string;
}

export interface Industry {
  id: number | null;
  title: string;
  slug?: string;
  description?: string;
  count?: number;
  use_cases?: UseCase[];
}

export interface CategoriesViewProps {
  initialCategoryId?: string;
  initialCategorySlug?: string;
  initialParentId?: string;
  initialParentSlug?: string;
  initialBrandId?: string;
  initialBrandSlug?: string;
  initialIndustryId?: string;
  initialIndustrySlug?: string;
}

// ── Filter pill shown in the topbar ────────────────────────────────────────
export interface Pill {
  key: string;
  label: string;
  onRemove: () => void;
}

export type SortValue = SortOption["value"];

// Params sent to AllProductsApi
export interface FilterParams {
  page: number;
  limit: number;
  search: string;
  sort: SortValue;
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
}