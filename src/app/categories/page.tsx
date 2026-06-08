"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";

import { sortOptions } from "@/data/products";

import {
  AllProductsApi,
  ProductCategoryApi,
} from "@/api/operations/product.api";

import { GetAllBrandsApi } from "@/api/operations/brand.api";

import type {
  Category,
  Product,
  SortOption,
  ProductApiResponse,
  ProductCategoryApiResponse,
} from "@/data/typesproduct";

import { BRAND_TAB_NAME } from "../../components/categories/Brands";
import { SearchIcon, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import Image from "next/image";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Brand {
  logo: string;
  id: number | string;
  name: string;
  slug: string;
}

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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .cat-root {
    // background: #f5f4f1;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── STICKY NAV ── */
  .cat-nav {
    position: sticky;
    top: 0;
    z-index: 200;
    background: #fff;
    border-bottom: 1px solid #ebebeb;
  }

  .cat-nav-row {
    display: flex;
    align-items: stretch;
    height: 64spx;
  }

  /* ── TABS ── */
  .cat-tabs-scroll {
    display: flex;
    align-items: stretch;
    overflow-x: auto;
    scrollbar-width: none;
    flex: 1;
    min-width: 0;
  }
  .cat-tabs-scroll::-webkit-scrollbar { display: none; }

  .cat-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 20px;
    font-size: 13.5px;
    font-weight: 400;
    color: #888;
    white-space: nowrap;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color .18s, border-color .18s;
    flex-shrink: 0;
    letter-spacing: -0.01em;
  }
  .cat-tab:hover { color: #111; }
  .cat-tab.active {
    color: #111;
    font-weight: 600;
    border-bottom-color: #111;
  }

  /* ── BRAND TAB ── */
  .brand-tab-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .brand-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 64px;
    padding: 0 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 400;
    color: #888;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color .18s;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .brand-tab-btn:hover { color: #111; }
  .brand-tab-btn.active {
    color: #111;
    font-weight: 600;
    border-bottom-color: #111;
  }
  .brand-chevron {
    transition: transform .22s cubic-bezier(.4,0,.2,1);
    color: currentColor;
  }
  .brand-chevron.open { transform: rotate(180deg); }

  /* ── BRAND MEGA MENU ── */
  .brand-mega {
    position: fixed;
    top: 52px;
    left: 0;
    width: 100%;
    background: #fff;
    border-bottom: 1px solid #ebebeb;
    box-shadow: 0 12px 40px -8px rgba(0,0,0,0.10);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition: opacity .2s ease, transform .2s ease, visibility .2s;
    z-index: 199;
    pointer-events: none;
  }
  .brand-mega.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }
  .brand-mega-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 28px 24px;
  }
  .brand-mega-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .brand-mega-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #aaa;
  }
  .brand-mega-count {
    font-size: 12px;
    color: #bbb;
  }

  /* ── BRAND GRID ── */
  .brand-mega-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 8px;
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #ddd transparent;
    padding:5px
  }
  .brand-mega-grid::-webkit-scrollbar {
    width: 4px;
  }
  .brand-mega-grid::-webkit-scrollbar-track {
    background: transparent;
  }
  .brand-mega-grid::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 99px;
  }

  /* ── BRAND CARD ── */
  .brand-card {
    padding: 8px 6px;
    border: 1.5px solid #efefef;
    border-radius: 10px;
    background: #fafafa;
    cursor: pointer;
    text-align: center;
    transition: border-color .18s, background .18s, transform .18s, box-shadow .18s;
  }
  .brand-card:hover {
    border-color: #ccc;
    background: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.06);
  }
  .brand-card.selected {
    border-color: #111;
    background: #fff;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0,0,0,0.10);
  }
  .brand-logo-wrap {
    width: 32px;
    height: 32px;
    border-radius: 7px;
    background: #fff;
    border: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 6px;
    overflow: hidden;
    position: relative;
  }
  .brand-initials {
    font-size: 10px;
    font-weight: 700;
    color: #555;
    letter-spacing: -0.02em;
  }
  .brand-card-name {
    font-size: 10px;
    font-weight: 500;
    color: #444;
    line-height: 1.25;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .brand-card.selected .brand-card-name { color: #111; }

  /* shimmer */
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .shimmer-card {
    height: 68px;
    border-radius: 10px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ── NAV RIGHT: SEARCH ── */
  .cat-search-wrap {
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-left: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  .cat-search-inner {
    position: relative;
    display: flex;
    align-items: center;
  }
  .cat-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #bbb;
    display: flex;
    pointer-events: none;
  }
  .cat-search-input {
    height: 34px;
    width: 160px;
    background: #f7f7f5;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0 32px 0 32px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #111;
    outline: none;
    transition: border-color .18s, width .2s, background .18s;
  }
  .cat-search-input:focus {
    border-color: #111;
    background: #fff;
    width: 200px;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
  }
  .cat-search-input::placeholder { color: #bbb; }
  .cat-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    display: flex;
    align-items: center;
    padding: 0;
    line-height: 1;
    transition: color .15s;
  }
  .cat-search-clear:hover { color: #333; }

  /* ── TOP BAR ── */
  .cat-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 28px;
    flex-wrap: wrap;
  }
  .cat-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cat-heading {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    color: #111;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .cat-count {
    font-size: 13px;
    color: #aaa;
    font-weight: 400;
  }

  /* filter pill */
  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 6px 5px 12px;
    background: #111;
    color: #fff;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .filter-pill-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(255,255,255,0.18);
    border-radius: 50%;
    border: none;
    cursor: pointer;
    color: #fff;
    padding: 0;
    transition: background .15s;
  }
  .filter-pill-remove:hover { background: rgba(255,255,255,0.3); }

  /* ── SORT ── */
  .cat-topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sort-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 10px;
    padding: 0 4px 0 12px;
    height: 40px;
  }
  .sort-icon {
    color: #aaa;
    display: flex;
    flex-shrink: 0;
  }
  .sort-label {
    font-size: 13px;
    color: #888;
    white-space: nowrap;
    font-weight: 400;
  }
  .sort-select {
    height: 100%;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #111;
    cursor: pointer;
    outline: none;
    padding-right: 6px;
    min-width: 160px;
  }

  /* ── PRODUCTS AREA ── */
  .products-area {
    padding: 0 28px 40px;
  }

  /* ── SPINNER ── */
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-top-color: #111;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .products-load-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px 0;
    color: #888;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── FULL PAGE LOADING ── */
  .full-page-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    // background: #f5f4f1;
  }

  /* ── GRID LOADING OVERLAY ── */
  .grid-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 0;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .cat-topbar {
      padding: 14px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .cat-topbar-right { width: 100%; }
    .sort-wrap { width: 100%; }
    .sort-select { flex: 1; min-width: 0; }
    .cat-heading { font-size: 22px; }
    .products-area { padding: 0 16px 32px; }
    .brand-mega-inner { padding: 14px 16px 18px; }
    .brand-mega-grid {
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      max-height: 220px;
    }
    .cat-search-wrap { padding: 0 10px; }
    .cat-search-input { width: 120px; }
    .cat-search-input:focus { width: 150px; }
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
  const [brandList, setBrandList] = useState<Brand[]>([]);

  const [activeCategory, setActiveCategory] = useState<Category>({
    id: null,
    name: "All",
  });

  const [sortBy, setSortBy] = useState<SortOption["value"]>("popular");

  const categorySearchInitRef = useRef(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [productGridLoading, setProductGridLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [total_products, setTotalProducts] = useState(0);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);

  const fetchingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const activeCategoryRef = useRef<Category>(activeCategory);
  const sortByRef = useRef<SortOption["value"]>(sortBy);
  const activeBrandRef = useRef<Brand | null>(null);

  // ─────────────────────────────────────────────────────────
  // Sync refs
  // ─────────────────────────────────────────────────────────
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);
  useEffect(() => { activeBrandRef.current = activeBrand; }, [activeBrand]);

  // ─────────────────────────────────────────────────────────
  // Sort
  // ─────────────────────────────────────────────────────────
  const sortProducts = (data: Product[], sort: SortOption["value"]): Product[] => {
    const copy = [...data];
    if (sort === "price-asc") return copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sort === "price-desc") return copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return copy;
  };

  // ─────────────────────────────────────────────────────────
  // Brands API
  // ─────────────────────────────────────────────────────────
  const fetchBrands = useCallback(async () => {
    try {
      const res = await GetAllBrandsApi();
      const raw = Array.isArray(res?.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      const formatted: Brand[] = raw.map((b: any) => ({
        id: b.id,
        name: b.name ?? b.brand_name ?? "",
        slug: b.slug ?? "",
        logo: b.logo_url ?? null,
      }));
      setBrandList(formatted);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Categories API
  // ─────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res: ProductCategoryApiResponse = await ProductCategoryApi({
        page: 1,
        limit: CATEGORY_LIMIT,
      });
      const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
      const formatted: Category[] = raw.map((cat: any) => ({
        id: cat.id,
        name: cat.title ?? cat.name ?? cat.category_name ?? "",
        slug: cat.slug,
      }));
      setCategories([{ id: null, name: "All" }, ...formatted]);
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
      brand: Brand | null
    ) => {
      try {
        setProductLoading(true);

        const brandOrCategoryPayload = brand
          ? { brand_id: brand.id }
          : category.id !== null
            ? { category_id: category.id }
            : {};

        const res: ProductApiResponse = await AllProductsApi({
          page: pageNumber,
          limit: pageNumber === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT,
          ...brandOrCategoryPayload,
        });

        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const sorted = sortProducts(raw, sort);

        setProducts((prev) => isLoadMore ? [...prev, ...sorted] : sorted);
        setTotalProducts(res?.data?.data?.pagination?.total ?? 0);

        const more = raw.length === (pageNumber === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT);
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
      fetchBrands(),
      fetchCategories(),
      fetchProducts(1, false, { id: null, name: "All" }, "popular", null),
    ]);
  }, [fetchBrands, fetchCategories, fetchProducts]);

  // ─────────────────────────────────────────────────────────
  // Category / Sort / Brand Change
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialLoading) return;
    setProductGridLoading(true);
    fetchProducts(1, false, activeCategory, sortBy, activeBrand);
    pageRef.current = 1;
    setPage(1);
  }, [activeCategory, sortBy, activeBrand]);

  // ─────────────────────────────────────────────────────────
  // Category Search
  // ─────────────────────────────────────────────────────────
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
        const formatted: Category[] = raw.map((cat: any) => ({
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
      if (fetchingRef.current || !hasMoreRef.current || productLoading) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        fetchingRef.current = true;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        await fetchProducts(
          nextPage,
          true,
          activeCategoryRef.current,
          sortByRef.current,
          activeBrandRef.current
        );
        fetchingRef.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts, productLoading]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────
  const handleCategorySelect = (cat: Category) => {
    setActiveBrand(null);
    activeBrandRef.current = null;
    setActiveCategory(cat);
    activeCategoryRef.current = cat;
  };

  const handleBrandSelect = (brand: Brand) => {
    setActiveBrand(brand);
    activeBrandRef.current = brand;
    setBrandMenuOpen(false);
  };

  const handleClearFilter = () => {
    const allCategory: Category = { id: null, name: "All" };
    activeCategoryRef.current = allCategory;
    setActiveCategory(allCategory);
    setActiveBrand(null);
    activeBrandRef.current = null;
    if (categorySearch !== "") setCategorySearch("");
  };

  // ─────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="full-page-loader">
        <style>{styles}</style>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────
  return (
    <div className="cat-root">
      <style>{styles}</style>

      {/* ── STICKY NAV ── */}
      <div className="cat-nav">
        <div className="cat-nav-row">

          {/* Brand tab (hover trigger) */}
          <div
            className="brand-tab-wrap"
            onMouseEnter={() => setBrandMenuOpen(true)}
            onMouseLeave={() => setBrandMenuOpen(false)}
          >
            <button className={`brand-tab-btn ${brandMenuOpen || activeBrand ? "active" : ""}`}>
              Brands
              <ChevronDown
                size={14}
                className={`brand-chevron ${brandMenuOpen ? "open" : ""}`}
              />
            </button>

            {/* Mega Menu */}
            <div className={`brand-mega ${brandMenuOpen ? "open" : ""}`}>
              <div className="brand-mega-inner">
                <div className="brand-mega-head">
                  <span className="brand-mega-title">Shop by brand</span>
                  <span className="brand-mega-count">{brandList.length} brands</span>
                </div>

                <div className="brand-mega-grid">
                  {brandList.length === 0
                    ? Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="shimmer-card" />
                    ))
                    : brandList.map((brand) => {
                      const isSelected = activeBrand?.id === brand.id;
                      return (
                        <div
                          key={brand.id}
                          className={`brand-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleBrandSelect(brand)}
                        >
                          <div className="brand-logo-wrap">
                            {brand.logo ? (
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                fill
                                style={{ objectFit: "contain", padding: 4 }}
                              />
                            ) : (
                              <span className="brand-initials">
                                {brandInitials(brand.name)}
                              </span>
                            )}
                          </div>
                          <div className="brand-card-name">{brand.name}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="cat-tabs-scroll">
            {categories
              .filter((cat) => cat.name !== BRAND_TAB_NAME)
              .map((cat) => (
                <div
                  key={cat.id}
                  className={`cat-tab ${activeCategory.id === cat.id && !activeBrand ? "active" : ""}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat.name}
                </div>
              ))}
          </div>

          {/* Search */}
          <div className="cat-search-wrap">
            <div className="cat-search-inner">
              <span className="cat-search-icon">
                <SearchIcon size={14} />
              </span>
              <input
                type="search"
                className="cat-search-input"
                placeholder="Filter categories…"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
              {categorySearch && (
                <button
                  className="cat-search-clear"
                  onClick={() => { setCategorySearch(""); handleClearFilter(); }}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP BAR ── */}
      <div className="cat-topbar">
        <div className="cat-topbar-left">
          <h1 className="cat-heading">
            {activeBrand ? activeBrand.name : activeCategory.name}
          </h1>
          <span className="cat-count">{total_products} items</span>

          {(activeCategory.id !== null || activeBrand) && (
            <span className="filter-pill">
              {activeBrand ? activeBrand.name : activeCategory.name}
              <button
                className="filter-pill-remove"
                onClick={handleClearFilter}
                aria-label="Remove filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>

        <div className="cat-topbar-right">
          <div className="sort-wrap">
            <span className="sort-icon">
              <SlidersHorizontal size={14} />
            </span>
            <span className="sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption["value"])}
              className="sort-select"
            >
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div className="products-area">
        {productGridLoading ? (
          <div className="grid-loading">
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductGrid products={products} />
            {productLoading && page > 1 && (
              <div className="products-load-more">
                <div className="spinner" />
                Loading more products…
              </div>
            )}
          </>
        ) : (
          <EmptyProducts reset={handleClearFilter} />
        )}
      </div>
    </div>
  );
}