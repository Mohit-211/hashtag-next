"use client";
import Image from "next/image";
import type { Industry, UseCase } from "@/data/types";
import { categoriesViewStyles } from "./categoriesView.styles";
interface UseCasePickerGateProps {
  industries: Industry[];
  industriesLoading: boolean;
  onSelectUseCase: (industry: Industry, useCase: UseCase) => void;
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
 * Flattened by design: every use case across every industry is shown in a
 * single grid immediately. Each card is a full-bleed 4:5 image with the use
 * case title (and its category tags) overlaid on a bottom gradient scrim —
 * no separate white section, no industry label, since the industry
 * grouping isn't what users are scanning for here.
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
          <div className="ucgate-usecase-list">
            {allUseCases.map(({ industry, useCase: uc }, i) => {
              const cats = uc.parent_categories ?? [];
              const visibleCats = cats.slice(0, MAX_VISIBLE_TAGS);
              const remaining = cats.length - visibleCats.length;
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
                  onClick={() => onSelectUseCase(industry, uc)}
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
        )}
      </div>
    </div>
  );
}