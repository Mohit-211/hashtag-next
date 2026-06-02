"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";

import { sortOptions } from "@/data/products";

import {
  AllProductsApi,
  ProductCategoryApi,
} from "@/api/operations/product.api";

import type {
  Category,
  Product,
  SortOption,
  ProductApiResponse,
  ProductCategoryApiResponse,
} from "@/data/typesproduct";

import {
  brandlist,
  BRAND_TAB_NAME,
} from "../../components/categories/Brands";
import { SearchIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const INITIAL_LIMIT = 15;
const LOAD_MORE_LIMIT = 15;
const CATEGORY_LIMIT = 50;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function brandInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = `
*{
  box-sizing:border-box;
}

.cat-root{
  background:#fafafa;
  min-height:100vh;
}

.cat-tabs-wrap{
  position:sticky;
  top:0;
  z-index:100;
  background:#fff;
  display:flex;
  border-bottom:1px solid #eee;
}

.cat-tabs-inner{
  display:flex;
  align-items:center;
  overflow-x:auto;
  scrollbar-width:none;
  padding:0 10px;
}

.cat-tabs-inner::-webkit-scrollbar{
  display:none;
}

.cat-tab{
  position:relative;
  height:52px;
  display:flex;
  align-items:center;
  gap:5px;
  padding:0 18px;
  cursor:pointer;
  font-size:14px;
  color:#666;
  white-space:nowrap;
  transition:.2s;
  border-bottom:2px solid transparent;
  flex-shrink:0;
}

.cat-tab:hover{
  color:#111;
}

.cat-tab.active{
  color:#111;
  border-bottom-color:#111;
  font-weight:600;
}

.brand-chevron{
  transition:.2s;
}

.brand-chevron.open{
  transform:rotate(180deg);
}

.cat-topbar {
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.cat-topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.cat-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cat-heading {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #111;
}

.cat-count {
  color: #777;
  font-size: 14px;
  font-weight: 500;
}

.active-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 8px 14px;
  border-radius: 999px;

  background: #f5f5f5;
  color: #111;
  font-size: 14px;
  font-weight: 500;
}

.active-filter-pill button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #666;
}

.cat-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.sort-select {
  height: 42px;
  min-width: 190px;

  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 10px;

  background: #fff;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.sort-select:hover,
.sort-select:focus {
  border-color: #111;
}

@media (max-width: 768px) {
  .cat-topbar {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .cat-topbar-right {
    width: 100%;
  }

  .sort-select {
    width: 100%;
  }

  .cat-heading {
    font-size: 22px;
  }
}

.cat-heading{
  font-size:24px;
  font-weight:700;
  margin:0;
}

.cat-count{
  font-size:13px;
  color:#888;
}

.products-area{
  padding:24px;
}

.spinner{
  width:20px;
  height:20px;
  border:2px solid #ddd;
  border-top-color:#111;
  border-radius:50%;
  animation:spin .7s linear infinite;
}

@keyframes spin{
  to{
    transform:rotate(360deg);
  }
}

.products-load-more{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  padding:30px 0;
  color:#666;
  font-size:14px;
}

.active-filter-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:#111;
  color:#fff;
  border-radius:999px;
  padding:5px 12px;
  font-size:12px;
  margin-left:10px;
}
  
/* ── Search wrap ── */
.cat-tabs-search-wrap {
  margin-left: auto;
  flex-shrink: 0;
}

.cat-tabs-search-inner {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 0px;
}

.cat-tabs-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
  display: flex;
  align-items: center;
  font-size: 15px;
}

.cat-tabs-search {
  height: 34px;
  width: 220px;
  padding: 0 34px 0 34px;

  border: 1px solid #e5e7eb;
  border-radius: 8px;

  background: #f9fafb;
  color: #111;
  font-size: 13px;

  outline: none;
  transition: border-color .2s, box-shadow .2s, width .2s, background .2s;
}

.cat-tabs-search::placeholder {
  color: #9ca3af;
  font-size: 12.5px;
}

.cat-tabs-search:hover {
  border-color: #d1d5db;
  background: #fff;
}

.cat-tabs-search:focus {
  border-color: #374151;
  background: #fff;
  width: 250px;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
}

/* Clear button */
.cat-tabs-search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  padding: 0;
  font-size: 15px;
  line-height: 1;
}
.cat-tabs-search-clear:hover { color: #111; }

@media (max-width: 768px) {
  .cat-tabs-search-wrap { width: 100%; padding: 8px 12px; }
  .cat-tabs-search { width: 100%; }
  .cat-tabs-search:focus { width: 100%; }
}

.cat-tabs-search-inner {
  position: relative;
  display: flex;
  align-items: center;
  width: 200px;
}

.cat-tabs-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.cat-tabs-search {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 44px;

  border: 1px solid #e5e7eb;
  border-radius: 999px;

  background: #fff;
  color: #111827;
  font-size: 14px;
  font-weight: 500;

  transition: all 0.25s ease;
  outline: none;
}

.cat-tabs-search::placeholder {
  color: #9ca3af;
}

.cat-tabs-search:hover {
  border-color: #d1d5db;
}

.cat-tabs-search:focus {
  border-color: #111827;
  box-shadow: 0 0 0 4px rgba(17, 24, 39, 0.08);
}

@media (max-width: 768px) {
  .cat-tabs-search-wrap {
    width: 100%;
    margin-top: 12px;
  }

  .cat-tabs-search-inner {
    width: 100%;
  }
}

  .cat-tabs-search-inner {
    position: relative;
    display: flex;
    align-items: center;
  }
  .cat-tabs-search-icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-faint);
    pointer-events: none;
    display: flex;
  }
  .cat-tabs-search {
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 10px 0 30px;
    font-size: 12.5px;
    font-family: var(--font-sans);
    color: var(--ink);
    background: var(--bg);
    outline: none;
    width: 155px;
    transition: border-color 0.18s, width 0.2s;
  }
  .cat-tabs-search:focus {
    border-color: var(--ink-soft);
    width: 195px;
    background: #fff;
  }
  .cat-tabs-search::placeholder { color: var(--ink-faint); }


.active-filter-pill button{
  border:none;
  background:none;
  color:#fff;
  cursor:pointer;
  font-size:16px;
  line-height:1;
}

@media(max-width:768px){

  .products-area{
    padding:16px;
  }

  .cat-topbar{
    padding:16px;
  }

}
`;

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [activeCategory, setActiveCategory] =
    useState<Category>({
      id: null,
      name: "All",
    });

  const [sortBy, setSortBy] =
    useState<SortOption["value"]>("popular");
  const categorySearchInitRef = useRef(false);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const [productLoading, setProductLoading] =
    useState(false);

  const [productGridLoading, setProductGridLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [total_products, setTotalProducts] =
    useState(0);

  const [brandMenuOpen, setBrandMenuOpen] =
    useState(false);

  const [activeBrandSlug, setActiveBrandSlug] =
    useState<string | null>(null);

  const fetchingRef = useRef(false);

  const pageRef = useRef(1);

  const hasMoreRef = useRef(true);

  const activeCategoryRef =
    useRef<Category>(activeCategory);

  const sortByRef =
    useRef<SortOption["value"]>(sortBy);

  // ─────────────────────────────────────────────────────────
  // Sync refs
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    activeCategoryRef.current =
      activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  // ─────────────────────────────────────────────────────────
  // Sort
  // ─────────────────────────────────────────────────────────
  const sortProducts = (
    data: Product[],
    sort: SortOption["value"]
  ): Product[] => {
    const copy = [...data];

    if (sort === "price-asc") {
      return copy.sort(
        (a, b) =>
          Number(a.price ?? 0) -
          Number(b.price ?? 0)
      );
    }

    if (sort === "price-desc") {
      return copy.sort(
        (a, b) =>
          Number(b.price ?? 0) -
          Number(a.price ?? 0)
      );
    }

    return copy;
  };

  // ─────────────────────────────────────────────────────────
  // Categories API
  // ─────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res: ProductCategoryApiResponse =
        await ProductCategoryApi({
          page: 1,
          limit: CATEGORY_LIMIT,
        });

      const raw = Array.isArray(
        res?.data?.data?.data
      )
        ? res.data.data.data
        : [];

      const formatted: Category[] = raw.map(
        (cat: any) => ({
          id: cat.id,

          name:
            cat.title ||
            cat.name ||
            cat.category_name ||
            "",

          slug: cat.slug,
        })
      );

      setCategories([
        {
          id: null,
          name: "All",
        },
        ...formatted,
      ]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Products API
  // ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (
      pageNumber: number,
      isLoadMore: boolean,
      category: Category,
      sort: SortOption["value"],
      brandSlug?: string | null
    ) => {
      try {
        setProductLoading(true);

        const res: ProductApiResponse =
          await AllProductsApi({
            page: pageNumber,
            limit:
              pageNumber === 1
                ? INITIAL_LIMIT
                : LOAD_MORE_LIMIT,

            ...(category.id !== null && {
              category_id: category.id,
            }),

            ...(brandSlug && {
              brand_slug: brandSlug,
            }),
          });

        const raw = Array.isArray(
          res?.data?.data?.data
        )
          ? res.data.data.data
          : [];

        const sorted = sortProducts(
          raw,
          sort
        );

        setProducts((prev) =>
          isLoadMore
            ? [...prev, ...sorted]
            : sorted
        );

        setTotalProducts(
          res?.data?.data?.pagination?.total ?? 0
        );

        const more =
          raw.length ===
          (pageNumber === 1
            ? INITIAL_LIMIT
            : LOAD_MORE_LIMIT);

        setHasMore(more);

        hasMoreRef.current = more;
      } catch (error) {
        console.error(error);
      } finally {
        setProductLoading(false);
        setProductGridLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────
  // Initial Load
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchCategories(),

      fetchProducts(
        1,
        false,
        {
          id: null,
          name: "All",
        },
        "popular"
      ),
    ]);
  }, [fetchCategories, fetchProducts]);

  // ─────────────────────────────────────────────────────────
  // Category Change
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialLoading) return;

    setProductGridLoading(true);

    fetchProducts(
      1,
      false,
      activeCategory,
      sortBy,
      activeBrandSlug
    );

    pageRef.current = 1;

    setPage(1);
  }, [
    activeCategory,
    sortBy,
    activeBrandSlug,
  ]);
  useEffect(() => {
    if (!categorySearchInitRef.current) {
      categorySearchInitRef.current = true;
      return;
    }
    const runSearch = async () => {
      try {
        setCategoryLoading(true);
        const res: ProductCategoryApiResponse = await ProductCategoryApi({
          page: 1,
          limit: CATEGORY_LIMIT,
          search: categorySearch,
        });
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const formatted: Category[] = raw.map((cat) => ({
          id: cat.id,
          name: cat.name ?? cat.category_name ?? cat.title ?? "Unnamed",
        }));
        if (formatted.length > 0) {
          setActiveCategory(formatted[0]);
          activeCategoryRef.current = formatted[0];
        } else {
          const allCategory = { id: null, name: "All" };
          setActiveCategory(allCategory);
          activeCategoryRef.current = allCategory;
        }
      } catch (error) {
        console.error("Error searching category:", error);
      } finally {
        setCategoryLoading(false);
      }
    };
    if (categorySearch.trim()) runSearch();
  }, [categorySearch]);
  // ─────────────────────────────────────────────────────────
  // Infinite Scroll
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = async () => {
      if (
        fetchingRef.current ||
        !hasMoreRef.current ||
        productLoading
      ) {
        return;
      }

      const scrollTop = window.scrollY;

      const windowHeight =
        window.innerHeight;

      const fullHeight =
        document.documentElement
          .scrollHeight;

      if (
        scrollTop + windowHeight >=
        fullHeight - 200
      ) {
        fetchingRef.current = true;

        const nextPage =
          pageRef.current + 1;

        pageRef.current = nextPage;

        setPage(nextPage);

        await fetchProducts(
          nextPage,
          true,
          activeCategoryRef.current,
          sortByRef.current,
          activeBrandSlug
        );

        fetchingRef.current = false;
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, [
    fetchProducts,
    activeBrandSlug,
    productLoading,
  ]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────
  const handleCategorySelect = (
    cat: Category
  ) => {
    setActiveBrandSlug(null);

    setActiveCategory(cat);

    activeCategoryRef.current = cat;
  };

  const handleBrandSelect = (
    slug: string,
    brandCategory: Category
  ) => {
    setActiveBrandSlug(slug);

    setBrandMenuOpen(false);

    setActiveCategory(brandCategory);

    activeCategoryRef.current =
      brandCategory;
  };

  const handleClearFilter = () => {
    const allCategory: Category = { id: null, name: "All" };
    activeCategoryRef.current = allCategory;
    setActiveCategory(allCategory);
    setActiveBrandSlug(null);
    if (categorySearch !== "") setCategorySearch("");
  };

  // ─────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────
  return (
    <div className="cat-root">
      <style>{styles}</style>

      {/* Tabs */}
      <div className="cat-tabs-wrap">
        <div className="cat-tabs-inner">

          {categories.map((cat) => {
            const isBrand =
              cat.name === BRAND_TAB_NAME;

            const isActive =
              activeCategory.id === cat.id;

            // BRAND TAB
            if (isBrand) {
              return (
                <div
                  key={cat.id}
                  className={`cat-tab ${isActive ||
                    brandMenuOpen
                    ? "active"
                    : ""
                    }`}
                  onMouseEnter={() =>
                    setBrandMenuOpen(true)
                  }
                  onMouseLeave={() =>
                    setBrandMenuOpen(false)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {cat.name}

                    <svg
                      className={`brand-chevron ${brandMenuOpen
                        ? "open"
                        : ""
                        }`}
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {/* MEGA MENU */}
                  <div
                    style={{
                      position: "fixed",
                      top: "110px",
                      left: 0,
                      width: "100%",
                      background: "#fff",
                      borderTop:
                        "1px solid #eee",
                      borderBottom:
                        "1px solid #eee",
                      opacity:
                        brandMenuOpen
                          ? 1
                          : 0,
                      visibility:
                        brandMenuOpen
                          ? "visible"
                          : "hidden",
                      transform:
                        brandMenuOpen
                          ? "translateY(0px)"
                          : "translateY(10px)",
                      transition:
                        "all .25s ease",
                      zIndex: 999,
                      pointerEvents:
                        brandMenuOpen
                          ? "auto"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: 1300,
                        margin:
                          "0 auto",
                        padding:
                          "40px 30px",
                        display: "grid",
                        gridTemplateColumns:
                          "220px 1fr",
                        gap: 40,
                      }}
                    >
                      {/* LEFT */}
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              "#999",
                            marginBottom: 20,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Featured
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            gap: 16,
                          }}
                        >
                          <div>
                            Popular
                          </div>
                          <div>
                            New Arrivals
                          </div>
                          <div>
                            Trending
                          </div>
                          <div>
                            Best Seller
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              "#999",
                            marginBottom: 20,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Shop By Brand
                        </div>

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(4,1fr)",
                            gap: 18,
                          }}
                        >
                          {brandlist.map(
                            (brand) => (
                              <div
                                key={
                                  brand.id
                                }
                                onClick={() =>
                                  handleBrandSelect(
                                    brand.slug,
                                    cat
                                  )
                                }
                                style={{
                                  cursor:
                                    "pointer",
                                  padding: 14,
                                  border:
                                    "1px solid #eee",
                                  borderRadius: 14,
                                  transition:
                                    ".2s",
                                  background:
                                    activeBrandSlug ===
                                      brand.slug
                                      ? "#111"
                                      : "#fff",
                                  color:
                                    activeBrandSlug ===
                                      brand.slug
                                      ? "#fff"
                                      : "#111",
                                }}
                              >
                                <div
                                  style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background:
                                      activeBrandSlug ===
                                        brand.slug
                                        ? "#fff"
                                        : "#f3f3f3",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    marginBottom: 12,
                                    color:
                                      "#111",
                                  }}
                                >
                                  {brandInitials(
                                    brand.name
                                  )}
                                </div>

                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                  }}
                                >
                                  {
                                    brand.name
                                  }
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // NORMAL CATEGORY
            return (
              <div
                key={cat.id}
                className={`cat-tab ${isActive
                  ? "active"
                  : ""
                  }`}
                onClick={() =>
                  handleCategorySelect(cat)
                }
              >
                {cat.name}
              </div>
            );
          })}
        </div>

       <div className="cat-tabs-search-wrap">
  <div className="cat-tabs-search-inner">
    <span className="cat-tabs-search-icon" aria-hidden="true">
      <SearchIcon size={15} />
    </span>
    <input
      type="search"
      className="cat-tabs-search"
      placeholder="Filter categories…"
      value={categorySearch}
      onChange={(e) => setCategorySearch(e.target.value)}
      aria-label="Filter categories"
    />
    {categorySearch && (
      <button
        className="cat-tabs-search-clear"
        aria-label="Clear search"
        onClick={() => { setCategorySearch(""); handleClearFilter(); }}
      >
        ×
      </button>
    )}
  </div>
</div>
      </div>
      {/* Top */}
      <div className="cat-topbar">
        <div className="cat-topbar-left">
          <div className="cat-title-wrap">
            <h1 className="cat-heading">
              {activeBrandSlug
                ? brandlist.find(
                  (b) => b.slug === activeBrandSlug
                )?.name
                : activeCategory.name}
            </h1>

            <span className="cat-count">
              {total_products} items
            </span>
          </div>

          {(activeCategory.id !== null || activeBrandSlug) && (
            <span className="active-filter-pill">
              {activeBrandSlug
                ? brandlist.find(
                  (b) => b.slug === activeBrandSlug
                )?.name
                : activeCategory.name}

              <button onClick={handleClearFilter}>
                ×
              </button>
            </span>
          )}
        </div>

        <div className="cat-topbar-right">
          <label className="sort-label">Sort By</label>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as SortOption["value"]
              )
            }
            className="sort-select"
          >
            {sortOptions.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products */}
      <div className="products-area">
        {productGridLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              padding: "100px 0",
            }}
          >
            <div className="spinner" />
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductGrid
              products={products}
            />

            {productLoading &&
              page > 1 && (
                <div className="products-load-more">
                  <div className="spinner" />
                  Loading more...
                </div>
              )}
          </>
        ) : (
          <EmptyProducts
            reset={
              handleClearFilter
            }
          />
        )}
      </div>
    </div>
  );
}