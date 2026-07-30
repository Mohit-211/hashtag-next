"use client";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { Industry, UseCase } from "@/data/types";
import { categoriesViewStyles } from "./categoriesView.styles";

interface UseCasePickerGateProps {
  industries: Industry[];
  industriesLoading: boolean;
  onSelectUseCase: (industry: Industry, useCase: UseCase) => void;
  onSkipGate: () => void;
}

const SKELETON_COUNT = 8;
const MAX_VISIBLE_TAGS = 4;
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
 * Flattened by design: every use case across every industry is shown in a
 * single grid immediately, with the parent industry's name as a small tag
 * on the card. There is no separate "pick an industry first" step — that
 * extra click was removed so users land straight on the thing they're
 * actually choosing.
 *
 * Picking a use case checks the exact same real category ids
 * (`uc.parent_categories`) that the sidebar's "select all" use-case
 * checkbox would check — see `onSelectUseCase` in the parent hook. */
export default function UseCasePickerGate({
  industries,
  industriesLoading,
  onSelectUseCase,
  onSkipGate,
}: UseCasePickerGateProps) {
  const allUseCases = industries.flatMap((ind) =>
    (ind.use_cases ?? []).map((uc) => ({ industry: ind, useCase: uc }))
  );

  return (
    <div className="ucgate-root">
      <style>{categoriesViewStyles}</style>
      <div className="ucgate-header">
        <div className="ucgate-eyebrow">Use Case Collections</div>
        <h1 className="ucgate-title">What are you shopping for?</h1>
        <p className="ucgate-subtitle">
          Pick a use case to see a curated set of product categories built for it.
        </p>
      </div>
      <div className="ucgate-body">
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
          <div className="ucgate-usecase-list">
            {allUseCases.map(({ industry, useCase: uc }, i) => {
              const cats = uc.parent_categories ?? [];
              const visibleCats = cats.slice(0, MAX_VISIBLE_TAGS);
              const remaining = cats.length - visibleCats.length;
              return (
                <button
                  key={`${industry.id}-${uc.id}`}
                  type="button"
                  className="ucgate-usecase-row"
                  style={{ ["--stagger" as any]: i }}
                  onClick={() => onSelectUseCase(industry, uc)}
                >
                  <div className="ucgate-card-image-wrap">
                    <Image
                      src={resolveImageSrc((uc as any).image)}
                      alt={uc.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 268px"
                      className="ucgate-card-image"
                    />
                  </div>
                  <ChevronDown size={16} className="ucgate-usecase-row-arrow" />
                  <span className="ucgate-usecase-industry-tag">{industry.title}</span>
                  <div className="ucgate-usecase-row-title">{uc.title}</div>
                  <div className="ucgate-usecase-row-cats">
                    {visibleCats.map((c) => (
                      <span key={c.id} className="ucgate-usecase-tag">{c.title}</span>
                    ))}
                    {remaining > 0 && (
                      <span className="ucgate-usecase-tag ucgate-usecase-tag-more">+{remaining}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}