"use client";
import { Check, ChevronDown } from "lucide-react";
import FacetSection from "./Facetsection";
import type { Industry, SelectedIndustryCategory, UseCase } from "@/data/types";

interface IndustryTreeFacetProps {
  industries: Industry[];
  activeIndustry: Industry;
  activeIndustryCategories: SelectedIndustryCategory[];
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
 * deeper: Industry (grand) -> Use Case (mid) -> real, checkable categories.
 * Checking a use case checks/unchecks every real category under it in one
 * go; the categories themselves are merged into the same `category_id` API
 * param as the plain Category tree — a Use Case's own id is never sent. */
export default function IndustryTreeFacet({
  industries,
  activeIndustry,
  activeIndustryCategories,
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
  return (
    <FacetSection
      title="Industry"
      count={activeIndustryCategories.length || (activeIndustry.id !== null ? 1 : 0)}
      open={open}
      onToggle={onToggleSection}
      onClear={onClear}
    >
      {industries.map((ind) => {
        const isIndActive = activeIndustry.id === ind.id || activeIndustryCategories.some((c) => c.industryId === ind.id);
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
                  const ucCategories = uc.parent_categories ?? [];
                  if (!ucCategories.length) return null;
                  // "Select all" state for the use-case row itself —
                  // checked only once EVERY category under it is checked.
                  const ucAllChecked = ucCategories.every((cat) =>
                    activeIndustryCategories.some(
                      (c) => c.industryId === ind.id && c.useCaseId === uc.id && c.id === cat.id
                    )
                  );
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
