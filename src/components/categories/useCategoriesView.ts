"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { sortOptions } from "@/data/products";
import type { SortOption } from "@/data/typesproduct";
import {
  SIZE_OPTIONS,
  COLOR_OPTIONS,
  GENDER_OPTIONS,
  FABRIC_OPTIONS,
  PRICE_MIN,
  PRICE_MAX,
  PRICE_STEP,
} from "@/data/constants";
import { persistSelection, slugify } from "@/lib/utils";
import { useCategoriesData } from "./useCategoriesData";
import type {
  Brand,
  CategoriesViewProps,
  GrandCategory,
  Industry,
  ParentCategory,
  Pill,
  SelectedIndustryCategory,
  SelectedSubCategory,
  UseCase,
} from "@/data/types";

export function useCategoriesView({
  initialCategoryId,
  initialParentId,
  initialBrandId,
  initialIndustryId
}: CategoriesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search")?.trim() ?? "";
  const urlBrowseAll = searchParams.get("view") === "all";
  const urlSearchRef = useRef(urlSearch);
  useEffect(() => { urlSearchRef.current = urlSearch; }, [urlSearch]);
  const allSortOptions = sortOptions;
  const {
    products,
    total_products,
    productLoading,
    productGridLoading,
    initialLoading,
    hasMoreRef,
    categories,
    industries,
    industriesLoading,
    brandList,
    brandLoading,
    setProductGridLoading,
    fetchBrands,
    fetchCategories,
    fetchIndustries,
    fetchProducts,
    fetchProductsByUseCase,
  } = useCategoriesData();
  const [activeCategory, setActiveCategory] = useState<GrandCategory>({ id: null, name: "All" });
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const [activeIndustry, setActiveIndustry] = useState<Industry>({ id: null, title: "All" });
  const [expandedIndustryIds, setExpandedIndustryIds] = useState<Set<number>>(new Set());
  const [collapsedUseCaseIds, setCollapsedUseCaseIds] = useState<Set<number>>(new Set());
  const [activeParents, setActiveParents] = useState<SelectedSubCategory[]>([]);
  const [activeIndustryCategories, setActiveIndustryCategories] = useState<SelectedIndustryCategory[]>([]);
  const [activeBrands, setActiveBrands] = useState<Brand[]>([]);
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeGenders, setActiveGenders] = useState<string[]>([]);
  const [activeFabrics, setActiveFabrics] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true, industry: false, brand: false, price: false, size: false, color: false, gender: false, fabric: false, stock: false,
  });
  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const [sortBy, setSortBy] = useState<SortOption["value"]>("" as SortOption["value"]);
  const hasUrlFilterParam =
    !!initialCategoryId || !!initialBrandId || !!initialIndustryId || !!urlSearch || urlBrowseAll ||
    !!searchParams.get("category_id") || !!searchParams.get("industry_id") || !!searchParams.get("use_case_id");
  const [urlRestoreAttempted, setUrlRestoreAttempted] = useState(!hasUrlFilterParam);
  const [viewMode, setViewMode] = useState<"picker" | "products">(hasUrlFilterParam ? "products" : "picker");
  const [pickerIndustryId, setPickerIndustryId] = useState<number | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<{ industry: string; useCase: string; categoryNames: string[] } | null>(null);
  // Set only by the picker gate's use-case click (handleSelectUseCase). While
  // set, the product grid is sourced from ProductsByUseCaseApi (page/limit
  // only, no category_id) instead of the merged-facet AllProductsApi path.
  // Any other filter/facet interaction clears it and falls back to normal
  // browsing (see syncQueryString, handleCategoryTabSelect, toggleBrand).
  const [activeUseCaseId, setActiveUseCaseId] = useState<number | string | null>(null);
  const activeUseCaseIdRef = useRef<number | string | null>(null);
  const [cameFromGate, setCameFromGate] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState<number | null | "none">("none");
  const [dropdownPos, setDropdownPos] = useState({ top: 0 });
  // The header nav is sticky, not fixed — before the page scrolls past it,
  // its actual bottom edge sits below the (also sticky) global site header,
  // then settles at a constant offset once scrolled. Measuring the nav's
  // own rect (rather than hardcoding an offset) keeps the sub-nav dropdown
  // aligned to the tabs row in both states.
  const catNavRef = useRef<HTMLDivElement | null>(null);
  const updateDropdownPos = useCallback(() => {
    const el = catNavRef.current;
    if (el) setDropdownPos({ top: el.getBoundingClientRect().bottom });
  }, []);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setSearchInput(urlSearch); }, [urlSearch]);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);
  const [page, setPage] = useState(1);
  const activeCategoryRef = useRef<GrandCategory>(activeCategory);
  const activeParentsRef = useRef<SelectedSubCategory[]>([]);
  const activeIndustryRef = useRef<Industry>(activeIndustry);
  const activeIndustryCategoriesRef = useRef<SelectedIndustryCategory[]>([]);
  const activeBrandsRef = useRef<Brand[]>([]);
  const activeSizesRef = useRef<string[]>([]);
  const activeColorsRef = useRef<string[]>([]);
  const activeGendersRef = useRef<string[]>([]);
  const activeFabricsRef = useRef<string[]>([]);
  const inStockOnlyRef = useRef(false);
  const priceRangeRef = useRef<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const sortByRef = useRef<SortOption["value"]>(sortBy);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { activeParentsRef.current = activeParents; }, [activeParents]);
  useEffect(() => { activeIndustryRef.current = activeIndustry; }, [activeIndustry]);
  useEffect(() => { activeIndustryCategoriesRef.current = activeIndustryCategories; }, [activeIndustryCategories]);
  useEffect(() => { activeBrandsRef.current = activeBrands; }, [activeBrands]);
  useEffect(() => { activeSizesRef.current = activeSizes; }, [activeSizes]);
  useEffect(() => { activeColorsRef.current = activeColors; }, [activeColors]);
  useEffect(() => { activeGendersRef.current = activeGenders; }, [activeGenders]);
  useEffect(() => { activeFabricsRef.current = activeFabrics; }, [activeFabrics]);
  useEffect(() => { inStockOnlyRef.current = inStockOnly; }, [inStockOnly]);
  useEffect(() => { priceRangeRef.current = priceRange; }, [priceRange]);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);
  useEffect(() => { activeUseCaseIdRef.current = activeUseCaseId; }, [activeUseCaseId]);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!categories.length) return;
    if (initialBrandId && brandList.length) {
      const ids = initialBrandId.split(",").map((s) => s.trim());
      const matched = brandList.filter((b) => ids.includes(String(b.id)));
      if (matched.length) {
        setActiveBrands(matched);
        activeBrandsRef.current = matched;
      }
    }
    if (initialCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(initialCategoryId));
      if (cat) {
        setActiveCategory(cat);
        activeCategoryRef.current = cat;
      }
    }
    const qCategoryIds = searchParams.get("category_id");
    if (qCategoryIds) {
      const ids = new Set(qCategoryIds.split(",").map((s) => s.trim()));
      const matched: SelectedSubCategory[] = [];
      const expanded = new Set<number>();
      categories.forEach((cat) => {
        (cat.parent_categories ?? []).forEach((p) => {
          if (ids.has(String(p.id)) && cat.id != null) {
            matched.push({ ...p, grandId: cat.id, grandName: cat.name });
            expanded.add(cat.id);
          }
        });
      });
      if (matched.length) {
        setActiveParents(matched);
        activeParentsRef.current = matched;
        setExpandedCategoryIds(expanded);
      }
    } else if (initialParentId && initialCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(initialCategoryId));
      if (cat) {
        const parentIds = initialParentId.split(",").map((s) => s.trim());
        const parents = (cat.parent_categories ?? []).filter((p) => parentIds.includes(String(p.id)));
        if (parents.length && cat.id != null) {
          const matched = parents.map((p) => ({ ...p, grandId: cat.id as number, grandName: cat.name }));
          setActiveParents(matched);
          activeParentsRef.current = matched;
          setExpandedCategoryIds(new Set([cat.id]));
        }
      }
    }
    const qSize = searchParams.get("size");
    if (qSize) {
      const sizes = qSize.split(",").filter((s: string) => SIZE_OPTIONS.includes(s));
      if (sizes.length) setActiveSizes(sizes);
    }
    const qColor = searchParams.get("color");
    if (qColor) {
      const names = COLOR_OPTIONS.map((c) => c.name);
      const colors = qColor.split(",").filter((c) => names.includes(c));
      if (colors.length) setActiveColors(colors);
    }
    const qGender = searchParams.get("gender");
    if (qGender) {
      const genders = qGender.split(",").map((g) => g.trim().toUpperCase()).filter((g) => GENDER_OPTIONS.includes(g));
      if (genders.length) setActiveGenders(genders);
    }
    const qFabric = searchParams.get("fabric");
    if (qFabric) {
      const fabrics = qFabric.split(",").map((f) => f.trim().toUpperCase()).filter((f) => FABRIC_OPTIONS.includes(f));
      if (fabrics.length) setActiveFabrics(fabrics);
    }
    const qStock = searchParams.get("in_stock");
    if (qStock === "true") setInStockOnly(true);
    const qSort = searchParams.get("sort");
    if (qSort && allSortOptions.some((o) => o.value === qSort)) {
      setSortBy(qSort as SortOption["value"]);
    }
    const qMin = searchParams.get("min_price");
    const qMax = searchParams.get("max_price");
    if (qMin || qMax) {
      const min = qMin ? Math.max(PRICE_MIN, Number(qMin)) : PRICE_MIN;
      const max = qMax ? Math.min(PRICE_MAX, Number(qMax)) : PRICE_MAX;
      if (!Number.isNaN(min) && !Number.isNaN(max) && min < max) {
        setPriceRange([min, max]);
      }
    }
    setUrlRestoreAttempted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, brandList, initialCategoryId, initialParentId, initialBrandId]);

  useEffect(() => {
    setHoveredCatId("none");
  }, [initialCategoryId, initialParentId]);

  const industryRestoreAttemptedRef = useRef(false);
  useEffect(() => {
    if (!industries.length || industryRestoreAttemptedRef.current) return;
    industryRestoreAttemptedRef.current = true;
    const qUseCaseId = searchParams.get("use_case_id");
    if (qUseCaseId) {
      for (const ind of industries) {
        const uc = (ind.use_cases ?? []).find((u) => String(u.id) === String(qUseCaseId));
        if (uc && ind.id != null) {
          setActiveUseCaseId(uc.id);
          activeUseCaseIdRef.current = uc.id;
          setExpandedIndustryIds((prev) => new Set([...prev, ind.id as number]));
          setSelectedUseCase({ industry: ind.title, useCase: uc.title, categoryNames: (uc.parent_categories ?? []).map((c) => c.title) });
          setCameFromGate(true);
          setViewMode("products");
          break;
        }
      }
      return;
    }
    const qCategoryIds = searchParams.get("category_id");
    if (qCategoryIds) {
      const ids = new Set(qCategoryIds.split(",").map((s) => s.trim()));
      const matched: SelectedIndustryCategory[] = [];
      const expanded = new Set<number>();
      industries.forEach((ind) => {
        (ind.use_cases ?? []).forEach((uc) => {
          (uc.parent_categories ?? []).forEach((cat) => {
            if (ids.has(String(cat.id)) && ind.id != null) {
              matched.push({ ...cat, industryId: ind.id, industryName: ind.title, useCaseId: uc.id, useCaseName: uc.title });
              expanded.add(ind.id);
            }
          });
        });
      });
      if (matched.length) {
        setActiveIndustryCategories(matched);
        activeIndustryCategoriesRef.current = matched;
        setExpandedIndustryIds((prev) => new Set([...prev, ...expanded]));
        return;
      }
    }
    const qIndustryId = searchParams.get("industry_id") || initialIndustryId;
    if (qIndustryId) {
      const ind = industries.find((i) => String(i.id) === String(qIndustryId));
      if (ind && ind.id != null) {
        setActiveIndustry(ind);
        activeIndustryRef.current = ind;
        setExpandedIndustryIds((prev) => new Set([...prev, ind.id as number]));
        setOpenSections((prev) => ({ ...prev, industry: true }));

        const allCats: SelectedIndustryCategory[] = (ind.use_cases ?? []).flatMap((uc) =>
          (uc.parent_categories ?? []).map((cat) => ({
            ...cat,
            industryId: ind.id as number,
            industryName: ind.title,
            useCaseId: uc.id,
            useCaseName: uc.title,
          }))
        );
        setActiveIndustryCategories(allCats);
        activeIndustryCategoriesRef.current = allCats;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries, initialIndustryId]);

  useEffect(() => {
    if (!industries.length) return;
    const qPickerIndustry = searchParams.get("picker_industry");
    if (qPickerIndustry) {
      const ind = industries.find((i) => String(i.id) === String(qPickerIndustry));
      if (ind && ind.id != null) {
        setPickerIndustryId(ind.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries]);

  // Watches for a search term arriving via a URL that carries NO
  // category_id/industry_id — i.e. a "search only" navigation from the
  // header's own search bar (which bypasses handleHeaderSearchChange).
  // This effect ONLY handles clearing stale filters when a fresh search
  // term shows up. viewMode switching is handled by a separate,
  // unconditional effect below so it can never be missed by this ref-diff.
  const lastReactedSearchRef = useRef<string>(urlSearch);
  useEffect(() => {
    if (urlSearch === lastReactedSearchRef.current) return;
    lastReactedSearchRef.current = urlSearch;
    if (!urlSearch) return; // clearing search shouldn't clear filters
    if (searchParams.get("category_id") || searchParams.get("industry_id") || searchParams.get("use_case_id")) return;
    const hasActiveFilters =
      activeCategoryRef.current.id !== null ||
      activeParentsRef.current.length > 0 ||
      activeIndustryRef.current.id !== null ||
      activeIndustryCategoriesRef.current.length > 0 ||
      activeBrandsRef.current.length > 0 ||
      activeSizesRef.current.length > 0 ||
      activeColorsRef.current.length > 0 ||
      activeGendersRef.current.length > 0 ||
      activeFabricsRef.current.length > 0 ||
      inStockOnlyRef.current ||
      priceRangeRef.current[0] > PRICE_MIN ||
      priceRangeRef.current[1] < PRICE_MAX ||
      activeUseCaseIdRef.current !== null;
    if (!hasActiveFilters) return;
    const emptyCategory: GrandCategory = { id: null, name: "All", parent_categories: [] };
    const emptyIndustry: Industry = { id: null, title: "All", use_cases: [] };
    setActiveCategory(emptyCategory);
    activeCategoryRef.current = emptyCategory;
    setActiveParents([]);
    activeParentsRef.current = [];
    setExpandedCategoryIds(new Set());
    setActiveIndustry(emptyIndustry);
    activeIndustryRef.current = emptyIndustry;
    setActiveIndustryCategories([]);
    activeIndustryCategoriesRef.current = [];
    setExpandedIndustryIds(new Set());
    setActiveUseCaseId(null);
    activeUseCaseIdRef.current = null;
    setActiveBrands([]);
    activeBrandsRef.current = [];
    setActiveSizes([]);
    setActiveColors([]);
    setActiveGenders([]);
    setActiveFabrics([]);
    setInStockOnly(false);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    persistSelection(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // FIX: as long as a search term is present in the URL, guarantee the
  // products view is shown. This is unconditional and doesn't depend on
  // ref-diffing/previous state, so it can't be missed by mount timing,
  // StrictMode double-effects, or a fresh mount that already carries
  // ?search=... (e.g. Header's <form onSubmit={handleSearchSubmit}>
  // pushing straight to /categories?search=...).
  useEffect(() => {
    if (urlSearch) {
      setViewMode("products");
    }
  }, [urlSearch]);

  // Clears every active filter (category, industry, brand, and all facets)
  // without touching viewMode — used whenever the URL itself says "no
  // filters" (bare /categories or /categories?view=all) but stale filter
  // state may still be sitting in React state from a previous selection.
  const clearAllFilterState = useCallback(() => {
    const all: GrandCategory = { id: null, name: "All", parent_categories: [] };
    setActiveCategory(all);
    activeCategoryRef.current = all;
    setActiveParents([]);
    activeParentsRef.current = [];
    setExpandedCategoryIds(new Set());
    setActiveIndustry({ id: null, title: "All", use_cases: [] });
    activeIndustryRef.current = { id: null, title: "All", use_cases: [] };
    setActiveIndustryCategories([]);
    activeIndustryCategoriesRef.current = [];
    setExpandedIndustryIds(new Set());
    setActiveBrands([]);
    activeBrandsRef.current = [];
    setActiveSizes([]);
    setActiveColors([]);
    setActiveGenders([]);
    setActiveFabrics([]);
    setInStockOnly(false);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setSortBy("" as SortOption["value"]);
    setActiveUseCaseId(null);
    activeUseCaseIdRef.current = null;
    persistSelection(null, null);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput("");
  }, []);

  const resetToInitialFlow = useCallback(() => {
    clearAllFilterState();
    setSelectedUseCase(null);
    setCameFromGate(false);
    setPickerIndustryId(null);
    setViewMode("picker");
  }, [clearAllFilterState]);

  // Whenever the pathname becomes exactly bare "/categories" (e.g.
  // Header's "All Products" plain link, browser back/forward, or any other
  // navigation that lands on /categories with no filter/search param),
  // reset everything back to the initial picker flow. We track pathname
  // changes (not just query-string-empty) so this is reliable across every
  // navigation path, including same-route re-clicks. Deep-linked/shared
  // URLs that DO carry a filter or search param are left alone — they
  // should still show their products view, not get reset. A bare
  // "?view=all" is treated separately below: it means "no filters" but
  // should stay on the products grid rather than the picker gate.
  const prevUrlKeyRef = useRef(`${pathname}?${searchParams.toString()}`);
  const isFirstPathCheckRef = useRef(true);
  useEffect(() => {
       const currentUrlKey = `${pathname}?${searchParams.toString()}`;
    if (isFirstPathCheckRef.current) {
      isFirstPathCheckRef.current = false;

      prevUrlKeyRef.current = currentUrlKey;
      return;
    }
    const prevUrlKey = prevUrlKeyRef.current;
     prevUrlKeyRef.current = currentUrlKey;
    if (pathname !== "/categories") return; // only care about bare /categories route
    if (prevUrlKey === currentUrlKey) return// only on a genuine route change

    const hasFilterParam =
      !!searchParams.get("category_id") ||
      !!searchParams.get("industry_id") ||
      !!searchParams.get("search") ||
      !!searchParams.get("brand_id") ||
      !!searchParams.get("use_case_id");
    if (hasFilterParam) return; // deep-linked/shared URL — keep products view

    if (searchParams.get("view") === "all") {
      // Explicit "browse all, no filters" state (set by Skip/Clear-filters,
      // and revisited via browser back/forward). The URL says no filters
      // are active, so any stale category/industry/facet selection left
      // over from a previous route (e.g. picking a category, then going
      // back) must be cleared too — but stay on the products grid instead
      // of bouncing back to the picker gate.
      clearAllFilterState();
      return;
    }

    resetToInitialFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, resetToInitialFlow, clearAllFilterState]);

  // Remember the current filtered products URL so a product detail page's
  // "Back to All Products" link can restore it (filters + pills intact)
  // instead of always landing on the bare unfiltered "view=all" state.
  useEffect(() => {
    if (typeof window === "undefined" || viewMode !== "products") return;
    const key = `${pathname}?${searchParams.toString()}`.replace(/\?$/, "");
    window.sessionStorage.setItem("categoriesReturnUrl", key);
  }, [pathname, searchParams, viewMode]);

  const clearActiveSearch = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput("");
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("search")) return;
    url.searchParams.delete("search");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`.replace(/\?$/, ""), { scroll: false });
  }, [router]);

  const syncQueryString = useCallback(
    (next: {
      categoryIds?: string[];
      sizes?: string[];
      colors?: string[];
      genders?: string[];
      fabrics?: string[];
      inStock?: boolean;
      sort?: SortOption["value"];
      priceRange?: [number, number];
      clearSearch?: boolean;
    }) => {
      if (typeof window === "undefined") return;
      // Any generic facet/filter change means we're no longer showing the
      // picker gate's curated use-case product list.
      if (activeUseCaseIdRef.current !== null) {
        setActiveUseCaseId(null);
        activeUseCaseIdRef.current = null;
      }
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      const categoryIds =
        next.categoryIds ??
        [
          ...activeParentsRef.current.map((p) => String(p.id)),
          ...activeIndustryCategoriesRef.current.map((c) => String(c.id)),
        ];
      const sizes = next.sizes ?? activeSizesRef.current;
      const colors = next.colors ?? activeColorsRef.current;
      const genders = next.genders ?? activeGendersRef.current;
      const fabrics = next.fabrics ?? activeFabricsRef.current;
      const inStock = next.inStock ?? inStockOnlyRef.current;
      const sort = next.sort ?? sortByRef.current;
      const [min, max] = next.priceRange ?? priceRangeRef.current;
      categoryIds.length ? sp.set("category_id", categoryIds.join(",")) : sp.delete("category_id");
      sp.delete("use_case_id");
      sizes.length ? sp.set("size", sizes.join(",")) : sp.delete("size");
      colors.length ? sp.set("color", colors.join(",")) : sp.delete("color");
      genders.length ? sp.set("gender", genders.join(",")) : sp.delete("gender");
      fabrics.length ? sp.set("fabric", fabrics.join(",")) : sp.delete("fabric");
      inStock ? sp.set("in_stock", "true") : sp.delete("in_stock");
      sort ? sp.set("sort", sort) : sp.delete("sort");
      min > PRICE_MIN ? sp.set("min_price", String(min)) : sp.delete("min_price");
      max < PRICE_MAX ? sp.set("max_price", String(max)) : sp.delete("max_price");
      sp.delete("view"); // any explicit filter change means it's no longer the unfiltered "browse all" state
      if (next.clearSearch) {
        sp.delete("search");
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        setSearchInput("");
      }
      router.replace(`${url.pathname}?${sp.toString()}`.replace(/\?$/, ""), { scroll: false });
    },
    [router]
  );

  // Picker gate click: does NOT resolve to category ids. Products come
  // straight from ProductsByUseCaseApi (industry/use-case/{id}/products) via
  // activeUseCaseId, not the merged category_id facet path.
  const handleSelectUseCase = (industry: Industry, useCase: UseCase, selectedCategories?: ParentCategory[]) => {
    if (industry.id == null) return;
    const cats = selectedCategories ?? useCase.parent_categories ?? [];
    setActiveIndustryCategories([]);
    activeIndustryCategoriesRef.current = [];
    setExpandedIndustryIds((prev) => new Set([...prev, industry.id as number]));
    setActiveParents([]);
    activeParentsRef.current = [];
    const emptyCategory: GrandCategory = { id: null, name: "All", parent_categories: [] };
    setActiveCategory(emptyCategory);
    activeCategoryRef.current = emptyCategory;
    setActiveUseCaseId(useCase.id);
    activeUseCaseIdRef.current = useCase.id;
    persistSelection("use_case", useCase.id, { industryId: industry.id, industryName: industry.title });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      sp.set("use_case_id", String(useCase.id));
      sp.delete("category_id");
      sp.delete("industry_id");
      sp.delete("view");
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setSearchInput("");
      sp.delete("search");
      router.replace(`${url.pathname}?${sp.toString()}`.replace(/\?$/, ""), { scroll: false });
    }
    setSelectedUseCase({ industry: industry.title, useCase: useCase.title, categoryNames: cats.map((c) => c.title) });
    setCameFromGate(true);
    setViewMode("products");
    setSidebarOpen(false);
  };

  const handleSkipGate = () => {
    setSelectedUseCase(null);
    setCameFromGate(true);
    setViewMode("products");
    router.replace("/categories?view=all", { scroll: false });
  };

  const handleBackToUseCases = () => {
    const all: GrandCategory = { id: null, name: "All", parent_categories: [] };
    setActiveCategory(all);
    activeCategoryRef.current = all;
    setActiveParents([]);
    activeParentsRef.current = [];
    setActiveIndustryCategories([]);
    activeIndustryCategoriesRef.current = [];
    setSelectedUseCase(null);
    setPickerIndustryId(null);
    setCameFromGate(false);
    setActiveUseCaseId(null);
    activeUseCaseIdRef.current = null;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput("");
    router.push("/categories", { scroll: false });
    setViewMode("picker");
  };

  const initialDataFetchedRef = useRef(false);
  useEffect(() => {
    if (initialDataFetchedRef.current) return;
    initialDataFetchedRef.current = true;
    Promise.all([fetchBrands(), fetchCategories(), fetchIndustries()]);
  }, [fetchBrands, fetchCategories, fetchIndustries]);

  useEffect(() => {
    if (!categories.length) return;
    if (!urlRestoreAttempted) return;
    setProductGridLoading(true);
    pageRef.current = 1;
    setPage(1);
    if (activeUseCaseId != null) {
      fetchProductsByUseCase(activeUseCaseId, 1, false);
      return;
    }
    fetchProducts(1, false, {
      category: activeCategory,
      parents: activeParents,
      industry: activeIndustry,
      industryCategories: activeIndustryCategories,
      brands: activeBrands,
      sizes: activeSizes,
      colors: activeColors,
      inStock: inStockOnly,
      priceRange,
      genders: activeGenders,
      fabrics: activeFabrics,
      sort: sortBy,
      search: urlSearch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categories.length, activeCategory, activeParents, activeIndustry, activeIndustryCategories, activeBrands, activeSizes, activeColors,
    activeGenders, activeFabrics, inStockOnly, priceRange, sortBy, fetchProducts, urlRestoreAttempted, urlSearch, activeUseCaseId,
    fetchProductsByUseCase,
  ]);

  useEffect(() => {
    const handleScroll = async () => {
      if (fetchingRef.current || !hasMoreRef.current || productLoading) return;
      const { scrollY, innerHeight } = window;
      const fullHeight = document.documentElement.scrollHeight;
      if (scrollY + innerHeight >= fullHeight - 200) {
        fetchingRef.current = true;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        if (activeUseCaseIdRef.current != null) {
          await fetchProductsByUseCase(activeUseCaseIdRef.current, nextPage, true);
        } else {
          await fetchProducts(nextPage, true, {
            category: activeCategoryRef.current,
            parents: activeParentsRef.current,
            industry: activeIndustryRef.current,
            industryCategories: activeIndustryCategoriesRef.current,
            brands: activeBrandsRef.current,
            sizes: activeSizesRef.current,
            colors: activeColorsRef.current,
            inStock: inStockOnlyRef.current,
            priceRange: priceRangeRef.current,
            genders: activeGendersRef.current,
            fabrics: activeFabricsRef.current,
            sort: sortByRef.current,
            search: urlSearchRef.current,
          });
        }
        fetchingRef.current = false;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts, fetchProductsByUseCase, productLoading, hasMoreRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const handleCategoryTabSelect = (cat: GrandCategory) => {
    setActiveUseCaseId(null);
    activeUseCaseIdRef.current = null;
    setActiveCategory(cat);
    activeCategoryRef.current = cat;
    setActiveParents([]);
    activeParentsRef.current = [];
    persistSelection(cat.id != null ? "category" : null, cat.id, { name: cat.name });
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput("");
    if (cat.id == null) {
      router.push("/categories", { scroll: false });
    } else {
      const slug = cat.slug || slugify(cat.name);
      router.push(`/categories/${cat.id}/${slug}`, { scroll: false });
    }
    setSidebarOpen(false);
  };

  const toggleCategoryExpand = (catId: number) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const toggleSubCategory = (cat: GrandCategory, parent: ParentCategory) => {
    if (cat.id == null) return;
    setActiveParents((prev) => {
      const exists = prev.some((p) => p.grandId === cat.id && p.id === parent.id);
      const next = exists
        ? prev.filter((p) => !(p.grandId === cat.id && p.id === parent.id))
        : [...prev, { ...parent, grandId: cat.id as number, grandName: cat.name }];
      activeParentsRef.current = next;
      persistSelection(next.length ? "category" : null, next.length ? next.map((p) => p.id).join(",") : null, {
        parentIds: next.map((p) => p.id),
      });
      syncQueryString({
        categoryIds: [...next.map((p) => String(p.id)), ...activeIndustryCategoriesRef.current.map((c) => String(c.id))],
        clearSearch: true,
      });
      return next;
    });
  };

  const handleIndustrySelect = (ind: Industry) => {
    setActiveIndustry(ind);
    activeIndustryRef.current = ind;
    setActiveIndustryCategories((prev) => {
      const next = prev.filter((c) => c.industryId !== ind.id);
      activeIndustryCategoriesRef.current = next;
      syncQueryString({
        categoryIds: [...activeParentsRef.current.map((p) => String(p.id)), ...next.map((c) => String(c.id))],
        clearSearch: true,
      });
      return next;
    });
    persistSelection(ind.id != null ? "industry" : null, ind.id, { name: ind.title });
  };

  const toggleIndustryExpand = (indId: number) => {
    setExpandedIndustryIds((prev) => {
      const next = new Set(prev);
      if (next.has(indId)) next.delete(indId); else next.add(indId);
      return next;
    });
  };

  const toggleUseCaseExpand = (ucId: number) => {
    setCollapsedUseCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(ucId)) next.delete(ucId); else next.add(ucId);
      return next;
    });
  };

  const toggleIndustryCategory = (ind: Industry, useCase: UseCase, category: ParentCategory) => {
    if (ind.id == null) return;
    setActiveIndustryCategories((prev) => {
      const exists = prev.some((c) => c.industryId === ind.id && c.useCaseId === useCase.id && c.id === category.id);
      const next = exists
        ? prev.filter((c) => !(c.industryId === ind.id && c.useCaseId === useCase.id && c.id === category.id))
        : [...prev, { ...category, industryId: ind.id as number, industryName: ind.title, useCaseId: useCase.id, useCaseName: useCase.title }];
      activeIndustryCategoriesRef.current = next;
      persistSelection(next.length ? "industry" : null, next.length ? next.map((c) => c.id).join(",") : null, {
        categoryIds: next.map((c) => c.id),
      });
      syncQueryString({
        categoryIds: [...activeParentsRef.current.map((p) => String(p.id)), ...next.map((c) => String(c.id))],
        clearSearch: true,
      });
      return next;
    });
  };

  const toggleUseCaseCategories = (ind: Industry, useCase: UseCase) => {
    if (ind.id == null) return;
    const categoriesUnderUseCase = useCase.parent_categories ?? [];
    if (!categoriesUnderUseCase.length) return;
    setActiveIndustryCategories((prev) => {
      const allSelected = categoriesUnderUseCase.every((cat) =>
        prev.some((c) => c.industryId === ind.id && c.useCaseId === useCase.id && c.id === cat.id)
      );
      const others = prev.filter((c) => !(c.industryId === ind.id && c.useCaseId === useCase.id));
      const next = allSelected
        ? others
        : [
          ...others,
          ...categoriesUnderUseCase.map((cat) => ({
            ...cat,
            industryId: ind.id as number,
            industryName: ind.title,
            useCaseId: useCase.id,
            useCaseName: useCase.title,
          })),
        ];
      activeIndustryCategoriesRef.current = next;
      persistSelection(next.length ? "industry" : null, next.length ? next.map((c) => c.id).join(",") : null, {
        categoryIds: next.map((c) => c.id),
      });
      syncQueryString({
        categoryIds: [...activeParentsRef.current.map((p) => String(p.id)), ...next.map((c) => String(c.id))],
        clearSearch: true,
      });
      return next;
    });
  };

  const toggleBrand = (brand: Brand) => {
    setActiveUseCaseId(null);
    activeUseCaseIdRef.current = null;
    setActiveBrands((prev) => {
      const exists = prev.some((b) => String(b.id) === String(brand.id));
      const next = exists ? prev.filter((b) => String(b.id) !== String(brand.id)) : [...prev, brand];
      activeBrandsRef.current = next;
      persistSelection(next.length ? "brand" : null, next.length ? next.map((b) => b.id).join(",") : null, {
        names: next.map((b) => b.name),
      });
      return next;
    });
    clearActiveSearch();
  };

  const toggleSize = (size: string) => {
    setActiveSizes((prev) => {
      const next = prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size];
      syncQueryString({ sizes: next, clearSearch: true });
      return next;
    });
  };

  const toggleColor = (color: string) => {
    setActiveColors((prev) => {
      const next = prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color];
      syncQueryString({ colors: next, clearSearch: true });
      return next;
    });
  };

  const toggleGender = (gender: string) => {
    setActiveGenders((prev) => {
      const next = prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender];
      syncQueryString({ genders: next, clearSearch: true });
      return next;
    });
  };

  const toggleFabric = (fabric: string) => {
    setActiveFabrics((prev) => {
      const next = prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric];
      syncQueryString({ fabrics: next, clearSearch: true });
      return next;
    });
  };

  const toggleInStock = () => {
    setInStockOnly((prev) => {
      const next = !prev;
      syncQueryString({ inStock: next, clearSearch: true });
      return next;
    });
  };

  const clearSizes = () => { setActiveSizes([]); syncQueryString({ sizes: [], clearSearch: true }); };
  const clearColors = () => { setActiveColors([]); syncQueryString({ colors: [], clearSearch: true }); };
  const clearGenders = () => { setActiveGenders([]); syncQueryString({ genders: [], clearSearch: true }); };
  const clearFabrics = () => { setActiveFabrics([]); syncQueryString({ fabrics: [], clearSearch: true }); };
  const clearBrands = () => { setActiveUseCaseId(null); activeUseCaseIdRef.current = null; setActiveBrands([]); };

  const handleSortChange = (value: SortOption["value"]) => {
    setSortBy(value);
    syncQueryString({ sort: value });
  };

  const commitPriceRange = (next: [number, number]) => {
    setPriceRange(next);
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => syncQueryString({ priceRange: next, clearSearch: true }), 350);
  };

  const handleMinPriceChange = (value: number) => {
    const clamped = Math.min(value, priceRange[1] - PRICE_STEP);
    commitPriceRange([Math.max(PRICE_MIN, clamped), priceRange[1]]);
  };

  const handleMaxPriceChange = (value: number) => {
    const clamped = Math.max(value, priceRange[0] + PRICE_STEP);
    commitPriceRange([priceRange[0], Math.min(PRICE_MAX, clamped)]);
  };

  const clearCategoryFacet = () => {
    setActiveParents([]);
    activeParentsRef.current = [];
    syncQueryString({
      categoryIds: activeIndustryCategoriesRef.current.map((c) => String(c.id)),
      clearSearch: true,
    });
    handleCategoryTabSelect({ id: null, name: "All", parent_categories: [] });
  };

  const clearIndustryFacet = () => {
    setActiveIndustryCategories([]);
    activeIndustryCategoriesRef.current = [];
    syncQueryString({
      categoryIds: activeParentsRef.current.map((p) => String(p.id)),
      clearSearch: true,
    });
    handleIndustrySelect({ id: null, title: "All", use_cases: [] });
  };

  const handleClearFilter = () => {
    clearAllFilterState();
    setViewMode("products");
    router.push("/categories?view=all", { scroll: false });
  };

  // ── Header search box ──
  // FIX: setViewMode("products") added below so that searching from a
  // fresh /categories picker-gate view immediately switches to the
  // product grid instead of leaving the gate rendered on screen while
  // results are fetched invisibly behind it. This is belt-and-braces —
  // the dedicated `urlSearch` -> viewMode effect above also guarantees
  // this even if this handler isn't the code path that set the URL
  // (e.g. Header.tsx's own <form> submit, which pushes the URL directly).
  const handleHeaderSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      if (typeof window === "undefined") return;
      const trimmed = value.trim();
      if (trimmed) {
        const emptyCategory: GrandCategory = { id: null, name: "All", parent_categories: [] };
        const emptyIndustry: Industry = { id: null, title: "All", use_cases: [] };
        setActiveCategory(emptyCategory);
        activeCategoryRef.current = emptyCategory;
        setActiveParents([]);
        activeParentsRef.current = [];
        setExpandedCategoryIds(new Set());
        setActiveIndustry(emptyIndustry);
        activeIndustryRef.current = emptyIndustry;
        setActiveIndustryCategories([]);
        activeIndustryCategoriesRef.current = [];
        setExpandedIndustryIds(new Set());
        setActiveBrands([]);
        activeBrandsRef.current = [];
        setActiveSizes([]);
        setActiveColors([]);
        setActiveGenders([]);
        setActiveFabrics([]);
        setInStockOnly(false);
        setPriceRange([PRICE_MIN, PRICE_MAX]);
        persistSelection(null, null);
        setViewMode("products"); // <-- FIX
        const sp = new URLSearchParams();
        sp.set("search", trimmed);
        if (sortByRef.current) sp.set("sort", sortByRef.current);
        router.push(`/categories?${sp.toString()}`, { scroll: false });
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete("search");
        router.push(`${url.pathname}?${url.searchParams.toString()}`.replace(/\?$/, ""), { scroll: false });
      }
    }, 400);
  };

  const clearHeaderSearch = () => {
    clearActiveSearch();
  };

  const handleTabHoverEnter = (cat: GrandCategory) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    const hasParents = !!cat.parent_categories && cat.parent_categories.length > 0;
    if (!hasParents) { setHoveredCatId("none"); return; }
    updateDropdownPos();
    setHoveredCatId(cat.id);
  };

  const handleTabHoverLeave = () => {
    hoverTimeout.current = setTimeout(() => setHoveredCatId("none"), 150);
  };

  const handleTabClick = (cat: GrandCategory) => {
    const hasParents = !!cat.parent_categories && cat.parent_categories.length > 0;
    if (hasParents) {
      updateDropdownPos();
      setHoveredCatId((prev) => (prev === cat.id ? "none" : cat.id));
      return;
    }
    handleCategoryTabSelect(cat);
  };

  const handleSubnavMouseEnter = () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  const handleSubnavMouseLeave = () => { hoverTimeout.current = setTimeout(() => setHoveredCatId("none"), 150); };

  // Keeps the dropdown pinned to the nav's bottom edge while it's open and
  // the page is still scrolling past the sticky global header (see
  // updateDropdownPos) — without this, a position measured once at hover
  // time would go stale mid-scroll and the panel would drift away from the
  // tabs it belongs to.
  useEffect(() => {
    if (hoveredCatId === "none") return;
    updateDropdownPos();
    window.addEventListener("scroll", updateDropdownPos, { passive: true });
    window.addEventListener("resize", updateDropdownPos);
    return () => {
      window.removeEventListener("scroll", updateDropdownPos);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [hoveredCatId, updateDropdownPos]);

  const headingLabel = urlSearch
    ? `Results for "${urlSearch}"`
    : activeParents.length
      ? activeParents.map((p) => p.title).join(", ")
      : activeCategory.name;
  const pills: Pill[] = [];
  if (urlSearch) pills.push({ key: "search", label: `"${urlSearch}"`, onRemove: clearHeaderSearch });
  if (activeCategory.id !== null && !activeParents.length) {
    pills.push({ key: "cat", label: activeCategory.name, onRemove: () => handleCategoryTabSelect({ id: null, name: "All", parent_categories: [] }) });
  }
  const seenCategoryPillIds = new Set<number>(); // a category can reach activeParents AND activeIndustryCategories (multiple use cases) — one pill per id
  activeParents.forEach((p) => {
    if (seenCategoryPillIds.has(p.id)) return;
    seenCategoryPillIds.add(p.id);
    pills.push({
      key: `parent-${p.grandId}-${p.id}`,
      label: p.title,
      onRemove: () => {
        const next = activeParents.filter((x) => !(x.grandId === p.grandId && x.id === p.id));
        setActiveParents(next);
        activeParentsRef.current = next;
        syncQueryString({
          categoryIds: [...next.map((x) => String(x.id)), ...activeIndustryCategories.map((c) => String(c.id))],
        });
      },
    });
  });
  if (activeIndustry.id !== null && !activeIndustryCategories.some((c) => c.industryId === activeIndustry.id)) {
    pills.push({ key: "industry", label: activeIndustry.title, onRemove: () => handleIndustrySelect({ id: null, title: "All", use_cases: [] }) });
  }
  activeIndustryCategories.forEach((c) => {
    if (seenCategoryPillIds.has(c.id)) return; // same category can belong to multiple use cases — show one pill
    seenCategoryPillIds.add(c.id);
    pills.push({
      key: `indcat-${c.id}`,
      label: c.title,
      onRemove: () => {
        const next = activeIndustryCategories.filter((x) => x.id !== c.id);
        setActiveIndustryCategories(next);
        activeIndustryCategoriesRef.current = next;
        syncQueryString({
          categoryIds: [...activeParents.map((p) => String(p.id)), ...next.map((x) => String(x.id))],
        });
      },
    });
  });
  activeBrands.forEach((b) => pills.push({ key: `brand-${b.id}`, label: b.name, onRemove: () => toggleBrand(b) }));
  activeSizes.forEach((s) => pills.push({ key: `size-${s}`, label: `Size: ${s}`, onRemove: () => toggleSize(s) }));
  activeColors.forEach((c) => pills.push({ key: `color-${c}`, label: c, onRemove: () => toggleColor(c) }));
  activeGenders.forEach((g) => pills.push({ key: `gender-${g}`, label: g, onRemove: () => toggleGender(g) }));
  activeFabrics.forEach((f) => pills.push({ key: `fabric-${f}`, label: f, onRemove: () => toggleFabric(f) }));
  if (inStockOnly) pills.push({ key: "instock", label: "In stock", onRemove: toggleInStock });
  if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) {
    pills.push({ key: "price", label: `$${priceRange[0]}–$${priceRange[1]}`, onRemove: () => commitPriceRange([PRICE_MIN, PRICE_MAX]) });
  }
  const totalFacetCount =
    (activeCategory.id !== null && !activeParents.length ? 1 : 0) + seenCategoryPillIds.size +
    (activeIndustry.id !== null && !activeIndustryCategories.some((c) => c.industryId === activeIndustry.id) ? 1 : 0) +
    activeBrands.length + activeSizes.length +
    activeColors.length + activeGenders.length + activeFabrics.length + (inStockOnly ? 1 : 0) +
    (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0);
  const otherCategoryTabs = categories.filter((c) => c.id !== null);
  const isAllActive = activeCategory.id === null && !activeParents.length;
  const currentSortLabel = allSortOptions.find((o) => o.value === sortBy)?.label ?? "Popularity";
  const hoveredCat = hoveredCatId !== "none" ? categories.find((c) => c.id === hoveredCatId) : null;
  const hoveredCatParents = hoveredCat?.parent_categories ?? [];
  const subnavVisible = !!hoveredCat && hoveredCatParents.length > 0;

  return {
    products, total_products, productLoading, productGridLoading, initialLoading, page,
    categories, industries, industriesLoading, brandList, brandLoading,
    activeCategory, activeParents, expandedCategoryIds,
    activeIndustry, activeIndustryCategories, expandedIndustryIds, collapsedUseCaseIds,
    activeBrands, activeSizes, activeColors, activeGenders, activeFabrics,
    inStockOnly, priceRange, sortBy,
    sidebarOpen, setSidebarOpen,
    openSections, toggleSection,
    viewMode, pickerIndustryId, setPickerIndustryId, selectedUseCase, cameFromGate,
    handleSelectUseCase, handleSkipGate, handleBackToUseCases,
    hoveredCatId, tabRefs, catNavRef, dropdownPos, brandMenuOpen, setBrandMenuOpen,
    handleTabHoverEnter, handleTabHoverLeave, handleTabClick,
    handleSubnavMouseEnter, handleSubnavMouseLeave,
    hoveredCat, hoveredCatParents, subnavVisible,
    searchInput, handleHeaderSearchChange, clearHeaderSearch,
    headingLabel, pills, totalFacetCount, otherCategoryTabs, isAllActive, currentSortLabel,
    allSortOptions,
    handleCategoryTabSelect, toggleCategoryExpand, toggleSubCategory,
    handleIndustrySelect, toggleIndustryExpand, toggleUseCaseExpand,
    toggleIndustryCategory, toggleUseCaseCategories,
    toggleBrand, toggleSize, toggleColor, toggleGender, toggleFabric, toggleInStock,
    handleSortChange, handleMinPriceChange, handleMaxPriceChange, commitPriceRange,
    handleClearFilter,
    clearSizes, clearColors, clearGenders, clearFabrics, clearBrands,
    clearCategoryFacet, clearIndustryFacet,
  };
}