"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, X } from "lucide-react";
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [megaTop, setMegaTop] = useState(60);

  // Nav can be in its natural flow position (page not scrolled yet) or
  // stuck to the viewport top (after scrolling past the site header), so the
  // dropdown's offset is measured fresh from the trigger each time it opens
  // rather than assumed to always be 60px from the viewport top.
  const measureTop = () => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setMegaTop(rect.bottom);
  };

  const handleOpen = () => {
    measureTop();
    onOpen();
  };

  // While open: keep the dropdown glued to the nav as the page scrolls, and
  // close it on a tap/click outside (touch devices never fire mouseleave).
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureTop);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  // Hover open/close only for real mouse pointers; touch uses the click toggle.
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") handleOpen();
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") onClose();
  };

  return (
    <div className="brand-tab-wrap" ref={wrapRef} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <button
        type="button"
        aria-expanded={open}
        className={`brand-tab-btn ${open || activeBrands.length ? "active" : ""}`}
        onClick={() => (open ? onClose() : handleOpen())}
      >
        Brands
        {activeBrands.length > 0 && <span className="brand-tab-count">{activeBrands.length}</span>}
        <ChevronDown size={14} className={`brand-chevron ${open ? "open" : ""}`} />
      </button>
      <div className={`brand-mega ${open ? "open" : ""}`} style={{ top: megaTop }}>
        <div className="brand-mega-inner">
          <div className="brand-mega-head">
            <span className="brand-mega-title">Shop by brand</span>
            <span className="brand-mega-count">
              {brandList.length} brand{brandList.length !== 1 ? "s" : ""}
              <button type="button" className="brand-mega-close" aria-label="Close brands" onClick={onClose}>
                <X size={16} />
              </button>
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
