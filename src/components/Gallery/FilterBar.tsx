"use client";

import { LayoutGrid, List } from "lucide-react";
import { CATEGORIES, PhotoCategory } from "./Gallerydata";
import "./gallery-animations.css";

interface FilterBarProps {
  active: PhotoCategory;
  onFilter: (cat: PhotoCategory) => void;
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
}

export default function FilterBar({
  active,
  onFilter,
  viewMode,
  onViewChange,
}: FilterBarProps) {
  return (
    <div
      className="anim-slide-up max-w-7xl mx-auto px-8 mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      style={{ animationDelay: "0.18s" }}
    >
      {CATEGORIES.map((cat, i) => (
        <div key={cat} className="relative shrink-0">
          <button
            onClick={() => onFilter(cat)}
            className={[
              "h-8 px-4 rounded-full border text-[12px] font-medium whitespace-nowrap",
              "transition-all duration-200 ease-out hover:scale-105 active:scale-95",
              active === cat
                ? "bg-stone-900 text-stone-50 border-stone-900 shadow-sm"
                : "bg-white text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-800",
            ].join(" ")}
            style={{ animationDelay: `${0.22 + i * 0.04}s` }}
          >
            {cat}
          </button>
          {/* Active indicator dot */}
          {active === cat && (
            <span
              className="anim-dot-pop absolute -bottom-[3px] left-1/2 w-1 h-1 rounded-full bg-stone-900"
              style={{ transform: "translateX(-50%)" }}
            />
          )}
        </div>
      ))}

      <div className="flex-1 min-w-4" />

      {/* View toggle */}
      <div className="flex gap-1 shrink-0 bg-stone-100 rounded-lg p-0.5">
        {(["grid", "list"] as const).map((mode) => (
          <button
            key={mode}
            aria-label={`${mode} view`}
            onClick={() => onViewChange(mode)}
            className={[
              "w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200",
              viewMode === mode
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-400 hover:text-stone-600 hover:scale-105",
            ].join(" ")}
          >
            {mode === "grid" ? (
              <LayoutGrid size={13} strokeWidth={1.7} />
            ) : (
              <List size={13} strokeWidth={1.7} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
