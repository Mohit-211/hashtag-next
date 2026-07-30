"use client";
// ─────────────────────────────────────────────────────────────────────────
// CategoriesView — top-level orchestrator for the category browsing /
// filtering experience.
//
// This component is intentionally thin: ALL state, effects, and business
// logic live in `useCategoriesView` (see hooks/useCategoriesView.ts). This
// file's only job is to render the right shell for the current mode
// (Use-Case Picker gate vs. Products view) and wire hook values into the
// presentational sub-components.
//
// See hooks/useCategoriesView.ts for the detailed behavior contracts (
// grand-category click rules, search-clearing rules, category_id merging
// between the Category tree and Industry > Use Case tree, etc.) — those
// comments were preserved there since that's where the logic now lives.
// ─────────────────────────────────────────────────────────────────────────
import { categoriesViewStyles } from "../../components/categories/categoriesView.styles";
import { useCategoriesView } from "../../components/categories/useCategoriesView";
// import type { CategoriesViewProps } from "./types";

import UseCasePickerGate from "../../components/categories/UseCasePickerGate";
import UseCaseBanner from "../../components/categories/UseCaseBanner";
import CategoriesHeaderNav from "../../components/categories/CategoriesHeaderNav";
import CategorySubNav from "../../components/categories/CategorySubNav";
import CategoriesSidebar from "../../components/categories/CategoriesSidebar";
import CategoriesTopBar from "../../components/categories/CategoriesTopBar";
import ProductsArea from "../../components/categories/ProductsArea";
import { CategoriesViewProps } from "@/data/types";

export default function CategoriesView({
  initialCategoryId,
  initialParentId,
  initialBrandId,
  initialIndustryId,
  initialIndustrySlug,
}: CategoriesViewProps) {
  const v = useCategoriesView({
    initialCategoryId,
    initialParentId,
    initialBrandId,
    initialIndustryId,
    initialIndustrySlug,
  });
console.log(v.industries,"-----------")
  // ═══════════════════════════ USE CASE PICKER GATE ═══════════════════════════
  if (v.viewMode === "picker") {
    return (
      <UseCasePickerGate
        industries={v.industries}
        industriesLoading={v.industriesLoading}
        // pickerIndustryId={v.pickerIndustryId}
        // onSetPickerIndustry={v.setPickerIndustryId}s
        onSelectUseCase={v.handleSelectUseCase}
        onSkipGate={v.handleSkipGate}
      />
    );
  }

  if (v.initialLoading) {
    return (
      <div className="full-page-loader">
        <style>{categoriesViewStyles}</style>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className="cat-root">
      <style>{categoriesViewStyles}</style>

      {v.cameFromGate && (
        <UseCaseBanner selectedUseCase={v.selectedUseCase} onBackToUseCases={v.handleBackToUseCases} />
      )}

      <CategoriesHeaderNav
        isAllActive={v.isAllActive}
        onAllClick={v.handleClearFilter}
        brandList={v.brandList}
        brandLoading={v.brandLoading}
        activeBrands={v.activeBrands}
        brandMenuOpen={v.brandMenuOpen}
        onBrandMenuOpen={() => v.setBrandMenuOpen(true)}
        onBrandMenuClose={() => v.setBrandMenuOpen(false)}
        onToggleBrand={v.toggleBrand}
        categoryTabs={v.otherCategoryTabs}
        activeCategory={v.activeCategory}
        activeParents={v.activeParents}
        hoveredCatId={v.hoveredCatId}
        tabRefs={v.tabRefs}
        onHoverEnter={v.handleTabHoverEnter}
        onHoverLeave={v.handleTabHoverLeave}
        onTabClick={v.handleTabClick}
      />

      <CategorySubNav
        hoveredCat={v.hoveredCat}
        hoveredCatParents={v.hoveredCatParents}
        subnavVisible={v.subnavVisible}
        dropdownTop={v.dropdownPos.top}
        activeParents={v.activeParents}
        onMouseEnter={v.handleSubnavMouseEnter}
        onMouseLeave={v.handleSubnavMouseLeave}
        onToggleSubCategory={v.toggleSubCategory}
      />

      <div className="cat-shell">
        <CategoriesSidebar
          sidebarOpen={v.sidebarOpen}
          onCloseSidebar={() => v.setSidebarOpen(false)}
          onResetAll={v.handleClearFilter}
          isAllActive={v.isAllActive}
          categoryTabs={v.otherCategoryTabs}
          activeCategory={v.activeCategory}
          activeParents={v.activeParents}
          expandedCategoryIds={v.expandedCategoryIds}
          categoryOpen={v.openSections.category}
          onToggleCategorySection={() => v.toggleSection("category")}
          onToggleCategoryExpand={v.toggleCategoryExpand}
          onSelectLeafCategory={v.handleCategoryTabSelect}
          onToggleSubCategory={v.toggleSubCategory}
          onClearCategory={v.clearCategoryFacet}
          industries={v.industries}
          activeIndustry={v.activeIndustry}
          activeIndustryCategories={v.activeIndustryCategories}
          expandedIndustryIds={v.expandedIndustryIds}
          collapsedUseCaseIds={v.collapsedUseCaseIds}
          industryOpen={v.openSections.industry}
          onToggleIndustrySection={() => v.toggleSection("industry")}
          onToggleIndustryExpand={v.toggleIndustryExpand}
          onSelectLeafIndustry={v.handleIndustrySelect}
          onToggleUseCaseExpand={v.toggleUseCaseExpand}
          onToggleUseCaseCategories={v.toggleUseCaseCategories}
          onClearIndustry={v.clearIndustryFacet}
          brandList={v.brandList}
          brandLoading={v.brandLoading}
          activeBrands={v.activeBrands}
          brandOpen={v.openSections.brand}
          onToggleBrandSection={() => v.toggleSection("brand")}
          onToggleBrand={v.toggleBrand}
          onClearBrands={v.clearBrands}
          priceRange={v.priceRange}
          priceOpen={v.openSections.price}
          onTogglePriceSection={() => v.toggleSection("price")}
          onMinPriceChange={v.handleMinPriceChange}
          onMaxPriceChange={v.handleMaxPriceChange}
          onClearPrice={() => v.commitPriceRange([0, 500])}
          activeSizes={v.activeSizes}
          sizeOpen={v.openSections.size}
          onToggleSizeSection={() => v.toggleSection("size")}
          onToggleSize={v.toggleSize}
          onClearSizes={v.clearSizes}
          activeColors={v.activeColors}
          colorOpen={v.openSections.color}
          onToggleColorSection={() => v.toggleSection("color")}
          onToggleColor={v.toggleColor}
          onClearColors={v.clearColors}
          activeGenders={v.activeGenders}
          genderOpen={v.openSections.gender}
          onToggleGenderSection={() => v.toggleSection("gender")}
          onToggleGender={v.toggleGender}
          onClearGenders={v.clearGenders}
          activeFabrics={v.activeFabrics}
          fabricOpen={v.openSections.fabric}
          onToggleFabricSection={() => v.toggleSection("fabric")}
          onToggleFabric={v.toggleFabric}
          onClearFabrics={v.clearFabrics}
          inStockOnly={v.inStockOnly}
          stockOpen={v.openSections.stock}
          onToggleStockSection={() => v.toggleSection("stock")}
          onToggleInStock={v.toggleInStock}
        />

        {v.sidebarOpen && <div className="sidebar-backdrop" onClick={() => v.setSidebarOpen(false)} />}

        <div className="cat-main">
          <CategoriesTopBar
            headingLabel={v.headingLabel}
            totalProducts={v.total_products}
            productGridLoading={v.productGridLoading}
            pills={v.pills}
            totalFacetCount={v.totalFacetCount}
            onClearAll={v.handleClearFilter}
            onOpenSidebar={() => v.setSidebarOpen(true)}
            sortBy={v.sortBy}
            currentSortLabel={v.currentSortLabel}
            allSortOptions={v.allSortOptions}
            onSortChange={v.handleSortChange}
          />
          <ProductsArea
            products={v.products}
            productGridLoading={v.productGridLoading}
            productLoading={v.productLoading}
            page={v.page}
            onResetFilters={v.handleClearFilter}
          />
        </div>
      </div>
    </div>
  );
}