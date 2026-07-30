"use client";
import { ChevronDown } from "lucide-react";
// import FacetSection from "./Facetsection";
// import CheckRow from "./CheckRow";
import type { GrandCategory, ParentCategory, SelectedSubCategory } from "@/data/types";
import CheckRow from "./Checkrow";
import FacetSection from "./Facetsection";

interface CategoryTreeFacetProps {
  categoryTabs: GrandCategory[];
  activeCategory: GrandCategory;
  activeParents: SelectedSubCategory[];
  expandedCategoryIds: Set<number>;
  open: boolean;
  onToggleSection: () => void;
  onToggleCategoryExpand: (catId: number) => void;
  onSelectLeafCategory: (cat: GrandCategory) => void;
  onToggleSubCategory: (cat: GrandCategory, parent: ParentCategory) => void;
  onClear: () => void;
}

/** Sidebar "Category" facet: a tree of grand categories, each expandable to
 * show checkable sub-categories. Clicking a grand category's NAME only
 * expands/collapses when it has children; it filters directly only when it
 * is a leaf (no sub-categories) — see the parent for the exact rule. */
export default function CategoryTreeFacet({
  categoryTabs,
  activeCategory,
  activeParents,
  expandedCategoryIds,
  open,
  onToggleSection,
  onToggleCategoryExpand,
  onSelectLeafCategory,
  onToggleSubCategory,
  onClear,
}: CategoryTreeFacetProps) {
  return (
    <FacetSection
      title="Category"
      count={activeParents.length || (activeCategory.id !== null ? 1 : 0)}
      open={open}
      onToggle={onToggleSection}
      onClear={onClear}
    >
      {categoryTabs.map((cat) => {
        const isTabActive = activeCategory.id === cat.id || activeParents.some((p) => p.grandId === cat.id);
        const hasChildren = !!cat.parent_categories?.length;
        const isExpanded = cat.id != null && expandedCategoryIds.has(cat.id);
        return (
          <div key={cat.id}>
            <div className={`cat-row ${isTabActive ? "active" : ""}`}>
              <button
                type="button"
                className="cat-row-main"
                onClick={() => {
                  if (hasChildren) {
                    // Name click on a category WITH sub-categories only
                    // expands/collapses the tree — never filters.
                    if (cat.id != null) onToggleCategoryExpand(cat.id);
                    return;
                  }
                  // Leaf category — filter directly, no finer option exists.
                  onSelectLeafCategory(cat);
                }}
              >
                <span>{cat.name}</span>
                {!!cat.count && <span className="check-row-count">{cat.count}</span>}
              </button>
              {hasChildren && (
                <button
                  type="button"
                  className="cat-row-expand"
                  onClick={() => cat.id != null && onToggleCategoryExpand(cat.id)}
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
                  const checked = activeParents.some((ap) => ap.grandId === cat.id && ap.id === p.id);
                  return (
                    <CheckRow
                      key={p.id}
                      checked={checked}
                      label={p.title}
                      count={p.count}
                      onToggle={() => onToggleSubCategory(cat, p)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </FacetSection>
  );
}
