"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Industry, ParentCategory, UseCase } from "@/data/types";
import { categoriesViewStyles } from "./categoriesView.styles";
import CheckRow from "./Checkrow";
interface UseCasePickerGateProps {
  industries: Industry[];
  industriesLoading: boolean;
  onSelectUseCase: (industry: Industry, useCase: UseCase, selectedCategories?: ParentCategory[]) => void;
  onSkipGate: () => void;
}
const SKELETON_COUNT = 8;
const MAX_VISIBLE_TAGS = 2;
const FALLBACK_IMAGE = "/placeholder.png"; // adjust to whatever fallback asset you actually have
/** Resolves a raw `image` field from the API into a usable <Image src>.
 * - Absolute URLs (http/https) pass through untouched.
 * - Relative paths get prefixed with NEXT_PUBLIC_IMAGE_URL.
 * - Missing/empty values fall back to a local placeholder.
 * NOTE: the external host used here must also be whitelisted in
 * next.config.js under images.remotePatterns, or next/image will refuse
 * to render it (this is the #1 reason images silently don't show up). */
function resolveImageSrc(image?: string | null) {
  if (!image) return FALLBACK_IMAGE;
  if (image.startsWith("http")) return image;
  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
  if (!base) return FALLBACK_IMAGE;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = image.startsWith("/") ? image : `/${image}`;
  return `${trimmedBase}${trimmedPath}`;
}
/** Default landing view for plain /categories: a full-page "Select a Use
 * Case" gate, sourced live from IndustryApi (the same `industries` data the
 * sidebar's Industry facet uses — no separate fetch, no hardcoded list).
 *
 * Clubbed by industry: use cases are grouped under their owning industry,
 * each group rendered as its own labeled section, instead of one flat grid
 * mixing use cases from every industry together.
 *
 * Picking a use case doesn't redirect immediately — it opens a modal
 * (`UseCaseItemsModal` below) listing the real product categories
 * (`uc.parent_categories`) under that use case, so the user can narrow down
 * to just the items they want before landing on the filtered product grid.
 * Confirming checks the exact same real category ids that the sidebar's
 * "select all" use-case checkbox would check — see `onSelectUseCase` in the
 * parent hook. */
export default function UseCasePickerGate({
  industries,
  industriesLoading,
  onSelectUseCase,
  onSkipGate,
}: UseCasePickerGateProps) {
  const industryGroups = industries
    .map((ind) => ({ industry: ind, useCases: ind.use_cases ?? [] }))
    .filter((g) => g.useCases.length > 0);
  const [activePick, setActivePick] = useState<{ industry: Industry; useCase: UseCase } | null>(null);
  return (
    <div className="container p-10">
      <div className="max-w-2xl mb-10">
      </div>
      <style>{categoriesViewStyles}</style>
      <div className="ucgate-header">
        <div className="ucgate-eyebrow">Use Case Collections</div>
        <h1 className="ucgate-title">What are you shopping for?</h1>
        <p className="ucgate-subtitle">
          Pick a use case to see a curated set of product categories built for it.
        </p>
        <div className="ucgate-back-row">
          <span className="ucgate-skip-link" style={{ marginLeft: "auto" }} onClick={onSkipGate}>
            Skip &amp; browse all products
          </span>
        </div>
        {industriesLoading && !industries.length ? (
          <div className="ucgate-industry-grid">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="ucgate-skeleton-card" />
            ))}
          </div>
        ) : (
          (() => {
            let stagger = 0;
            return industryGroups.map(({ industry, useCases }) => (
              <div key={industry.id} className="ucgate-industry-group">
                <h2 className="ucgate-industry-group-title">{industry.title}</h2>
                <div className="ucgate-usecase-list">
                  {useCases.map((uc) => {
                    const cats = uc.parent_categories ?? [];
                    const visibleCats = cats.slice(0, MAX_VISIBLE_TAGS);
                    const remaining = cats.length - visibleCats.length;
                    const i = stagger++;
                    return (
                      <button
                        key={`${industry.id}-${uc.id}`}
                        type="button"
                        // className="ucgate-usecase-row"
                        style={{
                          ["--stagger" as any]: i,
                          position: "relative",
                          aspectRatio: "4 / 5",
                          borderRadius: "var(--radius-lg, 0.5rem)",
                          overflow: "hidden",
                          padding: 0,
                          background: "transparent",
                        }}
                        onClick={() => setActivePick({ industry, useCase: uc })}
                      >
                        <Image
                          src={resolveImageSrc((uc as any).image)}
                          alt={uc.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 268px"
                          className="ucgate-card-image"
                        // style={{ objectFit: "cover" }}
                        />
                        <div className="absolute inset-0 bg-foreground/25 group-hover:bg-foreground/50 transition-colors" />
                        {/* Overlaid title + tags */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "1rem",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              color: "#fff",
                              fontFamily: "var(--font-heading, inherit)",
                              fontWeight: 700,
                              fontSize: "1.05rem",
                              lineHeight: 1.2,
                              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                            }}
                          >
                            {uc.title}
                          </div>
                          {visibleCats.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                              {visibleCats.map((c) => (
                                <span
                                  key={c.id}
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                    color: "#fff",
                                    background: "rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(2px)",
                                    border: "1px solid rgba(255,255,255,0.35)",
                                    borderRadius: "999px",
                                    padding: "0.2rem 0.6rem",
                                  }}
                                >
                                  {c.title}
                                </span>
                              ))}
                              {remaining > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                    color: "#fff",
                                    background: "rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(2px)",
                                    border: "1px solid rgba(255,255,255,0.35)",
                                    borderRadius: "999px",
                                    padding: "0.2rem 0.6rem",
                                  }}
                                >
                                  +{remaining}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        )}
      </div>
      {activePick && (
        <UseCaseItemsModal
          industry={activePick.industry}
          useCase={activePick.useCase}
          onClose={() => setActivePick(null)}
          onConfirm={(selectedCategories) => {
            onSelectUseCase(activePick.industry, activePick.useCase, selectedCategories);
            setActivePick(null);
          }}
        />
      )}
    </div>
  );
}

interface UseCaseItemsModalProps {
  industry: Industry;
  useCase: UseCase;
  onClose: () => void;
  onConfirm: (selectedCategories: ParentCategory[]) => void;
}

/** Modal shown after picking a use case: lets the shopper pick which of the
 * use case's categories they actually want before redirecting into the
 * filtered product grid. Nothing is pre-checked — the shopper must
 * explicitly choose at least one item, which also keeps "View products"
 * disabled until they do. */
function UseCaseItemsModal({ industry, useCase, onClose, onConfirm }: UseCaseItemsModalProps) {
  const categories = useMemo(() => useCase.parent_categories ?? [], [useCase]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [categories]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleCategory = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = categories.length > 0 && selectedIds.size === categories.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(categories.map((c) => c.id)));

  const selectedCategories = categories.filter((c) => selectedIds.has(c.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Choose items for ${useCase.title}`}
      className="ucgate-modal-backdrop"
      onClick={onClose}
    >
      <div className="ucgate-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ucgate-modal-header">
          <div>
            <div className="ucgate-modal-eyebrow">{industry.title}</div>
            <h2 className="ucgate-modal-title">{useCase.title}</h2>
          </div>
          <button type="button" className="ucgate-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="ucgate-modal-body">
          {categories.length === 0 ? (
            <p className="ucgate-modal-empty">No product categories are set up for this use case yet.</p>
          ) : (
            <>
              <div className="ucgate-modal-selectall">
                <CheckRow
                  checked={allSelected}
                  label="Select all items"
                  onToggle={toggleAll}
                />
              </div>
              <div className="ucgate-modal-list">
                {categories.map((cat) => (
                  <CheckRow
                    key={cat.id}
                    checked={selectedIds.has(cat.id)}
                    label={cat.title}
                    count={cat.count}
                    onToggle={() => toggleCategory(cat.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="ucgate-modal-footer">
          <button type="button" className="ucgate-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ucgate-modal-confirm"
            disabled={selectedCategories.length === 0}
            onClick={() => onConfirm(selectedCategories)}
          >
            View products{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
