"use client";
import FacetSection from "./Facetsection";
import { FABRIC_OPTIONS } from "@/data/constants";

interface FabricFacetProps {
  activeFabrics: string[];
  open: boolean;
  onToggleSection: () => void;
  onToggleFabric: (fabric: string) => void;
  onClear: () => void;
}

export default function FabricFacet({ activeFabrics, open, onToggleSection, onToggleFabric, onClear }: FabricFacetProps) {
  return (
    <FacetSection title="Fabric" count={activeFabrics.length} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div className="facet-chip-row">
        {FABRIC_OPTIONS.map((fabric) => (
          <button
            key={fabric}
            type="button"
            className={`facet-chip ${activeFabrics.includes(fabric) ? "checked" : ""}`}
            onClick={() => onToggleFabric(fabric)}
            aria-pressed={activeFabrics.includes(fabric)}
          >
            {fabric.charAt(0) + fabric.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </FacetSection>
  );
}
