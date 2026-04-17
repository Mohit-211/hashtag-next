"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SortOption {
  label: string;
  value: string;
}

interface CategoryFilterBarProps {
  subcategories: any[];
  activeCategory: any;
  setActiveCategory: (category: any) => void;
  sortOptions: SortOption[];
  sortBy: string;
  setSortBy: (value: string) => void;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(subcategories.length);

  const containerRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setSortOpen]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  useEffect(() => {
    const calculate = () => {
      const container = containerRef.current;
      if (!container) return;

      // Temporarily render all pills to measure
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: fixed;
        top: -9999px;
        left: 0;
        width: ${container.offsetWidth}px;
        display: flex;
        gap: 8px;
        flex-wrap: nowrap;
        visibility: hidden;
        pointer-events: none;
      `;
      document.body.appendChild(tempDiv);

      // Create pill elements to measure
      const pillEls: HTMLElement[] = subcategories.map((cat) => {
        const btn = document.createElement("button");
        btn.style.cssText =
          "padding: 8px 16px; border-radius: 8px; font-size: 14px; white-space: nowrap; flex-shrink: 0;";
        btn.textContent = cat?.name ?? "";
        tempDiv.appendChild(btn);
        return btn;
      });

      // "View more" button width
      const viewMoreBtn = document.createElement("button");
      viewMoreBtn.style.cssText =
        "padding: 8px 16px; border-radius: 8px; font-size: 14px; white-space: nowrap; flex-shrink: 0;";
      viewMoreBtn.textContent = "View more";
      tempDiv.appendChild(viewMoreBtn);

      const containerWidth = container.offsetWidth;
      const viewMoreWidth = viewMoreBtn.offsetWidth + 8; // +gap
      const availableWidth = containerWidth - viewMoreWidth;

      let usedWidth = 0;
      let count = 0;

      for (const el of pillEls) {
        const w = el.offsetWidth + 8; // +gap
        if (usedWidth + w > availableWidth) break;
        usedWidth += w;
        count++;
      }

      document.body.removeChild(tempDiv);

      // If all pills fit without needing "View more", show all
      const totalWidth = pillEls.reduce((sum, el) => sum + el.offsetWidth + 8, 0);
      setVisibleCount(totalWidth <= containerWidth ? subcategories.length : count);
    };

    calculate();

    const ro = new ResizeObserver(calculate);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [subcategories]);

  const showViewMore = visibleCount < subcategories.length;
  const filteredModal = subcategories.filter((cat) =>
    cat?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const activeSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "Sort";

  return (
    <>
      {/* Single-line pill row */}
      <div
        ref={containerRef}
        className="flex items-center gap-2 mb-6 overflow-hidden"
      >
        {subcategories.slice(0, visibleCount).map((cat, index) => {
          const name = cat?.name;
          return (
            <button
              key={`${name}-${index}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 ${
                activeCategory?.name === name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              {name}
            </button>
          );
        })}

        {showViewMore && (
          <button
            onClick={() => { setModalOpen(true); setSearch(""); }}
            className="px-4 py-2 rounded-lg text-sm bg-secondary whitespace-nowrap flex-shrink-0 flex items-center gap-1"
          >
            View more
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sort + Count bar */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {filteredCount} {filteredCount === 1 ? "product" : "products"}
        </span>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm"
          >
            {activeSortLabel}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                sortOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-card border rounded-lg shadow z-10 overflow-hidden">
              {sortOptions.map((opt, index) => (
                <button
                  key={`${opt.value}-${index}`}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors ${
                    sortBy === opt.value ? "font-medium text-primary" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <span className="font-medium text-sm">All Categories</span>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-secondary/50">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {filteredModal.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No categories found
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredModal.map((cat, index) => {
                    const name = cat?.name;
                    return (
                      <button
                        key={`${name}-${index}`}
                        onClick={() => {
                          setActiveCategory(cat);
                          setModalOpen(false);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          activeCategory?.name === name
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t flex-shrink-0 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {filteredModal.length} categories
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}