"use client";
import Image from "next/image";
import { resolveImageSrc } from "@/lib/images";
import type { Industry, ParentCategory, UseCase } from "@/data/types";
import { categoriesViewStyles } from "./categoriesView.styles";
interface UseCasePickerGateProps {
  industries: Industry[];
  industriesLoading: boolean;
  onSelectUseCase: (industry: Industry, useCase: UseCase, selectedCategories?: ParentCategory[]) => void;
  onSkipGate: () => void;
}
const SKELETON_COUNT = 8;

export default function UseCasePickerGate({
  industries,
  industriesLoading,
  onSelectUseCase,
  onSkipGate,
}: UseCasePickerGateProps) {
  const industryGroups = industries
    .map((ind) => ({ industry: ind, useCases: ind.use_cases ?? [] }))
    .filter((g) => g.useCases.length > 0);
  return (
    <div className="container p-4 sm:p-6 lg:p-10">
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
                    const i = stagger++;
                    return (
                      <button
                        key={`${industry.id}-${uc.id}`}
                        type="button"
                        className="ucgate-usecase-card"
                        style={
                          {
                            "--stagger": i,
                            position: "relative",
                            borderRadius: "var(--radius-lg, 0.5rem)",
                            overflow: "hidden",
                            padding: 0,
                            background: "transparent",
                          } as React.CSSProperties
                        }
                        onClick={() => onSelectUseCase(industry, uc)}
                      >
                        <Image
                          src={resolveImageSrc(uc.image)}
                          alt={uc.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 268px"
                          className="ucgate-card-image"
                        // style={{ objectFit: "cover" }}
                        />
                        <div className="absolute inset-0 bg-foreground/25 group-hover:bg-foreground/50 transition-colors" />
                        {/* Overlaid title + tags */}
                        <div className="ucgate-usecase-caption">
                          <div className="ucgate-usecase-caption-title">
                            {uc.title}
                          </div>
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
    </div>
  );
}
