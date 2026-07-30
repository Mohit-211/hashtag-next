"use client";
import FacetSection from "./Facetsection";
import { GENDER_OPTIONS } from "@/data/constants";

interface GenderFacetProps {
  activeGenders: string[];
  open: boolean;
  onToggleSection: () => void;
  onToggleGender: (gender: string) => void;
  onClear: () => void;
}

export default function GenderFacet({ activeGenders, open, onToggleSection, onToggleGender, onClear }: GenderFacetProps) {
  return (
    <FacetSection title="Gender" count={activeGenders.length} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div className="facet-chip-row">
        {GENDER_OPTIONS.map((gender) => (
          <button
            key={gender}
            type="button"
            className={`facet-chip ${activeGenders.includes(gender) ? "checked" : ""}`}
            onClick={() => onToggleGender(gender)}
            aria-pressed={activeGenders.includes(gender)}
          >
            {gender.charAt(0) + gender.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </FacetSection>
  );
}
