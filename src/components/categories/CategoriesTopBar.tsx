"use client";
import { ArrowUpDown, ChevronDown, X } from "lucide-react";
import type { Pill, SortValue } from "@/data/types";
import type { sortOptions } from "@/data/products";

interface CategoriesTopBarProps {
  headingLabel: string;
  totalProducts: number;
  productGridLoading: boolean;
  pills: Pill[];
  totalFacetCount: number;
  onClearAll: () => void;
  onOpenSidebar: () => void;
  sortBy: SortValue;
  currentSortLabel: string;
  allSortOptions: typeof sortOptions;
  onSortChange: (value: SortValue) => void;
}

/** Top bar above the product grid: mobile filter toggle, heading, item
 * count, active-filter pills, "Clear all", and the sort dropdown. */
export default function CategoriesTopBar({
  headingLabel,
  totalProducts,
  productGridLoading,
  pills,
  totalFacetCount,
  onClearAll,
  onOpenSidebar,
  sortBy,
  currentSortLabel,
  allSortOptions,
  onSortChange,
}: CategoriesTopBarProps) {
  console.log(pills,"pillspills")
  return (
    <div className="cat-topbar">
      <div className="cat-topbar-left">
        <button className="sidebar-toggle-btn" onClick={onOpenSidebar} aria-label="Open filters">
          <ArrowUpDown size={14} /> Filters
        </button>
        <h1 className="cat-heading">{headingLabel}</h1>
        <span className="cat-count">
          {totalProducts.toLocaleString()} items
          {productGridLoading && <span className="spinner" style={{ width: 12, height: 12, marginLeft: 8, verticalAlign: "middle" }} />}
        </span>
        {pills.map((p) => (
          <span key={p.key} className="filter-pill">
            {p.label}
            <button className="filter-pill-remove" onClick={p.onRemove} aria-label={`Remove ${p.label}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        {totalFacetCount > 0 && <button className="clear-all-link" onClick={onClearAll}>Clear all</button>}
      </div>
      <div className="cat-topbar-right">
        <div className="sort-wrap">
          <span className="sort-icon"><ArrowUpDown size={14} /></span>
          <span className="sort-label">Sort by</span>
          <span className="sort-current">{currentSortLabel}</span>
          <span className="sort-caret"><ChevronDown size={14} /></span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortValue)}
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
  );
}
