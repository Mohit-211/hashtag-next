"use client";
import { useMemo } from "react";
import FacetSection from "./Facetsection";
import { PRICE_MIN, PRICE_MAX, PRICE_STEP } from "@/data/constants";

interface PriceFacetProps {
  priceRange: [number, number];
  open: boolean;
  onToggleSection: () => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onClear: () => void;
}

export default function PriceFacet({
  priceRange,
  open,
  onToggleSection,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: PriceFacetProps) {
  const priceMinPct = useMemo(() => ((priceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100, [priceRange]);
  const priceMaxPct = useMemo(() => ((priceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100, [priceRange]);

  return (
    <FacetSection
      title="Price"
      count={priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0}
      open={open}
      onToggle={onToggleSection}
      onClear={onClear}
    >
      <div className="price-range-wrap">
        <div className="price-range-values">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}{priceRange[1] === PRICE_MAX ? "+" : ""}</span>
        </div>
        <div className="price-slider-track">
          <div className="price-slider-range" style={{ left: `${priceMinPct}%`, right: `${100 - priceMaxPct}%` }} />
          <input
            type="range"
            className="price-slider-input"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange[0]}
            onChange={(e) => onMinPriceChange(Number(e.target.value))}
            aria-label="Minimum price"
          />
          <input
            type="range"
            className="price-slider-input"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange[1]}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            aria-label="Maximum price"
          />
        </div>
      </div>
    </FacetSection>
  );
}
