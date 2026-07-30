"use client";
import { RotateCcw, X } from "lucide-react";
import CategoryTreeFacet from "./CategoryTreeFacet";
import IndustryTreeFacet from "./IndustryTreeFacet";
import BrandsFacet from "./BrandsFacet";
import PriceFacet from "./PriceFacet";
// import SizeFacet from "./SizeFacet";
import ColorFacet from "./ColorFacet";
import GenderFacet from "./GenderFacet";
import FabricFacet from "./FabricFacet";
import AvailabilityFacet from "./AvailabilityFacet";
import type {
  Brand,
  GrandCategory,
  Industry,
  ParentCategory,
  SelectedIndustryCategory,
  SelectedSubCategory,
  UseCase,
} from "@/data/types";
import SizeFacet from "./Sizefacet";

interface CategoriesSidebarProps {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  onResetAll: () => void;
  isAllActive: boolean;

  // Category tree
  categoryTabs: GrandCategory[];
  activeCategory: GrandCategory;
  activeParents: SelectedSubCategory[];
  expandedCategoryIds: Set<number>;
  categoryOpen: boolean;
  onToggleCategorySection: () => void;
  onToggleCategoryExpand: (catId: number) => void;
  onSelectLeafCategory: (cat: GrandCategory) => void;
  onToggleSubCategory: (cat: GrandCategory, parent: ParentCategory) => void;
  onClearCategory: () => void;

  // Industry tree
  industries: Industry[];
  activeIndustry: Industry;
  activeIndustryCategories: SelectedIndustryCategory[];
  expandedIndustryIds: Set<number>;
  collapsedUseCaseIds: Set<number>;
  industryOpen: boolean;
  onToggleIndustrySection: () => void;
  onToggleIndustryExpand: (indId: number) => void;
  onSelectLeafIndustry: (ind: Industry) => void;
  onToggleUseCaseExpand: (ucId: number) => void;
  onToggleUseCaseCategories: (ind: Industry, useCase: UseCase) => void;
  onClearIndustry: () => void;

  // Brands
  brandList: Brand[];
  brandLoading: boolean;
  activeBrands: Brand[];
  brandOpen: boolean;
  onToggleBrandSection: () => void;
  onToggleBrand: (brand: Brand) => void;
  onClearBrands: () => void;

  // Price
  priceRange: [number, number];
  priceOpen: boolean;
  onTogglePriceSection: () => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onClearPrice: () => void;

  // Size
  activeSizes: string[];
  sizeOpen: boolean;
  onToggleSizeSection: () => void;
  onToggleSize: (size: string) => void;
  onClearSizes: () => void;

  // Color
  activeColors: string[];
  colorOpen: boolean;
  onToggleColorSection: () => void;
  onToggleColor: (color: string) => void;
  onClearColors: () => void;

  // Gender
  activeGenders: string[];
  genderOpen: boolean;
  onToggleGenderSection: () => void;
  onToggleGender: (gender: string) => void;
  onClearGenders: () => void;

  // Fabric
  activeFabrics: string[];
  fabricOpen: boolean;
  onToggleFabricSection: () => void;
  onToggleFabric: (fabric: string) => void;
  onClearFabrics: () => void;

  // Availability
  inStockOnly: boolean;
  stockOpen: boolean;
  onToggleStockSection: () => void;
  onToggleInStock: () => void;
}

/** Sidebar shell: reset/close controls, "All Products" row, and every facet
 * section (Category, Industry, Brands, Price, Size, Color, Gender, Fabric,
 * Availability). Purely presentational — all state and handlers are owned
 * by the parent CategoriesView. */
export default function CategoriesSidebar(props: CategoriesSidebarProps) {
  const {
    sidebarOpen,
    onCloseSidebar,
    onResetAll,
    isAllActive,
  } = props;

  return (
    <aside className={`cat-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top-row">
        <span className="sidebar-title">Filters</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="sidebar-reset-btn" onClick={onResetAll}>
            <RotateCcw size={13} /> Reset
          </button>
          <button className="sidebar-close-btn" onClick={onCloseSidebar} aria-label="Close filters">
            <X size={16} />
          </button>
        </div>
      </div>
      <div
        className="check-row"
        role="button"
        tabIndex={0}
        style={{ fontWeight: isAllActive ? 700 : 500, color: isAllActive ? "var(--color-foreground)" : undefined }}
        onClick={onResetAll}
        onKeyDown={(e) => { if (e.key === "Enter") onResetAll(); }}
      >
        <span className="check-row-left"><span className="check-row-name">All Products</span></span>
      </div>

      <CategoryTreeFacet
        categoryTabs={props.categoryTabs}
        activeCategory={props.activeCategory}
        activeParents={props.activeParents}
        expandedCategoryIds={props.expandedCategoryIds}
        open={props.categoryOpen}
        onToggleSection={props.onToggleCategorySection}
        onToggleCategoryExpand={props.onToggleCategoryExpand}
        onSelectLeafCategory={props.onSelectLeafCategory}
        onToggleSubCategory={props.onToggleSubCategory}
        onClear={props.onClearCategory}
      />

      <IndustryTreeFacet
        industries={props.industries}
        activeIndustry={props.activeIndustry}
        activeIndustryCategories={props.activeIndustryCategories}
        expandedIndustryIds={props.expandedIndustryIds}
        collapsedUseCaseIds={props.collapsedUseCaseIds}
        open={props.industryOpen}
        onToggleSection={props.onToggleIndustrySection}
        onToggleIndustryExpand={props.onToggleIndustryExpand}
        onSelectLeafIndustry={props.onSelectLeafIndustry}
        onToggleUseCaseExpand={props.onToggleUseCaseExpand}
        onToggleUseCaseCategories={props.onToggleUseCaseCategories}
        onClear={props.onClearIndustry}
      />

      <BrandsFacet
        brandList={props.brandList}
        brandLoading={props.brandLoading}
        activeBrands={props.activeBrands}
        open={props.brandOpen}
        onToggleSection={props.onToggleBrandSection}
        onToggleBrand={props.onToggleBrand}
        onClear={props.onClearBrands}
      />

      <PriceFacet
        priceRange={props.priceRange}
        open={props.priceOpen}
        onToggleSection={props.onTogglePriceSection}
        onMinPriceChange={props.onMinPriceChange}
        onMaxPriceChange={props.onMaxPriceChange}
        onClear={props.onClearPrice}
      />

      <SizeFacet
        activeSizes={props.activeSizes}
        open={props.sizeOpen}
        onToggleSection={props.onToggleSizeSection}
        onToggleSize={props.onToggleSize}
        onClear={props.onClearSizes}
      />

      <ColorFacet
        activeColors={props.activeColors}
        open={props.colorOpen}
        onToggleSection={props.onToggleColorSection}
        onToggleColor={props.onToggleColor}
        onClear={props.onClearColors}
      />

      <GenderFacet
        activeGenders={props.activeGenders}
        open={props.genderOpen}
        onToggleSection={props.onToggleGenderSection}
        onToggleGender={props.onToggleGender}
        onClear={props.onClearGenders}
      />

      <FabricFacet
        activeFabrics={props.activeFabrics}
        open={props.fabricOpen}
        onToggleSection={props.onToggleFabricSection}
        onToggleFabric={props.onToggleFabric}
        onClear={props.onClearFabrics}
      />

      <AvailabilityFacet
        inStockOnly={props.inStockOnly}
        open={props.stockOpen}
        onToggleSection={props.onToggleStockSection}
        onToggleInStock={props.onToggleInStock}
      />
    </aside>
  );
}
