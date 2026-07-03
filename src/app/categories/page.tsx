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
  SortOption,
  ProductApiResponse,
  ProductCategoryApiResponse,
} from "@/data/typesproduct";

import { SearchIcon, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import Image from "next/image";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Brand {
  logo: string;
  id: number | string;
  name: string;
  slug: string;
}

interface ParentCategory {
  id: number;
  title: string;
}

interface GrandCategory {
  id: number | null;
  name: string;
  slug?: string;
  parent_categories?: ParentCategory[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_LIMIT   = 16;
const LOAD_MORE_LIMIT = 16;
const CATEGORY_LIMIT  = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function brandInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .cat-root {
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
    height: 64px;
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

  /* ── GRAND CATEGORY TAB WRAPPER (hover area) ── */
  .cat-tab-wrap {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
  }

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
    letter-spacing: -0.01em;
  }
  .cat-tab.active {
    color: #111;
    font-weight: 600;
    border-bottom-color: #111;
  }
  .cat-tab-chevron {
    transition: transform .2s;
    color: currentColor;
    opacity: 0.5;
  }
  .cat-tab-chevron.open { transform: rotate(180deg); opacity: 1; }

  /* ── PARENT SUB-NAV BAR (horizontal, full width, below sticky nav) ── */
  .cat-subnav {
    position: fixed;
    left: 0;
    width: 100%;
    background: #fafafa;
    border-bottom: 1px solid #ebebeb;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
    transition: opacity .16s ease, transform .16s ease, visibility .16s;
    pointer-events: none;
  }
  .cat-subnav.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }
  .cat-subnav-inner {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 24px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .cat-subnav-inner::-webkit-scrollbar { display: none; }
  .cat-subnav-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #bbb;
    white-space: nowrap;
    margin-right: 4px;
    flex-shrink: 0;
  }
  .cat-tab-dropdown-item {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    white-space: nowrap;
    transition: background .13s, color .13s, border-color .13s;
    border: 1.5px solid #e8e8e8;
    background: #fff;
    border-radius: 999px;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .cat-tab-dropdown-item:hover {
    background: #f0f0f0;
    color: #111;
    border-color: #ccc;
  }
  .cat-tab-dropdown-item.active {
    color: #fff;
    font-weight: 600;
    background: #111;
    border-color: #111;
  }

  /* ── BRAND TAB BUTTON ── */
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
    top: 127px;
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
    padding: 5px;
  }

  /* ── BRAND FOOTER ── */
  .brand-mega-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #f0f0f0;
  }
  .brand-load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 18px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background .18s;
  }
  .brand-load-more-btn:hover:not(:disabled) { background: #333; }
  .brand-load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .brand-count-pill {
    font-size: 12px;
    color: #bbb;
    margin-left: auto;
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

  /* shimmer skeleton */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .shimmer-card {
    height: 68px;
    border-radius: 10px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ── SEARCH ── */
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

  /* ── SORT CONTROLS ── */
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
  .sort-icon { color: #aaa; display: flex; flex-shrink: 0; }
  .sort-label { font-size: 13px; color: #888; white-space: nowrap; font-weight: 400; }
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
  .products-area { padding: 0 28px 40px; }

  /* ── SPINNERS ── */
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

  .full-page-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

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
    .cat-topbar-right { width: 100%; flex-wrap: wrap; gap: 8px; }
    .sort-wrap { flex: 1; min-width: 120px; }
    .sort-select { flex: 1; min-width: 0; }
    .cat-heading { font-size: 22px; }
    .products-area { padding: 0 16px 32px; }
    .brand-mega-inner { padding: 14px 16px 18px; }
    .brand-mega-grid { grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); }
    .cat-search-wrap { padding: 0 10px; }
    .cat-search-input { width: 120px; }
    .cat-search-input:focus { width: 150px; }
    .cat-subnav-inner { padding: 8px 14px; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Categories() {
  // ── Products ──────────────────────────────────────────────────────────────
  const [products, setProducts]                     = useState<any[]>([]);
  const [total_products, setTotalProducts]          = useState(0);
  const [productLoading, setProductLoading]         = useState(false);
  const [productGridLoading, setProductGridLoading] = useState(false);
  const [initialLoading, setInitialLoading]         = useState(true);
  const [page, setPage]                             = useState(1);
  const [hasMore, setHasMore]                       = useState(true);

  // ── Grand Categories ──────────────────────────────────────────────────────
  const [categories, setCategories]         = useState<GrandCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<GrandCategory>({ id: null, name: "All" });
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  // ── Active parent category (sub-filter under a grand category) ────────────
  const [activeParent, setActiveParent] = useState<ParentCategory | null>(null);

  // ── Brands ────────────────────────────────────────────────────────────────
  const [brandList, setBrandList]     = useState<Brand[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortOption["value"]>("popular");

  // ── Category dropdown hover ────────────────────────────────────────────────
  const [hoveredCatId, setHoveredCatId] = useState<number | null | "none">("none");
  const [dropdownPos, setDropdownPos]   = useState({ top: 0, left: 0 });
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fetchingRef        = useRef(false);
  const pageRef            = useRef(1);
  const hasMoreRef         = useRef(true);
  const activeCategoryRef  = useRef<GrandCategory>(activeCategory);
  const activeParentRef    = useRef<ParentCategory | null>(null);
  const sortByRef          = useRef<SortOption["value"]>(sortBy);
  const activeBrandRef     = useRef<Brand | null>(null);
  const categorySearchInit = useRef(false);

  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { activeParentRef.current   = activeParent;   }, [activeParent]);
  useEffect(() => { sortByRef.current         = sortBy;         }, [sortBy]);
  useEffect(() => { activeBrandRef.current    = activeBrand;    }, [activeBrand]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const sortProducts = (data: any[], sort: SortOption["value"]): any[] => {
    const copy = [...data];
    if (sort === "price-asc")  return copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sort === "price-desc") return copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return copy;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BRANDS — load all brands
  // ─────────────────────────────────────────────────────────────────────────
  const fetchBrands = useCallback(async () => {
    try {
      setBrandLoading(true);
      const res = await GetAllBrandsApi(1, 1000); // Fetch up to 1000 brands
      const raw: any[] = Array.isArray(res?.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      const formatted: Brand[] = raw.map((b: any) => ({
        id:   b?.id,
        name: b?.name ?? b?.brand_name ?? "",
        slug: b?.slug ?? "",
        logo: b?.logo_url ?? null,
      }));

      setBrandList(formatted);
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setBrandLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res: ProductCategoryApiResponse = await ProductCategoryApi({
        page:  1,
        limit: CATEGORY_LIMIT,
      });

      const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];

      const formatted: GrandCategory[] = raw.map((cat: any) => ({
        id:                cat.id,
        name:              cat.title ?? cat.name ?? cat.category_name ?? "",
        slug:              cat.slug ?? "",
        parent_categories: Array.isArray(cat.parent_categories)
          ? cat.parent_categories
          : [],
      }));

      // NOTE: "All" is still kept as the first entry of `categories` state
      // (index 0) so existing filter logic / activeCategory defaults keep
      // working. It's just rendered in a different position (see JSX below).
      setCategories([
        { id: null, name: "All", parent_categories: [] },
        ...formatted,
      ]);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (
      pageNumber: number,
      isLoadMore: boolean,
      category: GrandCategory,
      parent: ParentCategory | null,
      sort: SortOption["value"],
      brand: Brand | null
    ) => {
      try {
        setProductLoading(true);

        // Priority: brand > parent category > grand category
        const filterPayload = brand
          ? { brand_id: brand.id }
          : parent
          ? { category_id: parent.id }
          : category.id !== null
          ? { category_id: category.id }
          : {};

        const res: ProductApiResponse = await AllProductsApi({
          page:  pageNumber,
          limit: LOAD_MORE_LIMIT,
          ...filterPayload,
        });

        const raw    = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const sorted = sortProducts(raw, sort);

        setProducts((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));
        setTotalProducts(res?.data?.data?.pagination?.total ?? 0);

        const more = raw.length === LOAD_MORE_LIMIT;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setProductLoading(false);
        setProductGridLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Initial load
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchBrands(),
      fetchCategories(),
      fetchProducts(1, false, { id: null, name: "All" }, null, "popular", null),
    ]);
  }, [fetchBrands, fetchCategories, fetchProducts]);

  // ─────────────────────────────────────────────────────────────────────────
  // Re-fetch when filter / sort changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialLoading) return;
    setProductGridLoading(true);
    fetchProducts(1, false, activeCategory, activeParent, sortBy, activeBrand);
    pageRef.current = 1;
    setPage(1);
  }, [activeCategory, activeParent, sortBy, activeBrand]);

  // ─────────────────────────────────────────────────────────────────────────
  // Category search
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!categorySearchInit.current) { categorySearchInit.current = true; return; }
    if (!categorySearch.trim()) return;

    const run = async () => {
      try {
        setCategoryLoading(true);
        const res: ProductCategoryApiResponse = await ProductCategoryApi({
          page: 1, limit: CATEGORY_LIMIT, search: categorySearch,
        });
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const formatted: GrandCategory[] = raw.map((cat: any) => ({
          id:                cat.id,
          name:              cat.title ?? cat.name ?? cat.category_name ?? "Unnamed",
          slug:              cat.slug ?? "",
          parent_categories: Array.isArray(cat.parent_categories) ? cat.parent_categories : [],
        }));

        const next = formatted.length > 0 ? formatted[0] : { id: null, name: "All", parent_categories: [] };
        setActiveCategory(next);
        activeCategoryRef.current = next;
        setActiveParent(null);
        activeParentRef.current = null;
      } catch (err) {
        console.error("Error searching category:", err);
      } finally {
        setCategoryLoading(false);
      }
    };

    run();
  }, [categorySearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // Infinite scroll — auto-load when user scrolls near bottom
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = async () => {
      if (fetchingRef.current || !hasMoreRef.current || productLoading) return;
      const { scrollY, innerHeight } = window;
      const fullHeight = document.documentElement.scrollHeight;
      if (scrollY + innerHeight >= fullHeight - 200) {
        fetchingRef.current = true;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        await fetchProducts(
          nextPage, true,
          activeCategoryRef.current,
          activeParentRef.current,
          sortByRef.current,
          activeBrandRef.current
        );
        fetchingRef.current = false;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts, productLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  // Category / Parent / Brand select / clear
  // ─────────────────────────────────────────────────────────────────────────

  const handleCategorySelect = (cat: GrandCategory) => {
    setActiveBrand(null);
    activeBrandRef.current = null;
    setActiveParent(null);
    activeParentRef.current = null;
    setActiveCategory(cat);
    activeCategoryRef.current = cat;
  };

  const handleParentSelect = (grandCat: GrandCategory, parent: ParentCategory) => {
    setActiveBrand(null);
    activeBrandRef.current = null;
    setActiveCategory(grandCat);
    activeCategoryRef.current = grandCat;
    setActiveParent(parent);
    activeParentRef.current = parent;
  };

  const handleBrandSelect = (brand: Brand) => {
    setActiveBrand(brand);
    activeBrandRef.current = brand;
    setActiveParent(null);
    activeParentRef.current = null;
    setBrandMenuOpen(false);
  };

  const handleClearFilter = () => {
    const all: GrandCategory = { id: null, name: "All", parent_categories: [] };
    setActiveCategory(all);
    activeCategoryRef.current = all;
    setActiveParent(null);
    activeParentRef.current = null;
    setActiveBrand(null);
    activeBrandRef.current = null;
    if (categorySearch) setCategorySearch("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Heading label
  // ─────────────────────────────────────────────────────────────────────────
  const headingLabel = activeBrand
    ? activeBrand.name
    : activeParent
    ? activeParent.title
    : activeCategory.name;

  const pillLabel = activeBrand
    ? activeBrand.name
    : activeParent
    ? activeParent.title
    : activeCategory.name;

  const showPill = activeBrand || activeParent || activeCategory.id !== null;

  // Split "All" out from the rest of the categories so we can control
  // render order independently (All -> Brands -> other categories),
  // while `categories` state itself is untouched.
  const allCategoryTab   = categories.find((c) => c.id === null) ?? { id: null, name: "All", parent_categories: [] };
  const otherCategoryTabs = categories.filter((c) => c.id !== null);

  // ─────────────────────────────────────────────────────────────────────────
  // Full-page loader
  // ─────────────────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="full-page-loader">
        <style>{styles}</style>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cat-root">
      <style>{styles}</style>

      {/* ── STICKY NAV ── */}
      <div className="cat-nav">
        <div className="cat-nav-row">

          <div className="cat-tabs-scroll">

            {/* ── "All" tab — always first ── */}
            {(() => {
              const cat = allCategoryTab;
              const isGrandActive = !activeBrand && !activeParent && activeCategory.id === cat.id;
              return (
                <div key="all" className="cat-tab-wrap">
                  <div
                    className={`cat-tab ${isGrandActive ? "active" : ""}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat.name}
                  </div>
                </div>
              );
            })()}

            {/* ── Brand dropdown — second ── */}
            <div
              className="brand-tab-wrap"
              onMouseEnter={() => setBrandMenuOpen(true)}
              onMouseLeave={() => setBrandMenuOpen(false)}
            >
              <button className={`brand-tab-btn ${brandMenuOpen || activeBrand ? "active" : ""}`}>
                Brands
                <ChevronDown size={14} className={`brand-chevron ${brandMenuOpen ? "open" : ""}`} />
              </button>

              {/* Mega menu */}
              <div className={`brand-mega ${brandMenuOpen ? "open" : ""}`}>
                <div className="brand-mega-inner">
                  <div className="brand-mega-head">
                    <span className="brand-mega-title">Shop by brand</span>
                    <span className="brand-mega-count">
                      {brandList.length} brand{brandList.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="brand-mega-grid">
                    {brandList.length === 0 && !brandLoading
                      ? Array.from({ length: 15 }).map((_, i) => (
                          <div key={i} className="shimmer-card" />
                        ))
                      : brandList.map((brand) => {
                          const selected = activeBrand?.id === brand.id;
                          return (
                            <div
                              key={brand.id}
                              className={`brand-card ${selected ? "selected" : ""}`}
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
                                  <span className="brand-initials">{brandInitials(brand.name)}</span>
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

            {/* ── Remaining category tabs — after brands ── */}
            {otherCategoryTabs.map((cat) => {
              const hasParents = cat.parent_categories && cat.parent_categories.length > 0;
              const isGrandActive  = !activeBrand && !activeParent && activeCategory.id === cat.id;
              const isParentActive = !activeBrand && !!activeParent && activeCategory.id === cat.id;
              const isOpen = hoveredCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="cat-tab-wrap"
                  ref={(el) => { tabRefs.current[String(cat.id)] = el; }}
                  onMouseEnter={() => {
                    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                    if (!hasParents) { setHoveredCatId("none"); return; }
                    const el = tabRefs.current[String(cat.id)];
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      setDropdownPos({ top: rect.bottom, left: 0 });
                    }
                    setHoveredCatId(cat.id);
                  }}
                  onMouseLeave={() => {
                    hoverTimeout.current = setTimeout(() => setHoveredCatId("none"), 150);
                  }}
                >
                  <div
                    className={`cat-tab ${isGrandActive || isParentActive ? "active" : ""}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat.name}
                    {hasParents && (
                      <ChevronDown
                        size={12}
                        className={`cat-tab-chevron ${isOpen ? "open" : ""}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Search ── */}
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

      {/* ── HORIZONTAL SUBNAV ── */}
      {(() => {
        const openCat = hoveredCatId !== "none"
          ? categories.find((c) => c.id === hoveredCatId)
          : null;
        const parents = openCat?.parent_categories ?? [];
        const isVisible = !!openCat && parents.length > 0;
        return (
          <div
            className={`cat-subnav ${isVisible ? "open" : ""}`}
            style={{ top: dropdownPos.top }}
            onMouseEnter={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            }}
            onMouseLeave={() => {
              hoverTimeout.current = setTimeout(() => setHoveredCatId("none"), 150);
            }}
          >
            <div className="cat-subnav-inner">
              <span className="cat-subnav-label">
                {openCat?.name}
              </span>
              {parents.map((parent) => (
                <button
                  key={parent.id}
                  className={`cat-tab-dropdown-item ${
                    activeParent?.id === parent.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setHoveredCatId("none");
                    handleParentSelect(openCat!, parent);
                  }}
                >
                  {parent.title}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── TOP BAR ── */}
      <div className="cat-topbar">
        <div className="cat-topbar-left">
          <h1 className="cat-heading">{headingLabel}</h1>
          <span className="cat-count">{total_products} items</span>

          {showPill && (
            <span className="filter-pill">
              {pillLabel}
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
            <span className="sort-icon"><SlidersHorizontal size={14} /></span>
            <span className="sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption["value"])}
              className="sort-select"
            >
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
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