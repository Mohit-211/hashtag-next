"use client";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { brandInitials } from "@/lib/utils";
import type { Brand } from "@/data/types";

interface BrandMegaMenuProps {
  brandList: Brand[];
  brandLoading: boolean;
  activeBrands: Brand[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggleBrand: (brand: Brand) => void;
}

/** Sticky-header "Brands" tab + hover mega-menu grid. Multi-select, shares
 * state (`activeBrands`) with the sidebar Brands facet. */
export default function BrandMegaMenu({
  brandList,
  brandLoading,
  activeBrands,
  open,
  onOpen,
  onClose,
  onToggleBrand,
}: BrandMegaMenuProps) {
  return (
    <div className="brand-tab-wrap" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button className={`brand-tab-btn ${open || activeBrands.length ? "active" : ""}`}>
        Brands
        {activeBrands.length > 0 && <span className="brand-tab-count">{activeBrands.length}</span>}
        <ChevronDown size={14} className={`brand-chevron ${open ? "open" : ""}`} />
      </button>
      <div className={`brand-mega ${open ? "open" : ""}`}>
        <div className="brand-mega-inner">
          <div className="brand-mega-head">
            <span className="brand-mega-title">Shop by brand</span>
            <span className="brand-mega-count">
              {brandList.length} brand{brandList.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="brand-mega-grid">
            {brandList.length === 0 && brandLoading
              ? Array.from({ length: 15 }).map((_, i) => <div key={i} className="brand-mega-shimmer" />)
              : brandList.map((brand) => {
                  const selected = activeBrands.some((b) => String(b.id) === String(brand.id));
                  return (
                    <div
                      key={brand.id}
                      className={`brand-card ${selected ? "selected" : ""}`}
                      onClick={() => onToggleBrand(brand)}
                    >
                      {selected && (
                        <span className="brand-card-check">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                      <div className="brand-logo-wrap">
                        {brand.logo ? (
                          <Image src={brand.logo} alt={brand.name} fill style={{ objectFit: "contain", padding: 4 }} />
                        ) : (
                          <span className="brand-initials">{brandInitials(brand.name)}</span>
                        )}
                      </div>
                      <div className="brand-card-name">{brand.name}</div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
}
