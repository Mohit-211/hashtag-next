"use client";

import { ChevronDown } from "lucide-react";

interface SortOption {
  label: string;
  value: string;
}

interface CategoryFilterBarProps {
  subcategories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;

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
  return (
    <>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {subcategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort + product count */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {filteredCount} products
        </span>

        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg"
          >
            Sort
            <ChevronDown className="h-4 w-4" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-card border rounded-lg shadow">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setSortOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
