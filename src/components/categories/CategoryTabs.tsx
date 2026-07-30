"use client";
import { ChevronDown } from "lucide-react";
import type { GrandCategory, SelectedSubCategory } from "@/data/types";

interface CategoryTabsProps {
  categoryTabs: GrandCategory[];
  activeCategory: GrandCategory;
  activeParents: SelectedSubCategory[];
  hoveredCatId: number | null | "none";
  tabRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onHoverEnter: (cat: GrandCategory) => void;
  onHoverLeave: () => void;
  onTabClick: (cat: GrandCategory) => void;
}

/** Sticky-header category tabs. Clicking a NAME:
 *  - If the category has sub-categories: only opens/toggles the hover
 *    dropdown (does NOT apply any filter).
 *  - If the category has NO sub-categories (leaf): filters to that whole
 *    category directly (no finer option exists).
 * Real filtering for categories WITH sub-categories happens only via the
 * checkboxes in the CategorySubNav dropdown. */
export default function CategoryTabs({
  categoryTabs,
  activeCategory,
  activeParents,
  hoveredCatId,
  tabRefs,
  onHoverEnter,
  onHoverLeave,
  onTabClick,
}: CategoryTabsProps) {
  return (
    <>
      {categoryTabs.map((cat) => {
        const hasParents = !!cat.parent_categories && cat.parent_categories.length > 0;
        const isTabActive =
          (activeCategory.id === cat.id && !activeParents.length) ||
          activeParents.some((p) => p.grandId === cat.id);
        const isOpen = hoveredCatId === cat.id;
        return (
          <div
            key={cat.id}
            className="cat-tab-wrap"
            ref={(el) => { tabRefs.current[String(cat.id)] = el; }}
            onMouseEnter={() => onHoverEnter(cat)}
            onMouseLeave={onHoverLeave}
          >
            <div className={`cat-tab ${isTabActive ? "active" : ""}`} onClick={() => onTabClick(cat)}>
              {cat.name}
              {hasParents && (
                <ChevronDown size={12} className={`cat-tab-chevron ${isOpen ? "open" : ""}`} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
