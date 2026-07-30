"use client";
import { ChevronDown } from "lucide-react";

interface FacetSectionProps {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

/** Collapsible sidebar section wrapper (Category, Industry, Brands, Price,
 * Size, Color, Gender, Fabric, Availability all use this shell). */
export default function FacetSection({ title, count, open, onToggle, onClear, children }: FacetSectionProps) {
  return (
    <div className="facet-section">
      <button type="button" className="facet-header" onClick={onToggle} aria-expanded={open}>
        <span className="facet-header-left">
          <span className="facet-title">{title}</span>
          {!!count && <span className="facet-count-badge">{count}</span>}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!!count && onClear && (
            <span className="clear-all-link" onClick={(e) => { e.stopPropagation(); onClear(); }}>
              Clear
            </span>
          )}
          <ChevronDown size={16} className={`facet-chevron ${open ? "open" : ""}`} />
        </span>
      </button>
      {open && <div className="facet-body">{children}</div>}
    </div>
  );
}