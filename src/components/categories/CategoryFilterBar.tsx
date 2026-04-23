"use client";

import { ChevronDown, Search, X, Grid2X2, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Category, SortOption } from "@/data/typesproduct";

interface CategoryFilterBarProps {
  subcategories: Category[];
  activeCategory: Category;
  setActiveCategory: (category: Category) => void;
  sortOptions: SortOption[];
  sortBy: SortOption["value"];
  setSortBy: (value: SortOption["value"]) => void;
  sortOpen: boolean;
  setSortOpen: (open: boolean) => void;
  filteredCount: number;
}

export default function CategoryFilterBar({
  subcategories,
  activeCategory,
  setActiveCategory,
  sortOptions,
  sortBy,
  setSortBy,
  sortOpen,
  setSortOpen,
  filteredCount,
}: CategoryFilterBarProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(subcategories.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close sort on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setSortOpen]);

  // Measure visible pill count
  useEffect(() => {
    const calculate = () => {
      const container = containerRef.current;
      if (!container) return;

      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: fixed; top: -9999px; left: 0;
        width: ${container.offsetWidth}px;
        display: flex; gap: 8px; flex-wrap: nowrap;
        visibility: hidden; pointer-events: none;
      `;
      document.body.appendChild(tempDiv);

      const pillEls: HTMLElement[] = subcategories.map((cat) => {
        const btn = document.createElement("button");
        btn.style.cssText =
          "padding: 6px 16px; border-radius: 9999px; font-size: 13px; white-space: nowrap; flex-shrink: 0;";
        btn.textContent = cat.name;
        tempDiv.appendChild(btn);
        return btn;
      });

      const viewMoreBtn = document.createElement("button");
      viewMoreBtn.style.cssText =
        "padding: 6px 48px; border-radius: 9999px; font-size: 13px; white-space: nowrap; flex-shrink: 0;";
      viewMoreBtn.textContent = "View more";
      tempDiv.appendChild(viewMoreBtn);

      const containerWidth = container.offsetWidth;
      const viewMoreWidth = viewMoreBtn.offsetWidth + 8;
      const availableWidth = containerWidth - viewMoreWidth;

      let usedWidth = 0;
      let count = 0;
      for (const el of pillEls) {
        const w = el.offsetWidth + 8;
        if (usedWidth + w > availableWidth) break;
        usedWidth += w;
        count++;
      }

      document.body.removeChild(tempDiv);

      const totalWidth = pillEls.reduce(
        (sum, el) => sum + el.offsetWidth + 8,
        0
      );
      setVisibleCount(
        totalWidth <= containerWidth ? subcategories.length : count
      );
    };

    calculate();
    const ro = new ResizeObserver(calculate);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [subcategories]);

  const showViewMore = visibleCount < subcategories.length;
  const hiddenCategories = subcategories.slice(visibleCount);
  const filteredHidden = hiddenCategories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCategorySelect = (cat: Category): void => {
    setActiveCategory(cat);
    if (expanded) setExpanded(false);
  };

  const handleToggleExpand = (): void => {
    setExpanded((prev) => !prev);
    setSearch("");
  };

  return (
    <div>
      {/* ── Pill row ── */}
      <div
        ref={containerRef}
        className="flex items-center gap-2 mb-3 overflow-hidden"
      >
        {subcategories.slice(0, visibleCount).map((cat, index) => {
          const isActive = activeCategory.name === cat.name;
          return (
            <button
              key={`${cat.name}-${index}`}
              onClick={() => handleCategorySelect(cat)}
              className={`
                px-4 py-[6px] rounded-full text-[13px] whitespace-nowrap flex-shrink-0
                border transition-all duration-150
                ${
                  isActive
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a] font-medium"
                    : "bg-white text-[#555] border-[#e0e0e0] font-normal hover:border-[#aaa] hover:text-[#111]"
                }
              `}
            >
              {cat.name}
            </button>
          );
        })}

        {showViewMore && (
          <button
            onClick={handleToggleExpand}
            className={`
              px-3.5 py-[6px] rounded-full text-[13px] whitespace-nowrap flex-shrink-0
              flex items-center gap-1.5 border transition-all duration-200
              ${
                expanded
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a] font-medium"
                  : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#aaa] hover:text-[#111]"
              }
            `}
          >
            <Grid2X2 className="h-3 w-3" />
            {expanded ? "Close" : `+${subcategories.length - visibleCount} more`}
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* ── Expandable panel ── */}
      {showViewMore && (
        <div
          style={{
            maxHeight: expanded
              ? `${panelRef.current?.scrollHeight ?? 600}px`
              : "0px",
            opacity: expanded ? 1 : 0,
            transition:
              "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
            overflow: "hidden",
          }}
          className="mb-3"
        >
          <div
            ref={panelRef}
            className="rounded-2xl border border-[#ebebeb] bg-[#fafafa] p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#999]">
                All categories{" "}
                <span className="text-[#1a1a1a]">{subcategories.length}</span>
              </span>

              <div className="flex items-center gap-2 border border-[#e0e0e0] rounded-full px-3 py-1.5 bg-white focus-within:border-[#999] transition-colors w-44">
                <Search className="h-3.5 w-3.5 text-[#aaa] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs outline-none w-full text-[#333] placeholder:text-[#bbb]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-[#bbb] hover:text-[#555]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-[#ebebeb] mb-3" />

            {filteredHidden.length === 0 ? (
              <p className="text-xs text-[#bbb] text-center py-3">
                No categories found
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredHidden.map((cat, index) => {
                  const isActive = activeCategory.name === cat.name;
                  return (
                    <button
                      key={`${cat.name}-${index}`}
                      onClick={() => handleCategorySelect(cat)}
                      className={`
                        px-3.5 py-[6px] rounded-full text-[13px] border transition-all duration-150
                        ${
                          isActive
                            ? "bg-[#1a1a1a] text-white border-[#1a1a1a] font-medium"
                            : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#aaa] hover:text-[#111]"
                        }
                      `}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}

            {activeCategory.id !== null && (
              <div className="mt-3 pt-3 border-t border-[#ebebeb] flex items-center justify-between">
                <span className="text-xs text-[#999]">
                  Showing:{" "}
                  <span className="font-medium text-[#1a1a1a]">
                    {activeCategory.name}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setActiveCategory({ id: null, name: "All" });
                    setExpanded(false);
                  }}
                  className="text-xs text-[#aaa] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result count ── */}
      <p className="text-xs text-[#aaa] mb-5">
        <span className="font-medium text-[#333]">{filteredCount}</span>{" "}
        {filteredCount === 1 ? "product" : "products"}
        {activeCategory.id !== null && (
          <span>
            {" "}
            in{" "}
            <span className="font-medium text-[#333]">
              {activeCategory.name}
            </span>
          </span>
        )}
      </p>
    </div>
  );
}