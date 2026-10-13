// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number | null;
  name: string;
}

export interface RawCategory {
  id: number;
  name?: string;
  category_name?: string;
  title?: string;
}

export interface ProductCategoryApiResponse {
  data: {
    data: {
      data: RawCategory[];
    };
  };
}

// ─── Category refs as nested in product payloads ─────────────────────────────

export interface CategoryRef {
  id: number;
  title: string;
}

/** A product's category, with its parent and grand categories nested inside. */
export interface ProductCategoryRef extends CategoryRef {
  parent_categories?: Array<CategoryRef & { grand_categories?: CategoryRef[] }>;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number | string;
  original_price?: number | string;
  image?: string;
  category_id?: number;
  description?: string;
  rating?: number;
  review_count?: number;
  is_assured?: boolean;
  is_sponsored?: boolean;
  is_hot_deal?: boolean;
  variant_label?: string;
  attachments?: { file_uri: string }[];
  [key: string]: unknown;
}

export interface ProductApiResponse {
  data: {
    data: {
      pagination: { total?: number; page?: number; limit?: number; [key: string]: unknown };
      data: Product[];
    };
  };
}

// ─── API Params ───────────────────────────────────────────────────────────────

export interface ProductCategoryApiParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number | string;
  brand_id?: number | string;
  grand_category_id?: number | string;
  tier?: string;
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export interface SortOption {
  label: string;
  value: "popular" | "price-asc" | "price-desc" | "newest";
}