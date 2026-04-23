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

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number | string;
  image?: string;
  category_id?: number;
  description?: string;
  [key: string]: unknown;
}

export interface ProductApiResponse {
  data: {
    data: {
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
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export interface SortOption {
  label: string;
  value: "popular" | "price-asc" | "price-desc" | "newest";
}