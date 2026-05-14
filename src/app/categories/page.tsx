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
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .sk {
    background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
    background-size: 1200px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fade-up 0.28s ease-out both; }
  .cat-layout {
    display: flex;
    gap: 0;
    min-height: 100vh;
    align-items: flex-start;
  }
  /* ── Sidebar ── */
  .cat-sidebar {
    width: 232px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 0 32px 0;
    border-right: 1px solid #f0eff0;
    scrollbar-width: thin;
    scrollbar-color: #e4e4e4 transparent;
  }
  .cat-sidebar::-webkit-scrollbar { width: 4px; }
  .cat-sidebar::-webkit-scrollbar-track { background: transparent; }
  .cat-sidebar::-webkit-scrollbar-thumb { background: #e4e4e4; border-radius: 4px; }
  .sidebar-header {
    padding: 20px 16px 12px;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 2;
    border-bottom: 1px solid #f5f5f5;
  }
  .sidebar-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a1a1aa;
    margin: 0 0 10px 0;
  }
  .sidebar-search {
    width: 100%;
    height: 32px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 0 10px 0 30px;
    font-size: 13px;
    color: #18181b;
    background: #fafafa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") no-repeat 8px center;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .sidebar-search:focus {
    border-color: #18181b;
    background-color: #fff;
  }
  .cat-list {
    padding: 8px 0;
    list-style: none;
    margin: 0;
  }
  .cat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    height: 38px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 400;
    color: #52525b;
    border-radius: 0;
    transition: background 0.12s, color 0.12s;
    position: relative;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cat-item:hover { background: #f4f4f5; color: #18181b; }
  .cat-item.active {
    color: #18181b;
    font-weight: 600;
    background: #f4f4f5;
  }
  .cat-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    background: #18181b;
    border-radius: 0 3px 3px 0;
  }
  .cat-item-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #d4d4d8;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .cat-item.active .cat-item-dot { background: #18181b; }
  .load-more-cats {
    margin: 4px 16px 0;
    padding: 7px 12px;
    font-size: 12px;
    color: #71717a;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    background: none;
    cursor: pointer;
    width: calc(100% - 32px);
    text-align: center;
    transition: background 0.12s, color 0.12s;
  }
  .load-more-cats:hover { background: #f4f4f5; color: #18181b; }
  /* ── Main content ── */
  .cat-main {
    flex: 1;
    min-width: 0;
    padding: 0 0 80px 0;
  }
  .cat-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    gap: 12px;
    border-bottom: 1px solid #f5f5f5;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .cat-heading {
    font-size: 18px;
    font-weight: 700;
    color: #18181b;
    margin: 0;
    letter-spacing: -0.02em;
  }
  .cat-count {
    font-size: 13px;
    color: #a1a1aa;
    font-weight: 400;
    margin-left: 6px;
  }
  .sort-wrapper { position: relative; }
  .sort-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 12px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    color: #18181b;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
    white-space: nowrap;
  }
  .sort-btn:hover { border-color: #a1a1aa; background: #fafafa; }
  .sort-btn svg { color: #71717a; }
  .sort-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    min-width: 180px;
    overflow: hidden;
    z-index: 50;
    animation: fade-up 0.15s ease-out;
  }
  .sort-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-size: 13.5px;
    cursor: pointer;
    color: #3f3f46;
    transition: background 0.1s;
  }
  .sort-option:hover { background: #f4f4f5; }
  .sort-option.active { color: #18181b; font-weight: 600; }
  .sort-option.active::after {
    content: '';
    margin-left: auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #18181b;
  }
  .products-area { padding: 20px; }
  /* ── Spinner ── */
  .spinner {
    width: 18px; height: 18px;
    border-radius: 50%;
    border: 2px solid #e4e4e7;
    border-top-color: #18181b;
    animation: spin 0.7s linear infinite;
  }
  /* ── Skeleton product card ── */
  .sk-card {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  .sk-img {
    padding-bottom: 100%;
    position: relative;
  }
  .sk-img-inner {
    position: absolute;
    inset: 0;
  }
  .sk-body { padding: 12px; }
  /* ── Sidebar skeleton ── */
  .sk-sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    height: 38px;
  }
  @media (max-width: 768px) {
    .cat-sidebar {
      display: none;
    }
    .cat-layout {
      flex-direction: column;
    }
  }
`;
// ─── Skeleton Components ───────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <aside className="cat-sidebar">
      <div className="sidebar-header">
        <div className="sk" style={{ height: 11, width: 80, borderRadius: 4, marginBottom: 10 }} />
        <div className="sk" style={{ height: 32, borderRadius: 8 }} />
      </div>
      <ul className="cat-list">
        {[100, 80, 120, 90, 110, 75, 95, 85].map((w, i) => (
          <li key={i} className="sk-sidebar-item">
            <div className="sk" style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0 }} />
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
      <div className="sk" style={{ height: 22, width: 160, borderRadius: 6 }} />
      <div className="sk" style={{ height: 34, width: 110, borderRadius: 8 }} />
    </div>
  );
}
function ProductsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-card sk">
          <div className="sk-img">
            <div className="sk-img-inner sk" />
          </div>
          <div className="sk-body">
            <div className="sk" style={{ height: 11, width: "65%", borderRadius: 4, marginBottom: 8 }} />
            <div className="sk" style={{ height: 11, width: "40%", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M7 12h10M11 18h2" />
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
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
  // Close sort dropdown on outside click
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
        const res: ProductCategoryApiResponse = await ProductCategoryApi({
          page: pageNumber,
          limit: CATEGORY_LIMIT,
          search,
        });
        if (controller.signal.aborted) return;
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const formatted: Category[] = raw.map((cat) => ({
          id: cat.id,
          name: cat.name ?? cat.category_name ?? cat.title ?? "Unnamed",
        }));
        console.log(formatted, "formatted");
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
  const [total_products, setTotalProducts] = useState(0)
  console.log(total_products, "total_products")
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
        setTotalProducts(res?.data?.data?.pagination?.total ?? 0)
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
      <>
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
      </>
    );
  }
  // ─── Main UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="container" style={{ paddingTop: 0 }}>
        <CategoryBanner />
        <div className="cat-layout">
          {/* ── Left Sidebar ── */}
          <aside className="cat-sidebar">
            <div className="sidebar-header">
              <p className="sidebar-title">Categories</p>
              <input
                type="search"
                className="sidebar-search"
                placeholder="Search…"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <ul className="cat-list">
              {categories.map((cat) => (
                <li
                  key={cat.id ?? "all"}
                  className={`cat-item${activeCategory.id === cat.id ? " active" : ""}`}
                  onClick={() => handleCategorySelect(cat)}
                  title={cat.name}
                >
                  <span className="cat-item-dot" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</span>
                </li>
              ))}
              {categoryLoading && (
                <li style={{ padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>Loading…</span>
                </li>
              )}
              {hasMoreCategories && !categoryLoading && (
                <li>
                  <button className="load-more-cats" onClick={handleLoadMoreCategories}>
                    Load more
                  </button>
                </li>
              )}
            </ul>
          </aside>
          {/* ── Right Content ── */}
          <div className="cat-main">
            {/* Top bar: heading + sort */}
            <div className="cat-topbar">
              <h1 className="cat-heading">
                {activeCategory.name}
                {!productGridLoading && (
                  <span className="cat-count">{activeCategory.name==="All" ? total_products : products.length} items</span>
                )}
              </h1>
              <div className="sort-wrapper" ref={sortDropdownRef}>
                <button className="sort-btn" onClick={() => setSortOpen((v) => !v)}>
                  <SortIcon />
                  {activeSortLabel}
                  <ChevronDown />
                </button>
                {sortOpen && (
                  <div className="sort-dropdown">
                    {(sortOptions as SortOption[]).map((opt) => (
                      <div
                        key={opt.value}
                        className={`sort-option${sortBy === opt.value ? " active" : ""}`}
                        onClick={() => handleSortSelect(opt.value)}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Products */}
            <div className="products-area">
              {productGridLoading ? (
                <ProductsSkeleton count={12} />
              ) : products.length > 0 ? (
                <div className="fade-up">
                  <ProductGrid products={products} />
                  {productLoading && page > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 10,
                        padding: "32px 0",
                        fontSize: 13,
                        color: "#a1a1aa",
                      }}
                    >
                      <div className="spinner" />
                      Loading more products…
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
    </>
  );
}