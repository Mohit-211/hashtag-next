"use client";
import { Check } from "lucide-react";
import FacetSection from "./Facetsection";
import { COLOR_OPTIONS } from "@/data/constants";

interface ColorFacetProps {
  activeColors: string[];
  open: boolean;
  onToggleSection: () => void;
  onToggleColor: (color: string) => void;
  onClear: () => void;
}

export default function ColorFacet({ activeColors, open, onToggleSection, onToggleColor, onClear }: ColorFacetProps) {
  return (
    <FacetSection title="Color" count={activeColors.length} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div className="color-swatch-row">
        {COLOR_OPTIONS.map(({ name, hex }) => {
          const checked = activeColors.includes(name);
          return (
            <button
              key={name}
              type="button"
              className={`color-swatch ${checked ? "checked" : ""}`}
              style={{ background: hex }}
              onClick={() => onToggleColor(name)}
              aria-pressed={checked}
              aria-label={name}
              title={name}
            >
              {checked && <Check size={13} strokeWidth={3} className="color-swatch-check" />}
            </button>
          );
        })}
      </div>
    </FacetSection>
  );
}
