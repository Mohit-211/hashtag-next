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
//   (id/title/slug) as the ones under the plain Category tree. Clicking the
//   Use Case row itself checks/unchecks that use case as a whole: its own id
//   is sent to `ProductsByUseCaseApi` (via `use_case_ids`), not the ids of
//   the categories listed under it.
export interface UseCase {
  slug?: string;
  id: number;
  title: string;
  image?: string;
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
/** Which filter a pill stands for — what removing it clears. */
export type PillTarget =
  | { kind: "search" }
  | { kind: "category" }
  | { kind: "parent"; grandId: number; id: number }
  | { kind: "industry" }
  | { kind: "industryCategory"; id: number }
  | { kind: "useCase"; industryId: number | null; useCaseId: number }
  | { kind: "brand"; id: number | string }
  | { kind: "size" | "color" | "gender" | "fabric"; value: string }
  | { kind: "tier" }
  | { kind: "inStock" }
  | { kind: "price" };

export interface Pill {
  key: string;
  label: string;
  target: PillTarget;
}

export type SortValue = SortOption["value"];

// ── Raw API rows (before normalisation). Field names differ between
// endpoints — title vs name, product_count vs count — hence the optionals.
export interface RawCategoryNode {
  id: number;
  title?: string;
  name?: string;
  category_name?: string;
  slug?: string;
  description?: string;
  image?: string;
  product_count?: number;
  productsCount?: number;
  count?: number;
}

export interface RawGrandCategory extends RawCategoryNode {
  parent_categories?: RawCategoryNode[];
}

export interface RawUseCase extends RawCategoryNode {
  sort_order?: number;
  is_active?: boolean;
  parent_categories?: RawCategoryNode[];
}

export interface RawIndustry extends RawCategoryNode {
  use_cases?: RawUseCase[];
}

export interface RawBrand {
  id: number;
  name?: string;
  brand_name?: string;
  slug?: string;
  logo_url?: string | null;
  product_count?: number;
  count?: number;
}

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
  tier: string;
  industry: Industry;
  industryCategories: SelectedIndustryCategory[];
}