"use client";
import BrandMegaMenu from "./BrandMegaMenu";
import CategoryTabs from "./CategoryTabs";
import type { Brand, GrandCategory, SelectedSubCategory } from "@/data/types";

interface CategoriesHeaderNavProps {
  isAllActive: boolean;
  onAllClick: () => void;
  brandList: Brand[];
  brandLoading: boolean;
  activeBrands: Brand[];
  brandMenuOpen: boolean;
  onBrandMenuOpen: () => void;
  onBrandMenuClose: () => void;
  onToggleBrand: (brand: Brand) => void;
  categoryTabs: GrandCategory[];
  activeCategory: GrandCategory;
  activeParents: SelectedSubCategory[];
  hoveredCatId: number | null | "none";
  tabRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  navRef: React.MutableRefObject<HTMLDivElement | null>;
  onHoverEnter: (cat: GrandCategory) => void;
  onHoverLeave: () => void;
  onTabClick: (cat: GrandCategory) => void;
}

/** Sticky header nav row: "All" tab, Brands mega-menu, and Category tabs. */
export default function CategoriesHeaderNav({
  isAllActive,
  onAllClick,
  brandList,
  brandLoading,
  activeBrands,
  brandMenuOpen,
  onBrandMenuOpen,
  onBrandMenuClose,
  onToggleBrand,
  categoryTabs,
  activeCategory,
  activeParents,
  hoveredCatId,
  tabRefs,
  navRef,
  onHoverEnter,
  onHoverLeave,
  onTabClick,
}: CategoriesHeaderNavProps) {
  return (
    <div className="cat-nav" ref={navRef}>
      <div className="cat-nav-row">
        <div className="cat-tabs-scroll">
          {/* All */}
          <div className="cat-tab-wrap">
            <div className={`cat-tab ${isAllActive ? "active" : ""}`} onClick={onAllClick}>
              All
            </div>
          </div>
          {/* Brands mega-menu (multi-select, same state as sidebar) */}
          <BrandMegaMenu
            brandList={brandList}
            brandLoading={brandLoading}
            activeBrands={activeBrands}
            open={brandMenuOpen}
            onOpen={onBrandMenuOpen}
            onClose={onBrandMenuClose}
            onToggleBrand={onToggleBrand}
          />
          {/* Category tabs */}
          <CategoryTabs
            categoryTabs={categoryTabs}
            activeCategory={activeCategory}
            activeParents={activeParents}
            hoveredCatId={hoveredCatId}
            tabRefs={tabRefs}
            onHoverEnter={onHoverEnter}
            onHoverLeave={onHoverLeave}
            onTabClick={onTabClick}
          />
        </div>
      </div>
    </div>
  );
}
