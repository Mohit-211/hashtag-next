"use client";
import FacetSection from "./Facetsection";
import CheckRow from "./Checkrow";

interface AvailabilityFacetProps {
  inStockOnly: boolean;
  open: boolean;
  onToggleSection: () => void;
  onToggleInStock: () => void;
}

export default function AvailabilityFacet({ inStockOnly, open, onToggleSection, onToggleInStock }: AvailabilityFacetProps) {
  return (
    <FacetSection
      title="Availability"
      count={inStockOnly ? 1 : 0}
      open={open}
      onToggle={onToggleSection}
      onClear={() => { if (inStockOnly) onToggleInStock(); }}
    >
      <CheckRow checked={inStockOnly} label="In stock only" onToggle={onToggleInStock} />
    </FacetSection>
  );
}
