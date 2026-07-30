"use client";
import { Check } from "lucide-react";
import type { GrandCategory, ParentCategory, SelectedSubCategory } from "@/data/types";

interface CategorySubNavProps {
  hoveredCat: GrandCategory | null | undefined;
  hoveredCatParents: ParentCategory[];
  subnavVisible: boolean;
  dropdownTop: number;
  activeParents: SelectedSubCategory[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleSubCategory: (cat: GrandCategory, parent: ParentCategory) => void;
}

/** Horizontal sub-category dropdown shown under a hovered header tab. Real
 * filtering for grand categories that have sub-categories happens
 * exclusively through the checkbox pills here. */
export default function CategorySubNav({
  hoveredCat,
  hoveredCatParents,
  subnavVisible,
  dropdownTop,
  activeParents,
  onMouseEnter,
  onMouseLeave,
  onToggleSubCategory,
}: CategorySubNavProps) {
  return (
    <div
      className={`cat-subnav ${subnavVisible ? "open" : ""}`}
      style={{ top: dropdownTop }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cat-subnav-inner">
        <span className="cat-subnav-label">{hoveredCat?.name}</span>
        {hoveredCatParents.map((parent) => {
          const checked = !!hoveredCat && activeParents.some((p) => p.grandId === hoveredCat.id && p.id === parent.id);
          return (
            <button
              key={parent.id}
              className={`cat-subnav-item ${checked ? "active" : ""}`}
              onClick={() => hoveredCat && onToggleSubCategory(hoveredCat, parent)}
            >
              {checked && <Check size={11} strokeWidth={3} />}
              {parent.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
