"use client";
import FacetSection from "./Facetsection";
import { TIER_OPTIONS } from "@/data/constants";

interface TierFacetProps {
  activeTier: string;
  open: boolean;
  onToggleSection: () => void;
  onSelectTier: (tier: string) => void;
  onClear: () => void;
}

export default function TierFacet({ activeTier, open, onToggleSection, onSelectTier, onClear }: TierFacetProps) {
  return (
    <FacetSection title="Tier" count={activeTier !== "all" ? 1 : 0} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div className="facet-chip-row">
        {TIER_OPTIONS.map((tier) => (
          <button
            key={tier.value}
            type="button"
            className={`facet-chip ${activeTier === tier.value ? "checked" : ""}`}
            onClick={() => onSelectTier(tier.value)}
            aria-pressed={activeTier === tier.value}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </FacetSection>
  );
}
