"use client";
import FacetSection from "./Facetsection";
import { SIZE_OPTIONS } from "@/data/constants";

interface SizeFacetProps {
  activeSizes: string[];
  open: boolean;
  onToggleSection: () => void;
  onToggleSize: (size: string) => void;
  onClear: () => void;
}

export default function SizeFacet({ activeSizes, open, onToggleSection, onToggleSize, onClear }: SizeFacetProps) {
  return (
    <FacetSection title="Size" count={activeSizes.length} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div className="facet-chip-row">
        {SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            className={`facet-chip ${activeSizes.includes(size) ? "checked" : ""}`}
            onClick={() => onToggleSize(size)}
            aria-pressed={activeSizes.includes(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </FacetSection>
  );
}