"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import CategoryBanner from "@/components/categories/CategoryBanner";
import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";
import { sortOptions } from "@/data/products";
import { AllProductsApi, ProductCategoryApi } from "@/api/operations/product.api";
import type {
  Category,
  Product,
  SortOption,
  ProductApiResponse,
  ProductCategoryApiResponse,
} from "@/data/typesproduct";

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_LIMIT = 15;
const LOAD_MORE_LIMIT = 15;
const CATEGORY_LIMIT = 50;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --ink:       #1a1612;
    --ink-soft:  #6b6560;
    --ink-faint: #a09b96;
    --border:    #e8e3de;
    --border-faint: #f0ece8;
    --bg:        #faf8f5;
    --bg-card:   #ffffff;
    --accent:    #c8502a;
    --accent-light: #f5ede8;
    --sidebar-w: 240px;
    --radius:    12px;
    --font-serif: 'DM Serif Display', Georgia, serif;
    --font-sans:  'DM Sans', system-ui, sans-serif;
  }

  * { box-sizing: border-box; }

  .cat-root {
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Animations ── */
  @keyframes shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position: 800px 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .sk {
    background: linear-gradient(90deg, #ede9e4 25%, #e3ddd7 50%, #ede9e4 75%);
    background-size: 1600px 100%;
    animation: shimmer 1.6s ease-in-out infinite;
  }
  .fade-up { animation: fadeUp 0.32s cubic-bezier(.22,.68,0,1.2) both; }

  /* ── Layout ── */
  .cat-layout {
    display: flex;
    gap: 0;
    min-height: calc(100vh - 64px);
    align-items: flex-start;
    background: var(--bg);
  }

  /* ── Sidebar ── */
  .cat-sidebar {
    width: var(--sidebar-w);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 40px;
    border-right: 1px solid var(--border);
    background: var(--bg-card);
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .cat-sidebar::-webkit-scrollbar { width: 3px; }
  .cat-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .sidebar-header {
    padding: 24px 18px 14px;
    position: sticky;
    top: 0;
    background: var(--bg-card);
    z-index: 2;
    border-bottom: 1px solid var(--border-faint);
  }
  .sidebar-title {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--ink);
    margin: 0 0 12px 0;
    font-style: italic;
  }
  .sidebar-search-wrap {
    position: relative;
  }
  .sidebar-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-faint);
    pointer-events: none;
  }
  .sidebar-search {
    width: 100%;
    height: 34px;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 10px 0 32px;
    font-size: 12.5px;
    font-family: var(--font-sans);
    color: var(--ink);
    background: var(--bg);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .sidebar-search::placeholder { color: var(--ink-faint); }
  .sidebar-search:focus {
    border-color: var(--ink-soft);
    box-shadow: 0 0 0 3px rgba(26,22,18,0.06);
    background: #fff;
  }

  .cat-list {
    padding: 8px 0 0;
    list-style: none;
    margin: 0;
  }
  .cat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    height: 36px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-soft);
    transition: background 0.14s, color 0.14s;
    position: relative;
    user-select: none;
  }
  .cat-item:hover {
    background: var(--accent-light);
    color: var(--ink);
  }
  .cat-item.active {
    color: var(--ink);
    font-weight: 500;
    background: var(--accent-light);
  }
  .cat-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 7px; bottom: 7px;
    width: 2.5px;
    background: var(--accent);
    border-radius: 0 2px 2px 0;
  }
  .cat-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .cat-item-tick {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--accent);
    opacity: 0;
    transition: opacity 0.14s;
  }
  .cat-item.active .cat-item-tick { opacity: 1; }

  .load-more-cats {
    margin: 8px 18px 0;
    padding: 7px 12px;
    font-size: 12px;
    font-family: var(--font-sans);
    color: var(--ink-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    background: none;
    cursor: pointer;
    width: calc(100% - 36px);
    text-align: center;
    transition: background 0.14s, color 0.14s, border-color 0.14s;
    letter-spacing: 0.01em;
  }
  .load-more-cats:hover {
    background: var(--accent-light);
    border-color: var(--accent);
    color: var(--accent);
  }

  /* ── Main content ── */
  .cat-main {
    flex: 1;
    min-width: 0;
    padding-bottom: 100px;
  }

  .cat-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 18px;
    gap: 12px;
    border-bottom: 1px solid var(--border-faint);
    background: var(--bg-card);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .cat-heading-group { display: flex; align-items: baseline; gap: 10px; }
  .cat-heading {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 400;
    color: var(--ink);
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .cat-count {
    font-size: 12.5px;
    color: var(--ink-faint);
    font-weight: 400;
    font-family: var(--font-sans);
  }

  /* ── Sort ── */
  .sort-wrapper { position: relative; }
  .sort-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-card);
    font-size: 12.5px;
    font-family: var(--font-sans);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.14s, background 0.14s, box-shadow 0.14s;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .sort-btn:hover {
    border-color: var(--ink-soft);
    background: var(--bg);
  }
  .sort-btn.open {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(26,22,18,0.06);
  }
  .sort-btn svg { color: var(--ink-soft); transition: transform 0.2s; }
  .sort-btn.open .sort-chevron { transform: rotate(180deg); }

  .sort-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 12px 32px rgba(26,22,18,0.1), 0 2px 8px rgba(26,22,18,0.06);
    min-width: 190px;
    overflow: hidden;
    z-index: 50;
    animation: slideDown 0.18s ease-out;
    padding: 4px;
  }
  .sort-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    font-size: 13px;
    font-family: var(--font-sans);
    cursor: pointer;
    color: var(--ink-soft);
    border-radius: 8px;
    transition: background 0.1s, color 0.1s;
    gap: 8px;
  }
  .sort-option:hover { background: var(--bg); color: var(--ink); }
  .sort-option.active {
    color: var(--ink);
    font-weight: 500;
    background: var(--accent-light);
  }
  .sort-check { color: var(--accent); flex-shrink: 0; }

  /* ── Products area ── */
  .products-area { padding: 24px; }

  /* ── Category pill breadcrumb ── */
  .active-filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px 3px 12px;
    background: var(--ink);
    color: #fff;
    border-radius: 100px;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-left: 10px;
  }
  .active-filter-pill button {
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    font-size: 14px;
    transition: color 0.12s;
  }
  .active-filter-pill button:hover { color: #fff; }

  /* ── Load more spinner ── */
  .spinner {
    width: 18px; height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--ink);
    animation: spin 0.7s linear infinite;
  }

  /* ── Skeleton ── */
  .sk-card {
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--border-faint);
    background: var(--bg-card);
  }
  .sk-img { padding-bottom: 100%; position: relative; }
  .sk-img-inner { position: absolute; inset: 0; }
  .sk-body { padding: 14px; }
  .sk-sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    height: 36px;
  }

  /* ── Loading overlay on grid ── */
  .products-grid-wrap { position: relative; }
  .products-load-more {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 36px 0 0;
    font-size: 12.5px;
    color: var(--ink-faint);
  }

  /* ── Empty state enhancements ── */
  .cat-section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
    margin: 0 24px;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .cat-sidebar { display: none; }
    .cat-layout { flex-direction: column; }
    .products-area { padding: 16px; }
    .cat-topbar { padding: 16px; }
    .cat-heading { font-size: 20px; }
  }
`;

// ─── Skeleton Components ───────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <aside className="cat-sidebar">
      <div className="sidebar-header">
        <div className="sk" style={{ height: 16, width: 90, borderRadius: 4, marginBottom: 12 }} />
        <div className="sk" style={{ height: 34, borderRadius: 8 }} />
      </div>
      <ul className="cat-list">
        {[90, 72, 110, 84, 100, 68, 88, 76, 95, 60].map((w, i) => (
          <li key={i} className="sk-sidebar-item">
            <div className="sk" style={{ height: 12, width: w, borderRadius: 4 }} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TopBarSkeleton() {
  return (
    <div className="cat-topbar">
      <div className="sk" style={{ height: 24, width: 140, borderRadius: 6 }} />
      <div className="sk" style={{ height: 34, width: 120, borderRadius: 8 }} />
    </div>
  );
}

function ProductsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="sk-img"><div className="sk-img-inner sk" /></div>
          <div className="sk-body">
            <div className="sk" style={{ height: 11, width: "70%", borderRadius: 4, marginBottom: 8 }} />
            <div className="sk" style={{ height: 13, width: "45%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M7 12h10M11 18h2" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg className="cat-item-tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productGridLoading, setProductGridLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>({ id: null, name: "All" });
  const [sortBy, setSortBy] = useState<SortOption["value"]>("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total_products, setTotalProducts] = useState(0);

  const pageRef = useRef(1);
  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const productLoadingRef = useRef(false);
  const activeCategoryRef = useRef<Category>(activeCategory);
  const sortByRef = useRef<SortOption["value"]>(sortBy);
  const categorySearchAbortRef = useRef<AbortController | null>(null);
  const initialLoadDoneRef = useRef(false);
  const categorySearchInitRef = useRef(false);
  const filterInitRef = useRef(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getLimitForPage = (p: number) => (p === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT);

  const sortProducts = (data: Product[], sort: SortOption["value"]): Product[] => {
    const copy = [...data];
    if (sort === "price-asc") return copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sort === "price-desc") return copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return copy;
  };

  const fetchCategories = useCallback(
    async (pageNumber: number, isLoadMore: boolean, search: string) => {
      categorySearchAbortRef.current?.abort();
      const controller = new AbortController();
      categorySearchAbortRef.current = controller;
      try {
        setCategoryLoading(true);
        const res: ProductCategoryApiResponse = await ProductCategoryApi({ page: pageNumber, limit: CATEGORY_LIMIT, search });
        if (controller.signal.aborted) return;
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const formatted: Category[] = raw.map((cat) => ({
          id: cat.id,
          name: cat.name ?? cat.category_name ?? cat.title ?? "Unnamed",
        }));
        setCategories((prev) =>
          isLoadMore ? [...prev, ...formatted] : [{ id: null, name: "All" }, ...formatted]
        );
        setHasMoreCategories(raw.length === CATEGORY_LIMIT);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === "AbortError") return;
        console.error("Error fetching categories:", error);
        if (!isLoadMore) setCategories([{ id: null, name: "All" }]);
        setHasMoreCategories(false);
      } finally {
        if (!controller.signal.aborted) setCategoryLoading(false);
      }
    },
    []
  );

  const fetchProducts = useCallback(
    async (pageNumber: number, isLoadMore: boolean, category: Category, sort: SortOption["value"]) => {
      try {
        setProductLoading(true);
        productLoadingRef.current = true;
        const limit = getLimitForPage(pageNumber);
        const res: ProductApiResponse = await AllProductsApi({
          page: pageNumber,
          limit,
          ...(category.id !== null && { category_id: category.id }),
        });
        setTotalProducts(res?.data?.data?.pagination?.total ?? 0);
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const sorted = sortProducts(raw, sort);
        setProducts((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));
        const more = raw.length === limit;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch (error) {
        console.error("Error fetching products:", error);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        setProductLoading(false);
        setProductGridLoading(false);
        productLoadingRef.current = false;
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          setInitialLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    Promise.all([
      fetchCategories(1, false, ""),
      fetchProducts(1, false, { id: null, name: "All" }, "popular"),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categorySearchInitRef.current) { categorySearchInitRef.current = true; return; }
    setCategoryPage(1);
    fetchCategories(1, false, categorySearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySearch]);

  useEffect(() => {
    if (!filterInitRef.current) { filterInitRef.current = true; return; }
    pageRef.current = 1;
    setPage(1);
    setProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    setProductGridLoading(true);
    fetchProducts(1, false, activeCategory, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sortBy]);

  useEffect(() => {
    const handleScroll = async () => {
      if (fetchingRef.current || !hasMoreRef.current || productLoadingRef.current) return;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= fullHeight - 200) {
        fetchingRef.current = true;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        await fetchProducts(nextPage, true, activeCategoryRef.current, sortByRef.current);
        fetchingRef.current = false;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts]);

  const handleCategorySelect = (cat: Category) => {
    if (cat.id === activeCategory.id) return;
    setActiveCategory(cat);
    setSortOpen(false);
  };

  const handleSortSelect = (value: SortOption["value"]) => {
    setSortBy(value);
    setSortOpen(false);
  };

  const handleLoadMoreCategories = useCallback(() => {
    const nextPage = categoryPage + 1;
    setCategoryPage(nextPage);
    fetchCategories(nextPage, true, categorySearch);
  }, [categoryPage, categorySearch, fetchCategories]);

  const activeSortLabel = sortOptions.find((s) => s.value === sortBy)?.label ?? "Sort";

  // ─── Full-page skeleton ────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="cat-root">
        <style>{styles}</style>
        <div className="container" style={{ paddingTop: 0 }}>
          <CategoryBanner />
          <div className="cat-layout">
            <SidebarSkeleton />
            <div className="cat-main">
              <TopBarSkeleton />
              <div className="products-area">
                <ProductsSkeleton count={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────
  const itemCount = activeCategory.name === "All" ? total_products : products.length;

  return (
    <div className="cat-root">
      <style>{styles}</style>
      <div className="container" style={{ paddingTop: 0 }}>
        <CategoryBanner />
        <div className="cat-layout">

          {/* ── Left Sidebar ── */}
          <aside className="cat-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-title">Browse by category</p>
              <div className="sidebar-search-wrap">
                <span className="sidebar-search-icon">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  className="sidebar-search"
                  placeholder="Filter categories…"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>
            </div>
            <ul className="cat-list">
              {categories.map((cat) => (
                <li
                  key={cat.id ?? "all"}
                  className={`cat-item${activeCategory.id === cat.id ? " active" : ""}`}
                  onClick={() => handleCategorySelect(cat)}
                  title={cat.name}
                >
                  <span className="cat-item-name">{cat.name}</span>
                  <TickIcon />
                </li>
              ))}
              {categoryLoading && (
                <li style={{ padding: "10px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />
                  <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Loading…</span>
                </li>
              )}
              {hasMoreCategories && !categoryLoading && (
                <li>
                  <button className="load-more-cats" onClick={handleLoadMoreCategories}>
                    Show more categories
                  </button>
                </li>
              )}
            </ul>
          </aside>

          {/* ── Right Content ── */}
          <div className="cat-main">
            {/* Top bar */}
            <div className="cat-topbar">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <h1 className="cat-heading">{activeCategory.name}</h1>
                {!productGridLoading && (
                  <span className="cat-count">
                    {itemCount.toLocaleString()} {itemCount === 1 ? "item" : "items"}
                  </span>
                )}
                {activeCategory.id !== null && (
                  <span className="active-filter-pill">
                    {activeCategory.name}
                    <button
                      onClick={() => setActiveCategory({ id: null, name: "All" })}
                      aria-label="Clear filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              <div className="sort-wrapper" ref={sortDropdownRef}>
                <button
                  className={`sort-btn${sortOpen ? " open" : ""}`}
                  onClick={() => setSortOpen((v) => !v)}
                >
                  <SortIcon />
                  {activeSortLabel}
                  <ChevronDown className="sort-chevron" />
                </button>
                {sortOpen && (
                  <div className="sort-dropdown">
                    {(sortOptions as SortOption[]).map((opt) => (
                      <div
                        key={opt.value}
                        className={`sort-option${sortBy === opt.value ? " active" : ""}`}
                        onClick={() => handleSortSelect(opt.value)}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && (
                          <span className="sort-check"><CheckIcon /></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="cat-section-divider" />

            {/* Products */}
            <div className="products-area">
              {productGridLoading ? (
                <ProductsSkeleton count={12} />
              ) : products.length > 0 ? (
                <div className="fade-up products-grid-wrap">
                  <ProductGrid products={products} />
                  {productLoading && page > 1 && (
                    <div className="products-load-more">
                      <div className="spinner" />
                      Loading more…
                    </div>
                  )}
                </div>
              ) : (
                <EmptyProducts reset={() => setActiveCategory({ id: null, name: "All" })} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}