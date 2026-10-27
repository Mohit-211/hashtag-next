import type { MetadataRoute } from "next";
import { fetchPublicJson } from "@/lib/publicApi";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/utils";

// Rebuilt at most once an hour: supplier syncs and admin edits change the catalog.
export const revalidate = 3600;

// 200 products a request keeps each response under Next's 2 MB fetch-cache limit.
const PAGE_SIZE = 200;
// A sitemap holds at most 50,000 URLs.
const MAX_PRODUCT_PAGES = Math.floor(45_000 / PAGE_SIZE);

type Entry = MetadataRoute.Sitemap[number];

/** List responses come as { data: [...] } or { data: { data: [...], pagination } }. */
interface ListResponse<T> {
  data?: T[] | { data?: T[]; pagination?: { totalPages?: number; total_pages?: number } };
}

interface ProductRow {
  id: number;
  updated_at?: string | null;
  is_active?: boolean;
  deleted_at?: string | null;
}

interface CategoryRow {
  id: number;
  title: string;
  slug?: string | null;
  is_active?: boolean;
  updated_at?: string | null;
  parent_categories?: { id: number; title: string; slug?: string | null }[];
}

interface NamedRow {
  id: number;
  slug?: string | null;
  title?: string;
  name?: string;
  is_active?: boolean;
  updated_at?: string | null;
}

const rowsOf = <T>(res: ListResponse<T> | null): T[] => {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};

const totalPagesOf = (res: ListResponse<unknown> | null): number => {
  const data = res?.data;
  if (!data || Array.isArray(data)) return 1;
  return data.pagination?.totalPages ?? data.pagination?.total_pages ?? 1;
};

const entry = (path: string, details: Omit<Entry, "url"> = {}): Entry => ({ url: `${SITE_URL}${path}`, ...details });

const modified = (value?: string | null) => (value ? new Date(value) : undefined);

const STATIC_ENTRIES: Entry[] = [
  entry("/", { changeFrequency: "weekly", priority: 1 }),
  entry("/categories", { changeFrequency: "daily", priority: 0.8 }),
  entry("/about", { changeFrequency: "monthly", priority: 0.5 }),
  entry("/gallery", { changeFrequency: "monthly", priority: 0.5 }),
  entry("/support", { changeFrequency: "monthly", priority: 0.5 }),
  entry("/contact-us", { changeFrequency: "monthly", priority: 0.5 }),
  entry("/shippingreturns", { changeFrequency: "yearly", priority: 0.3 }),
  entry("/terms", { changeFrequency: "yearly", priority: 0.3 }),
  entry("/privacy-policy", { changeFrequency: "yearly", priority: 0.3 }),
];

async function productEntries(): Promise<Entry[]> {
  const first = await fetchPublicJson<ListResponse<ProductRow>>(`product?page=1&limit=${PAGE_SIZE}`);
  if (!first) return [];
  const pages = Math.min(totalPagesOf(first), MAX_PRODUCT_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      fetchPublicJson<ListResponse<ProductRow>>(`product?page=${i + 2}&limit=${PAGE_SIZE}`)
    )
  );
  // Keyed by id: a product can shift pages while they're fetched.
  const products = new Map<number, ProductRow>();
  [first, ...rest].flatMap(rowsOf).forEach((p) => {
    if (p?.id != null && p.is_active !== false && !p.deleted_at) products.set(p.id, p);
  });
  return [...products.values()].map((p) =>
    entry(`/product/${p.id}`, { lastModified: modified(p.updated_at), changeFrequency: "weekly", priority: 0.7 })
  );
}

/** Grand categories and their subcategories, as /categories/<id>/<slug>[/<parentId>/<parentSlug>]. */
async function categoryEntries(): Promise<Entry[]> {
  const res = await fetchPublicJson<ListResponse<CategoryRow>>("product-category/get-grand-categories?page=1&limit=100");
  return rowsOf(res)
    .filter((c) => c.is_active !== false)
    .flatMap((c) => {
      const path = `/categories/${c.id}/${c.slug || slugify(c.title)}`;
      return [
        entry(path, { lastModified: modified(c.updated_at), changeFrequency: "weekly", priority: 0.8 }),
        ...(c.parent_categories ?? []).map((p) =>
          entry(`${path}/${p.id}/${p.slug || slugify(p.title)}`, { changeFrequency: "weekly", priority: 0.6 })
        ),
      ];
    });
}

async function namedEntries(apiPath: string, sitePrefix: string): Promise<Entry[]> {
  const res = await fetchPublicJson<ListResponse<NamedRow>>(apiPath);
  return rowsOf(res)
    .filter((row) => row.is_active !== false && (row.slug || row.title || row.name))
    .map((row) =>
      entry(`${sitePrefix}/${row.id}/${row.slug || slugify(row.title ?? row.name ?? "")}`, {
        lastModified: modified(row.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each list fails on its own: an API outage drops its URLs until the next rebuild, never the whole sitemap.
  const [categories, industries, brands, products] = await Promise.all([
    categoryEntries(),
    namedEntries("industry?page=1&limit=100", "/categories/industry"),
    namedEntries("brand/website-brands", "/categories/brand"),
    productEntries(),
  ]);
  return [...STATIC_ENTRIES, ...categories, ...industries, ...brands, ...products];
}
