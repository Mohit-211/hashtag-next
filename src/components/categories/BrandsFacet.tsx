"use client";
import FacetSection from "./Facetsection";
import CheckRow from "./Checkrow";
import type { Brand } from "@/data/types";

interface BrandsFacetProps {
  brandList: Brand[];
  brandLoading: boolean;
  activeBrands: Brand[];
  open: boolean;
  onToggleSection: () => void;
  onToggleBrand: (brand: Brand) => void;
  onClear: () => void;
}

export default function BrandsFacet({
  brandList,
  brandLoading,
  activeBrands,
  open,
  onToggleSection,
  onToggleBrand,
  onClear,
}: BrandsFacetProps) {
  return (
    <FacetSection title="Brands" count={activeBrands.length} open={open} onToggle={onToggleSection} onClear={onClear}>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {brandList.length === 0 && brandLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer-row" />)
          : brandList.map((brand) => {
              const checked = activeBrands.some((b) => String(b.id) === String(brand.id));
              return (
                <CheckRow
                  key={brand.id}
                  checked={checked}
                  label={brand.name}
                  count={brand.count}
                  onToggle={() => onToggleBrand(brand)}
                />
              );
            })}
      </div>
    </FacetSection>
  );
}
