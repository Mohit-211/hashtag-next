"use client";

import {
  Search, X, Loader2, ChevronRight, LayoutGrid, Tag
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Category, SortOption } from "@/data/typesproduct";

interface CategoryFilterBarProps {
  subcategories: Category[];
  activeCategory: Category;
  setActiveCategory: (category: Category) => void;
  sortOptions: SortOption[];
  sortOpen: boolean;
  setSortOpen: (open: boolean) => void;
  filteredCount: number;
  categorySearch: string;
  setCategorySearch: (search: string) => void;
  hasMoreCategories: boolean;
  onLoadMoreCategories: () => void;
  categoryLoading: boolean;
}

const DEBOUNCE_MS = 350;

export default function CategoryFilterBar({
  subcategories,
  activeCategory,
  setActiveCategory,
  sortOptions,
  sortOpen,
  setSortOpen,
  filteredCount,
  categorySearch,
  setCategorySearch,
  hasMoreCategories,
  onLoadMoreCategories,
  categoryLoading,
}: CategoryFilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchDraft, setSearchDraft] = useState(categorySearch);
  const [panelHeight, setPanelHeight] = useState(0);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAll = activeCategory.id === null;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 8);
    setFadeRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll, subcategories]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelHeight(el.scrollHeight));
    ro.observe(el);
    setPanelHeight(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (panelRef.current) setPanelHeight(panelRef.current.scrollHeight);
  }, [subcategories]);

  const handleLoadMore = useCallback(() => {
    onLoadMoreCategories();
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }, 480);
  }, [onLoadMoreCategories]);

  const handleSearch = useCallback((val: string) => {
    setSearchDraft(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCategorySearch(val), DEBOUNCE_MS);
  }, [setCategorySearch]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSelect = (cat: Category) => {
    setActiveCategory(cat);
    setExpanded(false);
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (!next) { setSearchDraft(""); setCategorySearch(""); }
    else setTimeout(() => inputRef.current?.focus(), 320);
  };

  const scrollCats = subcategories.filter((c) => c.id !== null);

  // ── Pill class helpers ────────────────────────────────────────────────────
  // Matches screenshot: rounded-full, border, ~34–36px height, px-4, text-[13px]
  const pillBase =
    "inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[13px] leading-none " +
    "font-normal border whitespace-nowrap flex-shrink-0 cursor-pointer select-none " +
    "transition-all duration-100 active:scale-[0.97]";
  const pillIdle =
    "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900";
  const pillActive =
    "bg-zinc-900 text-white border-zinc-900";

  return (
    <>
      <style>{`
        .cfb-scroll { scrollbar-width: none; }
        .cfb-scroll::-webkit-scrollbar { display: none; }

        @keyframes cfb-panel-in {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cfb-panel-in { animation: cfb-panel-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes cfb-chip {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        .cfb-chip { animation: cfb-chip 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }

        @keyframes cfb-badge {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .cfb-badge { animation: cfb-badge 0.2s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="w-full">

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3">

          {/* "All" pill */}
          {!expanded && (
            <button
              onClick={() => handleSelect({ id: null, name: "All" })}
              className={`${pillBase} ${isAll ? pillActive : pillIdle}`}
            >
              All
            </button>
          )}

          {/* Scrollable category pills */}
          {!expanded && (
            <div className="relative flex-1 min-w-0 overflow-hidden">
              <div
                className="pointer-events-none absolute left-0 top-0 h-full w-10 z-10 transition-opacity duration-200"
                style={{
                  opacity: fadeLeft ? 1 : 0,
                  background: "linear-gradient(to right, #fff 20%, transparent)",
                }}
              />

              <div
                ref={scrollRef}
                className="cfb-scroll flex items-center gap-2 overflow-x-auto"
                style={{ paddingBottom: "1px" }}
              >
                {scrollCats.map((cat, i) => (
                  <button
                    key={`${cat.name}-${i}`}
                    onClick={() => handleSelect(cat)}
                    className={`${pillBase} ${activeCategory.name === cat.name ? pillActive : pillIdle}`}
                  >
                    {cat.name}
                  </button>
                ))}

                {hasMoreCategories && (
                  <button
                    onClick={handleLoadMore}
                    disabled={categoryLoading}
                    className={`${pillBase} border-dashed border-zinc-300 text-zinc-400 bg-white
                      hover:border-zinc-400 hover:text-zinc-600
                      disabled:opacity-40 disabled:cursor-not-allowed text-[12px]`}
                  >
                    {categoryLoading
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <ChevronRight className="h-3 w-3" />
                    }
                    {categoryLoading ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>

              <div
                className="pointer-events-none absolute right-0 top-0 h-full w-12 z-10 transition-opacity duration-200"
                style={{
                  opacity: fadeRight ? 1 : 0,
                  background: "linear-gradient(to left, #fff 20%, transparent)",
                }}
              />
            </div>
          )}

          {/* Browse all / Close */}
          <button
            onClick={handleToggle}
            className={`${pillBase} gap-2 font-medium
              ${expanded
                ? `${pillActive} flex-1 justify-center`
                : pillIdle
              }`}
          >
            {expanded
              ? <><X className="h-3.5 w-3.5" /> Close</>
              : <><LayoutGrid className="h-3.5 w-3.5" /> Browse all</>
            }
          </button>
        </div>

        {/* ── EXPANDABLE PANEL ─────────────────────────────────────────────── */}
        <div
          style={{
            maxHeight: expanded ? `${panelHeight + 4}px` : "0px",
            overflow: "hidden",
            transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div
            ref={panelRef}
            className={`rounded-2xl border border-zinc-200 bg-white overflow-hidden mb-4
              shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]
              ${expanded ? "cfb-panel-in" : ""}`}
          >
            {/* Search bar */}
            <div className="px-5 pt-5 pb-4">
              <div
                className={`flex items-center gap-3 h-11 px-4 rounded-xl border transition-all duration-150
                  ${searchFocused
                    ? "border-zinc-800 bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                  }`}
              >
                {categoryLoading
                  ? <Loader2 className="h-4 w-4 text-zinc-400 flex-shrink-0 animate-spin" />
                  : <Search className={`h-4 w-4 flex-shrink-0 transition-colors ${searchFocused ? "text-zinc-600" : "text-zinc-400"}`} />
                }
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search categories…"
                  value={searchDraft}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent text-[14px] text-zinc-800 outline-none placeholder:text-zinc-400"
                />
                {searchDraft ? (
                  <button
                    onClick={() => { setSearchDraft(""); setCategorySearch(""); }}
                    className="h-5 w-5 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="h-3 w-3 text-zinc-500" />
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-300 font-mono flex-shrink-0 select-none tracking-wide">
                    {subcategories.length}{hasMoreCategories ? "+" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-100 mx-5" />

            {/* Pills grid */}
            <div className="px-5 py-4">
              {categoryLoading && subcategories.length <= 1 ? (
                <div className="flex items-center justify-center py-10 gap-3 text-[13px] text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading categories…
                </div>
              ) : subcategories.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="text-[13px] text-zinc-500 font-medium">No categories match</p>
                  <button
                    onClick={() => { setSearchDraft(""); setCategorySearch(""); }}
                    className="text-[12px] text-zinc-400 underline underline-offset-2 hover:text-zinc-700 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* All chip */}
                  <button
                    onClick={() => handleSelect({ id: null, name: "All" })}
                    className={`${pillBase} ${activeCategory.id === null ? pillActive : pillIdle}`}
                  >
                    All
                  </button>

                  {subcategories
                    .filter((c) => c.id !== null)
                    .map((cat, i) => {
                      const active = activeCategory.name === cat.name;
                      return (
                        <button
                          key={`p-${cat.name}-${i}`}
                          onClick={() => handleSelect(cat)}
                          className={`cfb-chip ${pillBase} ${active ? pillActive : pillIdle}`}
                          style={{ animationDelay: `${(i + 1) * 14}ms` }}
                        >
                          {cat.name}
                        </button>
                      );
                    })}

                  {hasMoreCategories && (
                    <button
                      onClick={handleLoadMore}
                      disabled={categoryLoading}
                      className={`${pillBase} border-dashed border-zinc-300 text-zinc-400 bg-white
                        hover:border-zinc-400 hover:text-zinc-600
                        disabled:opacity-40 disabled:cursor-not-allowed text-[12px]`}
                    >
                      {categoryLoading
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <ChevronRight className="h-3 w-3" />
                      }
                      {categoryLoading ? "Loading…" : "Load more"}
                    </button>
                  )}
                </div>
              )}

              {categoryLoading && subcategories.length > 1 && (
                <div className="flex items-center gap-2 mt-3 text-[12px] text-zinc-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading more categories…
                </div>
              )}
            </div>

            {/* Active filter strip */}
            {!isAll && (
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-[12px] text-zinc-400">Filtered by</span>
                  <span className="cfb-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[12px] font-semibold">
                    {activeCategory.name}
                    <button
                      onClick={() => { setActiveCategory({ id: null, name: "All" }); setExpanded(false); }}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
                <button
                  onClick={() => { setActiveCategory({ id: null, name: "All" }); setExpanded(false); }}
                  className="text-[12px] text-zinc-400 hover:text-zinc-800 transition-colors font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Result line ── */}
        {!isAll && (
          <p className="text-[13px] text-zinc-400 mb-6">
            Showing{" "}
            <span className="font-semibold text-zinc-600">{activeCategory.name}</span>
          </p>
        )}

      </div>
    </>
  );
}