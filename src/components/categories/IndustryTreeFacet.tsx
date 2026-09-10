"use client";
import { Check, ChevronDown } from "lucide-react";
import FacetSection from "./Facetsection";
import type { Industry, SelectedIndustryCategory, UseCase } from "@/data/types";

interface IndustryTreeFacetProps {
  industries: Industry[];
  activeIndustry: Industry;
  activeIndustryCategories: SelectedIndustryCategory[];
  activeUseCaseIds: Array<number | string>;
  expandedIndustryIds: Set<number>;
  collapsedUseCaseIds: Set<number>;
  open: boolean;
  onToggleSection: () => void;
  onToggleIndustryExpand: (indId: number) => void;
  onSelectLeafIndustry: (ind: Industry) => void;
  onToggleUseCaseExpand: (ucId: number) => void;
  onToggleUseCaseCategories: (ind: Industry, useCase: UseCase) => void;
  onClear: () => void;
}

/** Sidebar "Industry" facet — mirrors the Category tree, but ends one level
 * deeper: Industry (grand) -> Use Case (mid) -> real categories (shown for
 * context only). Checking a use case checks/unchecks that use case as a
 * whole: its own id is sent straight to `ProductsByUseCaseApi` (via
 * `activeUseCaseIds`/`onToggleUseCaseCategories`) — no category_id is sent
 * alongside it. */
export default function IndustryTreeFacet({
  industries,
  activeIndustry,
  activeIndustryCategories,
  activeUseCaseIds,
  expandedIndustryIds,
  collapsedUseCaseIds,
  open,
  onToggleSection,
  onToggleIndustryExpand,
  onSelectLeafIndustry,
  onToggleUseCaseExpand,
  onToggleUseCaseCategories,
  onClear,
}: IndustryTreeFacetProps) {
  const selectedUseCaseCategoryIds = new Set<number>();
  industries.forEach((ind) => {
    (ind.use_cases ?? []).forEach((uc) => {
      if (!activeUseCaseIds.some((id) => String(id) === String(uc.id))) return;
      (uc.parent_categories ?? []).forEach((cat) => selectedUseCaseCategoryIds.add(cat.id));
    });
  });
  const uniqueSelectedCategoryCount = new Set([
    ...activeIndustryCategories.map((c) => c.id),
    ...selectedUseCaseCategoryIds,
  ]).size;
  return (
    <FacetSection
      title="Industry"
      count={uniqueSelectedCategoryCount || activeUseCaseIds.length || (activeIndustry.id !== null ? 1 : 0)}
      open={open}
      onToggle={onToggleSection}
      onClear={onClear}
    >
      {industries.map((ind) => {
        const isIndActive =
          activeIndustry.id === ind.id ||
          activeIndustryCategories.some((c) => c.industryId === ind.id) ||
          (ind.use_cases ?? []).some((uc) => activeUseCaseIds.some((id) => String(id) === String(uc.id)));
        const hasUseCases = !!ind.use_cases?.length;
        const isExpanded = ind.id != null && expandedIndustryIds.has(ind.id);
        return (
          <div key={ind.id}>
            <div className={`cat-row ${isIndActive ? "active" : ""}`}>
              <button
                type="button"
                className="cat-row-main"
                onClick={() => {
                  if (hasUseCases) {
                    // Name click on an industry WITH use-cases only
                    // expands/collapses the tree — never filters.
                    if (ind.id != null) onToggleIndustryExpand(ind.id);
                    return;
                  }
                  // Leaf industry — filter directly, no finer option exists.
                  onSelectLeafIndustry(ind);
                }}
              >
                <span>{ind.title}</span>
                {!!ind.count && <span className="check-row-count">{ind.count}</span>}
              </button>
              {hasUseCases && (
                <button
                  type="button"
                  className="cat-row-expand"
                  onClick={() => ind.id != null && onToggleIndustryExpand(ind.id)}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${ind.title} categories`}
                  aria-expanded={isExpanded}
                  title="Browse categories"
                >
                  <ChevronDown size={14} className={`facet-chevron ${isExpanded ? "open" : ""}`} />
                </button>
              )}
            </div>
            {hasUseCases && isExpanded && (
              <div className="cat-subrow-list">
                {(ind.use_cases ?? []).map((uc) => {
                  // Checked state comes straight from the use case's own id —
                  // this is the same id sent to ProductsByUseCaseApi.
                  const ucAllChecked = activeUseCaseIds.some((id) => String(id) === String(uc.id));
                  const ucIsExpanded = !collapsedUseCaseIds.has(uc.id);
                  return (
                    <div key={uc.id}>
                      {/* Clicking the checkbox/label checks or unchecks EVERY
                          real category listed under this use case in one go.
                          The separate chevron button only collapses/expands
                          the list — it never changes any selection.
                          `title` gives a native hover tooltip with the
                          full name since long titles get truncated. */}
                      <div className="cat-row usecase-row">
                        <div
                          className="check-row usecase-check-row"
                          role="checkbox"
                          aria-checked={ucAllChecked}
                          tabIndex={0}
                          title={uc.title}
                          onClick={() => onToggleUseCaseCategories(ind, uc)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onToggleUseCaseCategories(ind, uc);
                            }
                          }}
                        >
                          <span className="check-row-left">
                            <span className={`checkbox-box ${ucAllChecked ? "checked" : ""}`}>
                              {ucAllChecked && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="check-row-name usecase-check-row-label">{uc.title}</span>
                          </span>
                        </div>
                        {/* <button
                          type="button"
                          className="cat-row-expand"
                          onClick={() => onToggleUseCaseExpand(uc.id)}
                          aria-label={`${ucIsExpanded ? "Collapse" : "Expand"} ${uc.title} categories`}
                          aria-expanded={ucIsExpanded}
                          title={ucIsExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronDown size={14} className={`facet-chevron ${ucIsExpanded ? "open" : ""}`} />
                        </button> */}
                      </div>
                    </div>
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
