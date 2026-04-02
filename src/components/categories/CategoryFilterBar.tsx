"use client";

import { ChevronDown } from "lucide-react";

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
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {subcategories.map((cat, index) => {
          const name = cat?.name;

          return (
            <button
              key={`${name}-${index}`}
              onClick={() => setActiveCategory(cat)} // ✅ FIX
              className={`px-4 py-2 rounded-lg text-sm ${
                activeCategory?.name === name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

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
              {sortOptions.map((opt, index) => (
                <button
                  key={`${opt.value}-${index}`}
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