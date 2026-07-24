"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";
import { sortOptions } from "@/data/products";
import { AllProductsApi } from "@/api/operations/product.api";
// NOTE: ProductsByParentCategoryApi / ProductsByGrandCategoryApi are no longer
// used for product fetching — every filter combination (brand, category,
// size, color, in_stock, price, gender, fabric, search, sort) goes through
// the SAME endpoint (AllProductsApi) as comma-separated params, e.g.:
//   page=1&limit=16&search=tshirts&brand_id=1,2,3&category_id=132
//   &sort=newest&size=XL&in_stock=true&color=Black&min_price=20&max_price=40
//   &gender=UNISEX&fabric=COTTON
// If your backend doesn't yet accept category_id / size / color / in_stock /
// min_price / max_price / gender / fabric on that endpoint, those params
// just need to be added server-side.
//
// CATEGORY SELECTION — category_id now supports checking sub-categories
// under MULTIPLE different top-level (grand) categories at the same time,
// e.g. Apparel & Uniforms > T-Shirt AND Business Cards > Standard checked
// together sends category_id=<tshirt_id>,<standard_id>. See `activeParents`
// (now cross-category) and `buildFilterParams` below.
import { ProductCategoryApi } from "@/api/operations/product.api";
import { GetAllBrandsApi } from "@/api/operations/brand.api";
import type {
    SortOption,
    ProductApiResponse,
    ProductCategoryApiResponse,
} from "@/data/typesproduct";
import { ChevronDown, X, Check, RotateCcw, ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Brand {
    logo: string;
    id: number | string;
    name: string;
    slug: string;
    count?: number;
}
interface ParentCategory {
    slug?: string;
    id: number;
    title: string;
    count?: number;
}
// A checked sub-category, tagged with which top-level (grand) category it
// belongs to. Because the sidebar tree now allows expanding + checking
// sub-categories under several DIFFERENT grand categories at once (e.g.
// Apparel & Uniforms > T-Shirt and Business Cards > Standard together),
// each selection needs to remember its own parent so we can build pills,
// remove individual selections, and group correctly.
interface SelectedSubCategory extends ParentCategory {
    grandId: number;
    grandName: string;
}
interface GrandCategory {
    id: number | null;
    name: string;
    slug?: string;
    count?: number;
    parent_categories?: ParentCategory[];
}
interface CategoriesViewProps {
    initialCategoryId?: string;
    initialCategorySlug?: string;
    initialParentId?: string;
    initialParentSlug?: string;
    initialBrandId?: string;
    initialBrandSlug?: string;
}
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const LOAD_MORE_LIMIT = 16;
const CATEGORY_LIMIT = 50;
const SESSION_STORAGE_KEY = "activeSelection";
// Static facet options for size/color. Swap these for whatever your API
// returns (e.g. per-category available sizes/colors) whenever that's ready.
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
const COLOR_OPTIONS: { name: string; hex: string }[] = [
    { name: "Black", hex: "#111111" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#9CA3AF" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Navy", hex: "#1E3A8A" },
    { name: "Red", hex: "#DC2626" },
    { name: "Green", hex: "#16A34A" },
    { name: "Olive", hex: "#708238" },
    { name: "Yellow", hex: "#FACC15" },
    { name: "Orange", hex: "#F97316" },
    { name: "Purple", hex: "#7C3AED" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Brown", hex: "#8B5E3C" },
    { name: "Beige", hex: "#E8DCC8" },
    { name: "Gold", hex: "#D4AF37" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Teal", hex: "#0D9488" },
    { name: "Maroon", hex: "#800000" },
    { name: "Mushroom", hex: "#B79A81" },
];
// Sent to the API as-is (e.g. gender=MEN,UNISEX / fabric=COTTON,POLYESTER).
// The keyword arrays are kept around for whoever wires up server-side
// matching against product titles/descriptions.
const GENDER_KEYWORDS: Record<string, string[]> = {
    MEN: ["men", "mens", "men's"],
    WOMEN: ["women", "ladies", "female", "women's"],
    YOUTH: ["youth"],
    TODDLER: ["toddler"],
    INFANT: ["infant", "baby"],
    UNISEX: ["unisex"],
};
const FABRIC_KEYWORDS: Record<string, string[]> = {
    COTTON: ["cotton"],
    POLYESTER: ["polyester"],
    FLEECE: ["fleece"],
    CANVAS: ["canvas"],
    DENIM: ["denim"],
    NYLON: ["nylon"],
};
const GENDER_OPTIONS = Object.keys(GENDER_KEYWORDS);
const FABRIC_OPTIONS = Object.keys(FABRIC_KEYWORDS);
const PRICE_MIN = 0;
const PRICE_MAX = 500;
const PRICE_STEP = 5;
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
function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function persistSelection(
    type: string | null,
    id: string | number | null,
    extra?: Record<string, unknown>
) {
    if (typeof window === "undefined") return;
    try {
        if (type && id !== null && id !== undefined) {
            window.sessionStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify({ type, id, ...extra })
            );
        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (err) {
        console.error("Error writing selection to sessionStorage:", err);
    }
}
/** Builds the flat query-param object sent to AllProductsApi. Every active
 * multi-select facet is joined into a comma-separated string. */
function buildFilterParams(opts: {
    page: number;
    limit: number;
    search: string;
    sort: SortOption["value"];
    category: GrandCategory;
    parents: SelectedSubCategory[];
    brands: Brand[];
    sizes: string[];
    colors: string[];
    inStock: boolean;
    priceRange: [number, number];
    genders: string[];
    fabrics: string[];
}) {
    const params: Record<string, any> = {
        page: opts.page,
        limit: opts.limit,
    };
    // Blank ("") means "no sort chosen yet" — don't send the param at all.
    if (opts.sort) params.sort = opts.sort;
    if (opts.search) params.search = opts.search;
    if (opts.brands.length) {
        params.brand_id = opts.brands.map((b) => b.id).join(",");
    }
    // If specific sub-categories are checked — possibly spanning several
    // DIFFERENT top-level categories (e.g. Apparel & Uniforms > T-Shirt +
    // Business Cards > Standard) — they take precedence and are sent as a
    // single comma list. Otherwise fall back to the single active grand
    // category id (plain category-name click, no checkboxes selected yet).
    if (opts.parents.length) {
        params.category_id = opts.parents.map((p) => p.id).join(",");
    } else if (opts.category?.id != null) {
        params.category_id = String(opts.category.id);
    }
    if (opts.sizes.length) params.size = opts.sizes.join(",");
    if (opts.colors.length) params.color = opts.colors.join(",");
    if (opts.inStock) params.in_stock = true;
    if (opts.priceRange[0] > PRICE_MIN) params.min_price = opts.priceRange[0];
    if (opts.priceRange[1] < PRICE_MAX) params.max_price = opts.priceRange[1];
    if (opts.genders.length) params.gender = opts.genders.join(",");
    if (opts.fabrics.length) params.fabric = opts.fabrics.join(",");
    return params;
}
// ─────────────────────────────────────────────────────────────────────────────
// Styles — driven entirely by the shared design-system tokens defined in
// globals.css (@theme). No hardcoded brand colors: swap the tokens there and
// this whole view re-themes itself.
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; }
  .cat-root {
    min-height: 100vh;
    font-family: var(--font-body);
    background: var(--color-background);
    color: var(--color-foreground);
  }
  .cat-shell { display: flex; align-items: flex-start; }
  /* ── SIDEBAR ── */
  .cat-sidebar {
    width: 272px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
    overflow-y: auto; background: var(--color-card); border-right: 1px solid var(--color-border);
    padding: 22px 18px 40px; z-index: 210;
  }
  .cat-main { flex: 1; min-width: 0; }
  .sidebar-top-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .sidebar-title { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--color-foreground); letter-spacing: -0.02em; }
  .sidebar-close-btn {
    display: none; align-items: center; justify-content: center; width: 32px; height: 32px;
    border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-background);
    color: var(--color-foreground); cursor: pointer;
  }
  .sidebar-reset-btn {
    display: flex; align-items: center; gap: 6px; padding: 7px 12px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-background);
    font-size: 12.5px; font-weight: 600; color: var(--color-foreground); cursor: pointer; transition: all .15s;
  }
  .sidebar-reset-btn:hover { border-color: var(--color-ring); background: var(--color-secondary); }
  .sidebar-reset-btn:focus-visible, .sidebar-close-btn:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  /* ── ACCORDION SECTIONS ── */
  .facet-section { border-bottom: 1px solid var(--color-border); }
  .facet-header {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 13px 4px; cursor: pointer; user-select: none; background: none; border: none;
    width: 100%; text-align: left; font-family: var(--font-body); color: inherit;
  }
  .facet-header:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; border-radius: var(--radius-sm); }
  .facet-header-left { display: flex; align-items: center; gap: 8px; }
  .facet-title { font-size: 14px; font-weight: 600; color: var(--color-foreground); }
  .facet-count-badge {
    font-size: 11px; font-weight: 700; color: var(--color-accent-foreground); background: var(--color-primary);
    border-radius: 999px; padding: 1px 7px; min-width: 18px; text-align: center;
  }
  .facet-chevron { color: var(--color-muted-foreground); transition: transform .18s; flex-shrink: 0; }
  .facet-chevron.open { transform: rotate(180deg); }
  .facet-body { padding: 2px 2px 14px; display: flex; flex-direction: column; gap: 1px; }
  /* ── CHECKBOX ROWS ── */
  .check-row {
    display: flex; align-items: center; justify-content: space-between; gap: 9px;
    padding: 8px 8px; border-radius: var(--radius-md); cursor: pointer; transition: background .15s;
    font-size: 13.5px; color: var(--color-foreground);
  }
  .check-row:hover { background: var(--color-secondary); }
  .check-row-left { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .check-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .check-row-count { font-size: 11.5px; color: var(--color-muted-foreground); flex-shrink: 0; }
  .checkbox-box {
    width: 17px; height: 17px; border-radius: 4px; border: 1.5px solid var(--color-input);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    background: var(--color-background); transition: background .15s, border-color .15s; color: var(--color-primary-foreground);
  }
  .checkbox-box.checked { background: var(--color-primary); border-color: var(--color-primary); }
  .sidebar-brand-logo {
    width: 24px; height: 24px; border-radius: 6px; background: var(--color-background); border: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; flex-shrink: 0;
  }
  .sidebar-brand-initials { font-size: 8.5px; font-weight: 700; color: var(--color-muted-foreground); }
  .facet-chip-row { display: flex; flex-wrap: wrap; gap: 7px; padding: 4px 2px 12px; }
  .facet-chip {
    padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 500;
    border: 1.5px solid var(--color-border); color: var(--color-foreground); cursor: pointer; transition: all .15s; background: var(--color-background);
  }
  .facet-chip:hover { border-color: var(--color-ring); }
  .facet-chip:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .facet-chip.checked { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-primary-foreground); }
  .color-swatch-row { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 2px 14px; }
  .color-swatch {
    width: 28px; height: 28px; border-radius: 50%; cursor: pointer; position: relative;
    border: 1.5px solid var(--color-border); display: flex; align-items: center; justify-content: center;
    transition: transform .1s, border-color .15s;
  }
  .color-swatch:hover { transform: scale(1.08); }
  .color-swatch:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .color-swatch.checked { border-color: var(--color-foreground); box-shadow: 0 0 0 2px var(--color-background), 0 0 0 3px var(--color-foreground); }
  .color-swatch-check { color: var(--color-primary-foreground); mix-blend-mode: difference; filter: invert(1) grayscale(1) contrast(9); }
  /* ── PRICE RANGE ── */
  .price-range-wrap { padding: 6px 4px 14px; }
  .price-range-values {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    font-size: 13px; font-weight: 600; color: var(--color-foreground);
  }
  .price-slider-track { position: relative; height: 4px; background: var(--color-border); border-radius: 999px; margin: 18px 4px 6px; }
  .price-slider-range { position: absolute; height: 4px; background: var(--color-primary); border-radius: 999px; }
  .price-slider-input {
    position: absolute; top: -8px; left: 0; width: 100%; height: 20px; margin: 0;
    background: transparent; appearance: none; pointer-events: none;
  }
  .price-slider-input::-webkit-slider-thumb {
    appearance: none; pointer-events: auto; width: 18px; height: 18px; border-radius: 50%;
    background: var(--color-primary); border: 2px solid var(--color-card); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
  }
  .price-slider-input::-moz-range-thumb {
    pointer-events: auto; width: 18px; height: 18px; border-radius: 50%;
    background: var(--color-primary); border: 2px solid var(--color-card); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
  }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .shimmer-row {
    height: 30px; border-radius: var(--radius-md); margin-bottom: 4px;
    background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-border) 50%, var(--color-secondary) 75%);
    background-size: 800px 100%; animation: shimmer 1.5s infinite;
  }
  .sidebar-toggle-btn {
    display: none; align-items: center; gap: 6px; padding: 8px 14px; background: var(--color-background);
    border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: var(--font-body);
    font-size: 13px; font-weight: 500; color: var(--color-foreground); cursor: pointer; flex-shrink: 0;
  }
  .sidebar-backdrop { display: none; }
  /* ── TOP BAR ── */
  .cat-topbar {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 18px 28px; flex-wrap: wrap;
  }
  .cat-topbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cat-heading { margin: 0; font-family: var(--font-heading); font-size: 25px; font-weight: 700; color: var(--color-foreground); letter-spacing: -0.02em; line-height: 1; }
  .cat-count { font-size: 13px; color: var(--color-muted-foreground); font-weight: 400; }
  /* ── FILTER PILLS ── */
  .filter-pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 6px 6px 6px 14px;
    background: var(--color-background); color: var(--color-foreground); border: 1.5px solid var(--color-primary);
    border-radius: 999px; font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
  }
  .filter-pill-remove {
    display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;
    background: var(--color-primary); border-radius: 50%; border: none; cursor: pointer;
    color: var(--color-primary-foreground); padding: 0; transition: background .15s, opacity .15s;
  }
  .filter-pill-remove:hover { opacity: 0.8; }
  .clear-all-link {
    font-size: 12.5px; font-weight: 600; color: var(--color-muted-foreground); background: none; border: none;
    cursor: pointer; text-decoration: underline; padding: 4px 2px;
  }
  .clear-all-link:hover { color: var(--color-foreground); }
  /* ── SORT CONTROL ── */
  .cat-topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .sort-wrap {
    position: relative; display: flex; align-items: center; gap: 8px; background: var(--color-background);
    border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 0 14px; height: 42px; cursor: pointer;
  }
  .sort-wrap:hover { border-color: var(--color-ring); }
  .sort-icon { color: var(--color-muted-foreground); display: flex; flex-shrink: 0; }
  .sort-label { font-size: 13px; color: var(--color-muted-foreground); white-space: nowrap; font-weight: 400; }
  .sort-current { font-size: 13.5px; font-weight: 700; color: var(--color-foreground); white-space: nowrap; }
  .sort-select {
    position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
    border: none; appearance: none; padding:10px
  }
  .sort-caret { color: var(--color-muted-foreground); display: flex; flex-shrink: 0; }
  .products-area { padding: 0 28px 40px; }
  .spinner {
    width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-foreground);
    border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .products-load-more {
    display: flex; align-items: center; justify-content: center; gap: 10px; padding: 32px 0;
    color: var(--color-muted-foreground); font-size: 13.5px; font-family: var(--font-body);
  }
  .full-page-loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--color-background); }
  .grid-loading { display: flex; align-items: center; justify-content: center; padding: 100px 0; }
  /* ── CATEGORY ROW (direct click filters the whole category; chevron
       expands/collapses an INLINE list of that category's sub-categories
       right below it, in the sidebar itself — no popover/flyout. Multiple
       categories can be expanded at the same time, and sub-category
       checkboxes across DIFFERENT top-level categories can all be checked
       together — e.g. Apparel & Uniforms > T-Shirt + Business Cards >
       Standard — combining into one comma-separated category_id.) ── */
  .cat-row {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    border-radius: var(--radius-md); transition: background .15s;
  }
  .cat-row:hover { background: var(--color-secondary); }
  .cat-row-main {
    flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 4px 10px 12px; cursor: pointer; background: none; border: none; text-align: left;
    font-size: 13.5px; color: var(--color-foreground); font-family: var(--font-body);
  }
  .cat-row-main:focus-visible { outline: 2px solid var(--color-ring); outline-offset: -2px; border-radius: var(--radius-sm); }
  .cat-row.active .cat-row-main { color: var(--color-foreground); font-weight: 700; }
  .cat-row-expand {
    display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex-shrink: 0;
    background: none; border: none; cursor: pointer; color: var(--color-muted-foreground); border-radius: var(--radius-sm); margin-right: 6px;
  }
  .cat-row-expand:hover { background: var(--color-border); color: var(--color-foreground); }
  .cat-row-expand:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  /* Inline sub-category list shown directly beneath an expanded category
     row, indented so it reads as a child of that row. */
  .cat-subrow-list {
    display: flex; flex-direction: column; gap: 1px; padding: 2px 0 6px 14px;
    border-left: 2px solid var(--color-border); margin-left: 15px;
  }
  .btn-ghost {
    padding: 9px 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-background);
    font-size: 13px; font-weight: 600; color: var(--color-foreground); cursor: pointer;
  }
  .btn-ghost:hover { background: var(--color-secondary); }
  .btn-dark {
    padding: 9px 20px; border-radius: var(--radius-md); border: none; background: var(--color-primary);
    font-size: 13px; font-weight: 700; color: var(--color-primary-foreground); cursor: pointer;
  }
  .btn-dark:hover { filter: brightness(0.94); }
  @media (max-width: 768px) {
    .cat-shell { display: block; }
    .cat-sidebar {
      position: fixed; top: 0; left: 0; height: 100vh; width: 88%; max-width: 340px; z-index: 300;
      transform: translateX(-100%); transition: transform .22s ease; box-shadow: 12px 0 30px rgba(0,0,0,0.10);
    }
    .cat-sidebar.open { transform: translateX(0); }
    .sidebar-close-btn { display: inline-flex; }
    .sidebar-toggle-btn { display: inline-flex; }
    .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 290; }
    .cat-topbar { padding: 14px 16px; flex-direction: column; align-items: flex-start; gap: 12px; }
    .cat-topbar-left { width: 100%; }
    .cat-topbar-right { width: 100%; flex-wrap: wrap; gap: 8px; }
    .sort-wrap { flex: 1; min-width: 120px; }
    .cat-heading { font-size: 20px; }
    .products-area { padding: 0 16px 32px; }
  }
`;
// ─────────────────────────────────────────────────────────────────────────────
// Small reusable pieces
// ─────────────────────────────────────────────────────────────────────────────
function CheckRow({
    checked,
    label,
    count,
    onToggle,
}: {
    checked: boolean;
    label: string;
    count?: number;
    onToggle: () => void;
}) {
    return (
        <div
            className="check-row"
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle();
                }
            }}
        >
            <span className="check-row-left">
                <span className={`checkbox-box ${checked ? "checked" : ""}`}>
                    {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="check-row-name">{label}</span>
            </span>
            {count != null && <span className="check-row-count">{count}</span>}
        </div>
    );
}
function FacetSection({
    title,
    count,
    open,
    onToggle,
    onClear,
    children,
}: {
    title: string;
    count?: number;
    open: boolean;
    onToggle: () => void;
    onClear?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="facet-section">
            <button
                type="button"
                className="facet-header"
                onClick={onToggle}
                aria-expanded={open}
            >
                <span className="facet-header-left">
                    <span className="facet-title">{title}</span>
                    {!!count && <span className="facet-count-badge">{count}</span>}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!!count && onClear && (
                        <span
                            className="clear-all-link"
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                        >
                            Clear
                        </span>
                    )}
                    <ChevronDown size={16} className={`facet-chevron ${open ? "open" : ""}`} />
                </span>
            </button>
            {open && <div className="facet-body">{children}</div>}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CategoriesView({
    initialCategoryId,
    initialParentId,
    initialBrandId,
}: CategoriesViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSearch = searchParams.get("search")?.trim() ?? "";
    const urlSearchRef = useRef(urlSearch);
    useEffect(() => { urlSearchRef.current = urlSearch; }, [urlSearch]);
    // ── Sort options — merge in the local fallbacks (newest/name_asc/
    // name_desc) alongside whatever @/data/products already provides,
    // without producing duplicate entries in the dropdown. ───────────────
    const allSortOptions = sortOptions;
    // ── Products ──────────────────────────────────────────────────────────
    const [products, setProducts] = useState<any[]>([]);
    const [total_products, setTotalProducts] = useState(0);
    const [productLoading, setProductLoading] = useState(false);
    const [productGridLoading, setProductGridLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    // ── Grand categories (single active tab, drives which sub-categories show) ──
    const [categories, setCategories] = useState<GrandCategory[]>([]);
    const [activeCategory, setActiveCategory] = useState<GrandCategory>({ id: null, name: "All" });
    // ── Which top-level category rows are expanded in the sidebar tree.
    // Several can be open at once (e.g. Apparel & Uniforms AND Business
    // Cards both expanded together), each revealing its own inline
    // sub-category checkbox list. ─────────────────────────────────────────
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
    // ── MULTI-SELECT facets (checkboxes) ─────────────────────────────────
    // activeParents now holds checked sub-categories from potentially many
    // DIFFERENT top-level categories at once (each entry remembers its own
    // grandId/grandName), e.g.:
    //   [{ id: 501, title: "T-Shirt", grandId: 10, grandName: "Apparel & Uniforms" },
    //    { id: 812, title: "Standard", grandId: 40, grandName: "Business Cards" }]
    const [activeParents, setActiveParents] = useState<SelectedSubCategory[]>([]);
    const [activeBrands, setActiveBrands] = useState<Brand[]>([]);            // brands, multi
    const [activeSizes, setActiveSizes] = useState<string[]>([]);             // sizes, multi
    const [activeColors, setActiveColors] = useState<string[]>([]);           // colors, multi
    const [activeGenders, setActiveGenders] = useState<string[]>([]);         // gender, multi
    const [activeFabrics, setActiveFabrics] = useState<string[]>([]);         // fabric, multi
    const [inStockOnly, setInStockOnly] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // ── Accordion open/closed state per sidebar section ──────────────────
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        category: true,
        brand: false,
        price: false,
        size: false,
        color: false,
        gender: false,
        fabric: false,
        stock: false,
    });
    const toggleSection = (key: string) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    // ── Brands ────────────────────────────────────────────────────────────
    const [brandList, setBrandList] = useState<Brand[]>([]);
    const [brandLoading, setBrandLoading] = useState(false);
    // ── Sort ──────────────────────────────────────────────────────────────
    // Blank by default — no sort applied until the user actually picks one.
    const [sortBy, setSortBy] = useState<SortOption["value"]>("" as SortOption["value"]);
    const hasUrlFilterParam = !!initialCategoryId || !!initialBrandId;
    const [urlRestoreAttempted, setUrlRestoreAttempted] = useState(!hasUrlFilterParam);
    // ── Refs (mirror state for use inside stable callbacks) ──────────────
    const fetchingRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const activeCategoryRef = useRef<GrandCategory>(activeCategory);
    const activeParentsRef = useRef<SelectedSubCategory[]>([]);
    const activeBrandsRef = useRef<Brand[]>([]);
    const activeSizesRef = useRef<string[]>([]);
    const activeColorsRef = useRef<string[]>([]);
    const activeGendersRef = useRef<string[]>([]);
    const activeFabricsRef = useRef<string[]>([]);
    const inStockOnlyRef = useRef(false);
    const priceRangeRef = useRef<[number, number]>([PRICE_MIN, PRICE_MAX]);
    const sortByRef = useRef<SortOption["value"]>(sortBy);
    const fetchIdRef = useRef(0);
    useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
    useEffect(() => { activeParentsRef.current = activeParents; }, [activeParents]);
    useEffect(() => { activeBrandsRef.current = activeBrands; }, [activeBrands]);
    useEffect(() => { activeSizesRef.current = activeSizes; }, [activeSizes]);
    useEffect(() => { activeColorsRef.current = activeColors; }, [activeColors]);
    useEffect(() => { activeGendersRef.current = activeGenders; }, [activeGenders]);
    useEffect(() => { activeFabricsRef.current = activeFabrics; }, [activeFabrics]);
    useEffect(() => { inStockOnlyRef.current = inStockOnly; }, [inStockOnly]);
    useEffect(() => { priceRangeRef.current = priceRange; }, [priceRange]);
    useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);
    // Debounce the fetch triggered by the price slider so we don't fire a
    // request on every pixel of drag — only once the user pauses.
    const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // ─────────────────────────────────────────────────────────────────────
    // Restore selection from the route on deep-link/refresh. Path params are
    // comma-separated ids (category_id and brand_id can each carry multiple).
    // Also restores size/color/in_stock/sort/price/gender/fabric AND the
    // cross-category sub-category checkboxes (query param `category_id`)
    // from the query string so a shared or refreshed link reproduces the
    // exact same filtered view — including combinations like
    // Apparel & Uniforms > T-Shirt + Business Cards > Standard checked
    // together. ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!categories.length) return;
        if (initialBrandId && brandList.length) {
            const ids = initialBrandId.split(",").map((s) => s.trim());
            const matched = brandList.filter((b) => ids.includes(String(b.id)));
            if (matched.length) {
                setActiveBrands(matched);
                activeBrandsRef.current = matched;
            }
        }
        if (initialCategoryId) {
            const cat = categories.find((c) => String(c.id) === String(initialCategoryId));
            if (cat) {
                setActiveCategory(cat);
                activeCategoryRef.current = cat;
            }
        }
        // Cross-category sub-category checkboxes, restored from the
        // `category_id` query param. Ids are matched against every
        // top-level category's parent_categories (not just one), since a
        // link can encode selections spanning several different top-level
        // categories at once.
        const qCategoryIds = searchParams.get("category_id");
        if (qCategoryIds) {
            const ids = new Set(qCategoryIds.split(",").map((s) => s.trim()));
            const matched: SelectedSubCategory[] = [];
            const expanded = new Set<number>();
            categories.forEach((cat) => {
                (cat.parent_categories ?? []).forEach((p) => {
                    if (ids.has(String(p.id)) && cat.id != null) {
                        matched.push({ ...p, grandId: cat.id, grandName: cat.name });
                        expanded.add(cat.id);
                    }
                });
            });
            if (matched.length) {
                setActiveParents(matched);
                activeParentsRef.current = matched;
                setExpandedCategoryIds(expanded);
            }
        } else if (initialParentId && initialCategoryId) {
            // Legacy path-based deep link: /categories/:catId/:slug/:parentId/:slug
            const cat = categories.find((c) => String(c.id) === String(initialCategoryId));
            if (cat) {
                const parentIds = initialParentId.split(",").map((s) => s.trim());
                const parents = (cat.parent_categories ?? []).filter((p) =>
                    parentIds.includes(String(p.id))
                );
                if (parents.length && cat.id != null) {
                    const matched = parents.map((p) => ({ ...p, grandId: cat.id as number, grandName: cat.name }));
                    setActiveParents(matched);
                    activeParentsRef.current = matched;
                    setExpandedCategoryIds(new Set([cat.id]));
                }
            }
        }
        const qSize = searchParams.get("size");
        if (qSize) {
            const sizes = qSize.split(",").filter((s) => SIZE_OPTIONS.includes(s));
            if (sizes.length) setActiveSizes(sizes);
        }
        const qColor = searchParams.get("color");
        if (qColor) {
            const names = COLOR_OPTIONS.map((c) => c.name);
            const colors = qColor.split(",").filter((c) => names.includes(c));
            if (colors.length) setActiveColors(colors);
        }
        const qGender = searchParams.get("gender");
        if (qGender) {
            const genders = qGender.split(",").map((g) => g.trim().toUpperCase()).filter((g) => GENDER_OPTIONS.includes(g));
            if (genders.length) setActiveGenders(genders);
        }
        const qFabric = searchParams.get("fabric");
        if (qFabric) {
            const fabrics = qFabric.split(",").map((f) => f.trim().toUpperCase()).filter((f) => FABRIC_OPTIONS.includes(f));
            if (fabrics.length) setActiveFabrics(fabrics);
        }
        const qStock = searchParams.get("in_stock");
        if (qStock === "true") setInStockOnly(true);
        const qSort = searchParams.get("sort");
        if (qSort && allSortOptions.some((o) => o.value === qSort)) {
            setSortBy(qSort as SortOption["value"]);
        }
        const qMin = searchParams.get("min_price");
        const qMax = searchParams.get("max_price");
        if (qMin || qMax) {
            const min = qMin ? Math.max(PRICE_MIN, Number(qMin)) : PRICE_MIN;
            const max = qMax ? Math.min(PRICE_MAX, Number(qMax)) : PRICE_MAX;
            if (!Number.isNaN(min) && !Number.isNaN(max) && min < max) {
                setPriceRange([min, max]);
            }
        }
        setUrlRestoreAttempted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, brandList, initialCategoryId, initialParentId, initialBrandId]);
    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────
    /** Mirrors non-navigational facets (category sub-checkboxes, size, color,
     * gender, fabric, stock, sort, price) into the query string so
     * refresh/share preserves them. Whole-category clicks keep using
     * path-based routing (handleCategoryTabSelect), untouched. */
    const syncQueryString = useCallback(
        (next: {
            categoryIds?: string[];
            sizes?: string[];
            colors?: string[];
            genders?: string[];
            fabrics?: string[];
            inStock?: boolean;
            sort?: SortOption["value"];
            priceRange?: [number, number];
        }) => {
            if (typeof window === "undefined") return;
            const url = new URL(window.location.href);
            const sp = url.searchParams;
            const categoryIds = next.categoryIds ?? activeParentsRef.current.map((p) => String(p.id));
            const sizes = next.sizes ?? activeSizesRef.current;
            const colors = next.colors ?? activeColorsRef.current;
            const genders = next.genders ?? activeGendersRef.current;
            const fabrics = next.fabrics ?? activeFabricsRef.current;
            const inStock = next.inStock ?? inStockOnlyRef.current;
            const sort = next.sort ?? sortByRef.current;
            const [min, max] = next.priceRange ?? priceRangeRef.current;
            categoryIds.length ? sp.set("category_id", categoryIds.join(",")) : sp.delete("category_id");
            sizes.length ? sp.set("size", sizes.join(",")) : sp.delete("size");
            colors.length ? sp.set("color", colors.join(",")) : sp.delete("color");
            genders.length ? sp.set("gender", genders.join(",")) : sp.delete("gender");
            fabrics.length ? sp.set("fabric", fabrics.join(",")) : sp.delete("fabric");
            inStock ? sp.set("in_stock", "true") : sp.delete("in_stock");
            sort ? sp.set("sort", sort) : sp.delete("sort");
            min > PRICE_MIN ? sp.set("min_price", String(min)) : sp.delete("min_price");
            max < PRICE_MAX ? sp.set("max_price", String(max)) : sp.delete("max_price");
            router.replace(`${url.pathname}?${sp.toString()}`.replace(/\?$/, ""), { scroll: false });
        },
        [router]
    );
    // ─────────────────────────────────────────────────────────────────────
    // BRANDS / CATEGORIES — initial loads
    // ─────────────────────────────────────────────────────────────────────
    const fetchBrands = useCallback(async () => {
        try {
            setBrandLoading(true);
            const res = await GetAllBrandsApi(1, 1000);
            const raw: any[] = Array.isArray(res?.data?.data?.data)
                ? res.data.data.data
                : Array.isArray(res?.data?.data)
                    ? res.data.data
                    : [];
            const formatted: Brand[] = raw.map((b: any) => ({
                id: b?.id,
                name: b?.name ?? b?.brand_name ?? "",
                slug: b?.slug ?? "",
                logo: b?.logo_url ?? null,
                count: b?.product_count ?? b?.count ?? undefined,
            }));
            setBrandList(formatted);
        } catch (err) {
            console.error("Error fetching brands:", err);
        } finally {
            setBrandLoading(false);
        }
    }, []);
    const fetchCategories = useCallback(async () => {
        try {
            const res: ProductCategoryApiResponse = await ProductCategoryApi({ page: 1, limit: CATEGORY_LIMIT });
            const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
            const formatted: GrandCategory[] = raw.map((cat: any) => ({
                id: cat.id,
                name: cat.title ?? cat.name ?? cat.category_name ?? "",
                slug: cat.slug ?? "",
                count: cat.product_count ?? cat.count ?? undefined,
                parent_categories: Array.isArray(cat.parent_categories)
                    ? cat.parent_categories.map((p: any) => ({
                        id: p.id,
                        title: p.title ?? p.name ?? "",
                        slug: p.slug ?? "",
                        count: p.product_count ?? p.count ?? undefined,
                    }))
                    : [],
            }));
            setCategories([{ id: null, name: "All", parent_categories: [] }, ...formatted]);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    }, []);
    // ─────────────────────────────────────────────────────────────────────
    // PRODUCTS — single unified fetch, all facets go through AllProductsApi
    // ─────────────────────────────────────────────────────────────────────
    const fetchProducts = useCallback(
        async (
            pageNumber: number,
            isLoadMore: boolean,
            filters: {
                category: GrandCategory;
                parents: SelectedSubCategory[];
                brands: Brand[];
                sizes: string[];
                colors: string[];
                inStock: boolean;
                priceRange: [number, number];
                genders: string[];
                fabrics: string[];
                sort: SortOption["value"];
                search: string;
            }
        ) => {
            const thisFetchId = ++fetchIdRef.current;
            try {
                setProductLoading(true);
                const params = buildFilterParams({
                    page: pageNumber,
                    limit: LOAD_MORE_LIMIT,
                    ...filters,
                });
                const res: ProductApiResponse = await AllProductsApi(params);
                if (thisFetchId !== fetchIdRef.current) return; // stale response, discard
                const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
                setProducts((prev) =>
                    isLoadMore ? [...prev, ...raw] : raw
                );
                setTotalProducts(res?.data?.data?.pagination?.total ?? 0);
                const more = raw.length === LOAD_MORE_LIMIT;
                setHasMore(more);
                hasMoreRef.current = more;
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                if (thisFetchId === fetchIdRef.current) {
                    setProductLoading(false);
                    setProductGridLoading(false);
                    setInitialLoading(false);
                }
            }
        },
        []
    );
    // ── Initial load (brands + categories), fires once per mount ─────────
    const initialDataFetchedRef = useRef(false);
    useEffect(() => {
        if (initialDataFetchedRef.current) return;
        initialDataFetchedRef.current = true;
        Promise.all([fetchBrands(), fetchCategories()]);
    }, [fetchBrands, fetchCategories]);
    // ── Fetch products whenever any facet / sort / search changes ────────
    useEffect(() => {
        if (!categories.length) return;
        if (!urlRestoreAttempted) return;
        setProductGridLoading(true);
        pageRef.current = 1;
        setPage(1);
        fetchProducts(1, false, {
            category: activeCategory,
            parents: activeParents,
            brands: activeBrands,
            sizes: activeSizes,
            colors: activeColors,
            inStock: inStockOnly,
            priceRange,
            genders: activeGenders,
            fabrics: activeFabrics,
            sort: sortBy,
            search: urlSearch,
        });
    }, [
        categories.length,
        activeCategory,
        activeParents,
        activeBrands,
        activeSizes,
        activeColors,
        activeGenders,
        activeFabrics,
        inStockOnly,
        priceRange,
        sortBy,
        fetchProducts,
        urlRestoreAttempted,
        urlSearch,
    ]);
    // ── Infinite scroll ────────────────────────────────────────────────
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
                await fetchProducts(nextPage, true, {
                    category: activeCategoryRef.current,
                    parents: activeParentsRef.current,
                    brands: activeBrandsRef.current,
                    sizes: activeSizesRef.current,
                    colors: activeColorsRef.current,
                    inStock: inStockOnlyRef.current,
                    priceRange: priceRangeRef.current,
                    genders: activeGendersRef.current,
                    fabrics: activeFabricsRef.current,
                    sort: sortByRef.current,
                    search: urlSearchRef.current,
                });
                fetchingRef.current = false;
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [fetchProducts, productLoading]);
    // ── Close mobile sidebar on Escape ────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (sidebarOpen) setSidebarOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [sidebarOpen]);
    // ─────────────────────────────────────────────────────────────────────
    // Selection handlers
    // ─────────────────────────────────────────────────────────────────────
    const withSearchParam = (path: string) => {
        if (!urlSearch) return path;
        const sep = path.includes("?") ? "&" : "?";
        return `${path}${sep}search=${encodeURIComponent(urlSearch)}`;
    };
    // Grand category — clicking the NAME filters immediately to that whole
    // category (does NOT open/close anything) and clears any sub-category
    // checkboxes (across every category), since a whole-category filter
    // supersedes fine-grained sub-category picks. Does NOT clear
    // brand/size/color/etc facets (independent filters).
    const handleCategoryTabSelect = (cat: GrandCategory) => {
        setActiveCategory(cat);
        activeCategoryRef.current = cat;
        setActiveParents([]);
        activeParentsRef.current = [];
        persistSelection(cat.id != null ? "category" : null, cat.id, { name: cat.name });
        if (cat.id == null) {
            router.push(withSearchParam("/categories"), { scroll: false });
        } else {
            const slug = cat.slug || slugify(cat.name);
            router.push(withSearchParam(`/categories/${cat.id}/${slug}`), { scroll: false });
        }
        setSidebarOpen(false);
    };
    // Chevron click — expands/collapses the inline sub-category checkbox
    // list for that one category, in place, in the sidebar. Independent
    // per category, so several can be expanded together.
    const toggleCategoryExpand = (catId: number) => {
        setExpandedCategoryIds((prev) => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId); else next.add(catId);
            return next;
        });
    };
    // Sub-category checkbox — applies immediately (no Apply/Cancel step),
    // exactly like brand/size/color. Selections from DIFFERENT top-level
    // categories can coexist, e.g. checking "T-Shirt" under Apparel &
    // Uniforms and "Standard" under Business Cards at the same time sends
    // category_id=<tshirt_id>,<standard_id> together.
    const toggleSubCategory = (cat: GrandCategory, parent: ParentCategory) => {
        if (cat.id == null) return;
        setActiveParents((prev) => {
            const exists = prev.some((p) => p.grandId === cat.id && p.id === parent.id);
            const next = exists
                ? prev.filter((p) => !(p.grandId === cat.id && p.id === parent.id))
                : [...prev, { ...parent, grandId: cat.id as number, grandName: cat.name }];
            activeParentsRef.current = next;
            persistSelection(next.length ? "category" : null, next.length ? next.map((p) => p.id).join(",") : null, {
                parentIds: next.map((p) => p.id),
            });
            syncQueryString({ categoryIds: next.map((p) => String(p.id)) });
            return next;
        });
    };
    // ── Brand checkbox toggle (multi-select, applies immediately) ────────
    const toggleBrand = (brand: Brand) => {
        setActiveBrands((prev) => {
            const exists = prev.some((b) => String(b.id) === String(brand.id));
            const next = exists ? prev.filter((b) => String(b.id) !== String(brand.id)) : [...prev, brand];
            activeBrandsRef.current = next;
            persistSelection(next.length ? "brand" : null, next.length ? next.map((b) => b.id).join(",") : null, {
                names: next.map((b) => b.name),
            });
            return next;
        });
    };
    // ── Size / color / gender / fabric toggles (multi-select, applies
    // immediately, synced into the query string so the link stays shareable) ─
    const toggleSize = (size: string) => {
        setActiveSizes((prev) => {
            const next = prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size];
            syncQueryString({ sizes: next });
            return next;
        });
    };
    const toggleColor = (color: string) => {
        setActiveColors((prev) => {
            const next = prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color];
            syncQueryString({ colors: next });
            return next;
        });
    };
    const toggleGender = (gender: string) => {
        setActiveGenders((prev) => {
            const next = prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender];
            syncQueryString({ genders: next });
            return next;
        });
    };
    const toggleFabric = (fabric: string) => {
        setActiveFabrics((prev) => {
            const next = prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric];
            syncQueryString({ fabrics: next });
            return next;
        });
    };
    const toggleInStock = () => {
        setInStockOnly((prev) => {
            const next = !prev;
            syncQueryString({ inStock: next });
            return next;
        });
    };
    const handleSortChange = (value: SortOption["value"]) => {
        setSortBy(value);
        syncQueryString({ sort: value });
    };
    // ── Price range slider (dual-thumb, debounced sync) ───────────────────
    const commitPriceRange = (next: [number, number]) => {
        setPriceRange(next);
        if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
        priceDebounceRef.current = setTimeout(() => syncQueryString({ priceRange: next }), 350);
    };
    const handleMinPriceChange = (value: number) => {
        const clamped = Math.min(value, priceRange[1] - PRICE_STEP);
        commitPriceRange([Math.max(PRICE_MIN, clamped), priceRange[1]]);
    };
    const handleMaxPriceChange = (value: number) => {
        const clamped = Math.max(value, priceRange[0] + PRICE_STEP);
        commitPriceRange([priceRange[0], Math.min(PRICE_MAX, clamped)]);
    };
    const handleClearFilter = () => {
        const all: GrandCategory = { id: null, name: "All", parent_categories: [] };
        setActiveCategory(all);
        activeCategoryRef.current = all;
        setActiveParents([]);
        activeParentsRef.current = [];
        setExpandedCategoryIds(new Set());
        setActiveBrands([]);
        activeBrandsRef.current = [];
        setActiveSizes([]);
        setActiveColors([]);
        setActiveGenders([]);
        setActiveFabrics([]);
        setInStockOnly(false);
        setPriceRange([PRICE_MIN, PRICE_MAX]);
        setSortBy("" as SortOption["value"]);
        persistSelection(null, null);
        router.push("/categories", { scroll: false });
    };
    // ─────────────────────────────────────────────────────────────────────
    // Heading / pills — one removable pill per active facet, including one
    // pill per checked sub-category regardless of which top-level category
    // it belongs to.
    // ─────────────────────────────────────────────────────────────────────
    const headingLabel = urlSearch
        ? `Results for "${urlSearch}"`
        : activeParents.length
            ? activeParents.map((p) => p.title).join(", ")
            : activeCategory.name;
    type Pill = { key: string; label: string; onRemove: () => void };
    const pills: Pill[] = [];
    if (urlSearch) {
        pills.push({ key: "search", label: `"${urlSearch}"`, onRemove: () => router.push("/categories", { scroll: false }) });
    }
    if (activeCategory.id !== null && !activeParents.length) {
        pills.push({ key: "cat", label: activeCategory.name, onRemove: () => handleCategoryTabSelect({ id: null, name: "All", parent_categories: [] }) });
    }
    activeParents.forEach((p) => {
        pills.push({
            key: `parent-${p.grandId}-${p.id}`,
            label: p.title,
            onRemove: () => {
                const next = activeParents.filter((x) => !(x.grandId === p.grandId && x.id === p.id));
                setActiveParents(next);
                activeParentsRef.current = next;
                syncQueryString({ categoryIds: next.map((x) => String(x.id)) });
            },
        });
    });
    activeBrands.forEach((b) => {
        pills.push({ key: `brand-${b.id}`, label: b.name, onRemove: () => toggleBrand(b) });
    });
    activeSizes.forEach((s) => pills.push({ key: `size-${s}`, label: `Size: ${s}`, onRemove: () => toggleSize(s) }));
    activeColors.forEach((c) => pills.push({ key: `color-${c}`, label: c, onRemove: () => toggleColor(c) }));
    activeGenders.forEach((g) => pills.push({ key: `gender-${g}`, label: g, onRemove: () => toggleGender(g) }));
    activeFabrics.forEach((f) => pills.push({ key: `fabric-${f}`, label: f, onRemove: () => toggleFabric(f) }));
    if (inStockOnly) pills.push({ key: "instock", label: "In stock", onRemove: toggleInStock });
    if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) {
        pills.push({
            key: "price",
            label: `$${priceRange[0]}–$${priceRange[1]}`,
            onRemove: () => commitPriceRange([PRICE_MIN, PRICE_MAX]),
        });
    }
    const totalFacetCount =
        (activeCategory.id !== null ? 1 : 0) +
        activeParents.length +
        activeBrands.length +
        activeSizes.length +
        activeColors.length +
        activeGenders.length +
        activeFabrics.length +
        (inStockOnly ? 1 : 0) +
        (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0);
    const otherCategoryTabs = categories.filter((c) => c.id !== null);
    const isAllActive = activeCategory.id === null && !activeParents.length;
    const currentSortLabel = allSortOptions.find((o) => o.value === sortBy)?.label ?? "Popularity";
    const priceMinPct = useMemo(() => ((priceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100, [priceRange]);
    const priceMaxPct = useMemo(() => ((priceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100, [priceRange]);
    // ─────────────────────────────────────────────────────────────────────
    if (initialLoading) {
        return (
            <div className="full-page-loader">
                <style>{styles}</style>
                <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
        );
    }
    return (
        <div className="cat-root">
            <style>{styles}</style>
            <div className="cat-shell">
                {/* ── SIDEBAR ── */}
                <aside className={`cat-sidebar ${sidebarOpen ? "open" : ""}`}>
                    <div className="sidebar-top-row">
                        <span className="sidebar-title">Filters</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button className="sidebar-reset-btn" onClick={handleClearFilter}>
                                <RotateCcw size={13} /> Reset
                            </button>
                            <button
                                className="sidebar-close-btn"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Close filters"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    {/* All */}
                    <div
                        className="check-row"
                        role="button"
                        tabIndex={0}
                        style={{
                            fontWeight: isAllActive ? 700 : 500,
                            color: isAllActive ? "var(--color-foreground)" : undefined,
                        }}
                        onClick={() => {
                            handleClearFilter();
                            handleCategoryTabSelect({
                                id: null,
                                name: "All",
                                parent_categories: [],
                            });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleClearFilter();
                                handleCategoryTabSelect({
                                    id: null,
                                    name: "All",
                                    parent_categories: [],
                                });
                            }
                        }}
                    >
                        <span className="check-row-left">
                            <span className="check-row-name">All Products</span>
                        </span>
                    </div>
                    {/* Category — clicking the NAME filters immediately to that
                        whole category. The chevron (only shown when sub-categories
                        exist) expands/collapses an INLINE checkbox list right
                        below that row, in place — no popover. Several categories
                        can be expanded at once, and checkboxes under DIFFERENT
                        categories can all be checked together (e.g. Apparel &
                        Uniforms > T-Shirt + Business Cards > Standard), combining
                        into one comma-separated category_id. */}
                    <FacetSection
                        title="Category"
                        count={activeParents.length || (activeCategory.id !== null ? 1 : 0)}
                        open={openSections.category}
                        onToggle={() => toggleSection("category")}
                        onClear={() => {
                            setActiveParents([]);
                            activeParentsRef.current = [];
                            syncQueryString({ categoryIds: [] });
                            handleCategoryTabSelect({ id: null, name: "All", parent_categories: [] });
                        }}
                    >
                        {otherCategoryTabs.map((cat) => {
                            const isTabActive =
                                activeCategory.id === cat.id ||
                                activeParents.some((p) => p.grandId === cat.id);
                            const hasChildren = !!cat.parent_categories?.length;
                            const isExpanded = cat.id != null && expandedCategoryIds.has(cat.id);
                            return (
                                <div key={cat.id}>
                                    <div className={`cat-row ${isTabActive ? "active" : ""}`}>
                                        <button
                                            type="button"
                                            className="cat-row-main"
                                        // onClick={() => handleCategoryTabSelect(cat)}
                                        >
                                            <span>{cat.name}</span>
                                            {!!cat.count && <span className="check-row-count">{cat.count}</span>}
                                        </button>
                                        {hasChildren && (
                                            <button
                                                type="button"
                                                className="cat-row-expand"
                                                onClick={() => cat.id != null && toggleCategoryExpand(cat.id)}
                                                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${cat.name} sub-categories`}
                                                aria-expanded={isExpanded}
                                                title="Browse sub-categories"
                                            >
                                                <ChevronDown size={14} className={`facet-chevron ${isExpanded ? "open" : ""}`} />
                                            </button>
                                        )}
                                    </div>
                                    {hasChildren && isExpanded && (
                                        <div className="cat-subrow-list">
                                            {(cat.parent_categories ?? []).map((p) => {
                                                const checked = activeParents.some(
                                                    (ap) => ap.grandId === cat.id && ap.id === p.id
                                                );
                                                return (
                                                    <CheckRow
                                                        key={p.id}
                                                        checked={checked}
                                                        label={p.title}
                                                        count={p.count}
                                                        onToggle={() => toggleSubCategory(cat, p)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </FacetSection>
                    {/* Brands — checkbox multi-select, sends brand_id=1,2,3 */}
                    <FacetSection
                        title="Brands"
                        count={activeBrands.length}
                        open={openSections.brand}
                        onToggle={() => toggleSection("brand")}
                        onClear={() => setActiveBrands([])}
                    >
                        <div style={{ maxHeight: 260, overflowY: "auto" }}>
                            {brandList.length === 0 && brandLoading
                                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer-row" />)
                                : brandList.map((brand) => {
                                    const checked = activeBrands.some((b) => String(b.id) === String(brand.id));
                                    return (
                                        <CheckRow
                                            key={brand.id}
                                            checked={checked}
                                            label={brand.name}
                                            count={brand.count}
                                            onToggle={() => toggleBrand(brand)}
                                        />
                                    );
                                })}
                        </div>
                    </FacetSection>
                    {/* Price — dual-handle range slider, sends min_price/max_price */}
                    <FacetSection
                        title="Price"
                        count={priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0}
                        open={openSections.price}
                        onToggle={() => toggleSection("price")}
                        onClear={() => commitPriceRange([PRICE_MIN, PRICE_MAX])}
                    >
                        <div className="price-range-wrap">
                            <div className="price-range-values">
                                <span>${priceRange[0]}</span>
                                <span>${priceRange[1]}{priceRange[1] === PRICE_MAX ? "+" : ""}</span>
                            </div>
                            <div className="price-slider-track">
                                <div
                                    className="price-slider-range"
                                    style={{ left: `${priceMinPct}%`, right: `${100 - priceMaxPct}%` }}
                                />
                                <input
                                    type="range"
                                    className="price-slider-input"
                                    min={PRICE_MIN}
                                    max={PRICE_MAX}
                                    step={PRICE_STEP}
                                    value={priceRange[0]}
                                    onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                                    aria-label="Minimum price"
                                />
                                <input
                                    type="range"
                                    className="price-slider-input"
                                    min={PRICE_MIN}
                                    max={PRICE_MAX}
                                    step={PRICE_STEP}
                                    value={priceRange[1]}
                                    onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                                    aria-label="Maximum price"
                                />
                            </div>
                        </div>
                    </FacetSection>
                    {/* Size — chip multi-select, sends size=XL,L */}
                    <FacetSection
                        title="Size"
                        count={activeSizes.length}
                        open={openSections.size}
                        onToggle={() => toggleSection("size")}
                        onClear={() => { setActiveSizes([]); syncQueryString({ sizes: [] }); }}
                    >
                        <div className="facet-chip-row">
                            {SIZE_OPTIONS.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    className={`facet-chip ${activeSizes.includes(size) ? "checked" : ""}`}
                                    onClick={() => toggleSize(size)}
                                    aria-pressed={activeSizes.includes(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </FacetSection>
                    {/* Color — swatch multi-select, sends color=Black,Blue */}
                    <FacetSection
                        title="Color"
                        count={activeColors.length}
                        open={openSections.color}
                        onToggle={() => toggleSection("color")}
                        onClear={() => { setActiveColors([]); syncQueryString({ colors: [] }); }}
                    >
                        <div className="color-swatch-row">
                            {COLOR_OPTIONS.map(({ name, hex }) => {
                                const checked = activeColors.includes(name);
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        className={`color-swatch ${checked ? "checked" : ""}`}
                                        style={{ background: hex }}
                                        onClick={() => toggleColor(name)}
                                        aria-pressed={checked}
                                        aria-label={name}
                                        title={name}
                                    >
                                        {checked && <Check size={13} strokeWidth={3} className="color-swatch-check" />}
                                    </button>
                                );
                            })}
                        </div>
                    </FacetSection>
                    {/* Gender — chip multi-select, sends gender=MEN,UNISEX */}
                    <FacetSection
                        title="Gender"
                        count={activeGenders.length}
                        open={openSections.gender}
                        onToggle={() => toggleSection("gender")}
                        onClear={() => { setActiveGenders([]); syncQueryString({ genders: [] }); }}
                    >
                        <div className="facet-chip-row">
                            {GENDER_OPTIONS.map((gender) => (
                                <button
                                    key={gender}
                                    type="button"
                                    className={`facet-chip ${activeGenders.includes(gender) ? "checked" : ""}`}
                                    onClick={() => toggleGender(gender)}
                                    aria-pressed={activeGenders.includes(gender)}
                                >
                                    {gender.charAt(0) + gender.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </FacetSection>
                    {/* Fabric — chip multi-select, sends fabric=COTTON,POLYESTER */}
                    <FacetSection
                        title="Fabric"
                        count={activeFabrics.length}
                        open={openSections.fabric}
                        onToggle={() => toggleSection("fabric")}
                        onClear={() => { setActiveFabrics([]); syncQueryString({ fabrics: [] }); }}
                    >
                        <div className="facet-chip-row">
                            {FABRIC_OPTIONS.map((fabric) => (
                                <button
                                    key={fabric}
                                    type="button"
                                    className={`facet-chip ${activeFabrics.includes(fabric) ? "checked" : ""}`}
                                    onClick={() => toggleFabric(fabric)}
                                    aria-pressed={activeFabrics.includes(fabric)}
                                >
                                    {fabric.charAt(0) + fabric.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </FacetSection>
                    {/* Availability — single boolean checkbox, sends in_stock=true */}
                    <FacetSection
                        title="Availability"
                        count={inStockOnly ? 1 : 0}
                        open={openSections.stock}
                        onToggle={() => toggleSection("stock")}
                        onClear={() => { if (inStockOnly) toggleInStock(); }}
                    >
                        <CheckRow checked={inStockOnly} label="In stock only" onToggle={toggleInStock} />
                    </FacetSection>
                </aside>
                {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
                {/* ── MAIN ── */}
                <div className="cat-main">
                    <div className="cat-topbar">
                        <div className="cat-topbar-left">
                            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} aria-label="Open filters">
                                <ArrowUpDown size={14} /> Filters
                            </button>
                            <h1 className="cat-heading">{headingLabel}</h1>
                            <span className="cat-count">
                                {total_products.toLocaleString()} items
                                {productGridLoading && (
                                    <span className="spinner" style={{ width: 12, height: 12, marginLeft: 8, verticalAlign: "middle" }} />
                                )}
                            </span>
                            {pills.map((p) => (
                                <span key={p.key} className="filter-pill">
                                    {p.label}
                                    <button className="filter-pill-remove" onClick={p.onRemove} aria-label={`Remove ${p.label}`}>
                                        <X size={11} />
                                    </button>
                                </span>
                            ))}
                            {totalFacetCount > 0 && (
                                <button className="clear-all-link" onClick={handleClearFilter}>
                                    Clear all
                                </button>
                            )}
                        </div>
                        <div className="cat-topbar-right">
                            <div className="sort-wrap">
                                <span className="sort-icon"><ArrowUpDown size={14} /></span>
                                <span className="sort-label">Sort by</span>
                                <span className="sort-current">{currentSortLabel}</span>
                                <span className="sort-caret"><ChevronDown size={14} /></span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as SortOption["value"])}
                                    className="sort-select"
                                    aria-label="Sort products"
                                >
                                    <option value="">Popularity</option>
                                    {allSortOptions.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="products-area">
                        {products.length > 0 ? (
                            <>
                                <div style={{ opacity: productGridLoading ? 0.4 : 1, transition: "opacity .15s ease", pointerEvents: productGridLoading ? "none" : "auto" }}>
                                    <ProductGrid products={products} />
                                </div>
                                {productLoading && page > 1 && !productGridLoading && (
                                    <div className="products-load-more">
                                        <div className="spinner" /> Loading more products…
                                    </div>
                                )}
                            </>
                        ) : productGridLoading ? (
                            <div className="grid-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
                        ) : (
                            <EmptyProducts reset={handleClearFilter} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}