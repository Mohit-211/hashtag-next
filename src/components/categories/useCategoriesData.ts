"use client";
import { useCallback, useRef, useState } from "react";
import { AllProductsApi, ProductCategoryApi, IndustryApi } from "@/api/operations/product.api";
import { GetAllBrandsApi } from "@/api/operations/brand.api";

import type { ProductApiResponse, ProductCategoryApiResponse } from "@/data/typesproduct";
import { CATEGORY_LIMIT, INDUSTRY_LIMIT, LOAD_MORE_LIMIT } from "@/data/constants";
import { buildFilterParams } from "@/lib/utils";
import type { Brand, FilterParams, GrandCategory, Industry } from "@/data/types";


/** Owns the three initial data loads (brands, categories, industries) and
 * the unified product fetch — every facet goes through AllProductsApi. */
export function useCategoriesData() {
  const [products, setProducts] = useState<any[]>([]);
  const [total_products, setTotalProducts] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  const [productGridLoading, setProductGridLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [categories, setCategories] = useState<GrandCategory[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  const hasMoreRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchBrands = useCallback(async () => {
    try {
      setBrandLoading(true);
      const res = await GetAllBrandsApi(1, 1000);
      const raw: any[] = Array.isArray(res?.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      const formatted: Brand[] = raw.map((b: any) => ({
        id: b?.id,
        name: b?.name ?? b?.brand_name ?? "",
        slug: b?.slug ?? "",
        logo: b?.logo_url ?? null,
        count: b?.product_count ?? b?.count ?? undefined,
      }));
      setBrandList(formatted);
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setBrandLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res: ProductCategoryApiResponse = await ProductCategoryApi({ page: 1, limit: CATEGORY_LIMIT });
      const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
      const formatted: GrandCategory[] = raw.map((cat: any) => ({
        id: cat.id,
        name: cat.title ?? cat.name ?? cat.category_name ?? "",
        slug: cat.slug ?? "",
        count: cat.product_count ?? cat.count ?? undefined,
        parent_categories: Array.isArray(cat.parent_categories)
          ? cat.parent_categories.map((p: any) => ({
              id: p.id,
              title: p.title ?? p.name ?? "",
              slug: p.slug ?? "",
              count: p.product_count ?? p.count ?? undefined,
            }))
          : [],
      }));
      setCategories([{ id: null, name: "All", parent_categories: [] }, ...formatted]);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchIndustries = useCallback(async () => {
    try {
      setIndustriesLoading(true);
      const res = await IndustryApi({ page: 1, limit: INDUSTRY_LIMIT });
      const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
      const formatted: Industry[] = raw.map((ind: any) => ({
        id: ind.id,
        title: ind.title ?? ind.name ?? "",
        slug: ind.slug ?? "",
        description: ind.description ?? "",
        count: ind.product_count ?? ind.count ?? undefined,
        use_cases: Array.isArray(ind.use_cases)
          ? ind.use_cases
              .filter((uc: any) => uc?.is_active !== false)
              .map((uc: any) => ({
                id: uc.id,
                title: uc.title ?? uc.name ?? "",
                image:uc.image,
                slug: uc.slug ?? "",
                sort_order: uc.sort_order,
                is_active: uc.is_active,
                count: uc.product_count ?? uc.count ?? undefined,
                parent_categories: Array.isArray(uc.parent_categories)
                  ? uc.parent_categories.map((p: any) => ({
                      id: p.id,
                      title: p.title ?? p.name ?? "",
                      slug: p.slug ?? "",
                      count: p.product_count ?? p.count ?? undefined,
                    }))
                  : [],
              }))
          : [],
      }));
      setIndustries(formatted);
    } catch (err) {
      console.error("Error fetching industries:", err);
    } finally {
      setIndustriesLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(
    async (pageNumber: number, isLoadMore: boolean, filters: Omit<FilterParams, "page" | "limit">) => {
      const thisFetchId = ++fetchIdRef.current;
      try {
        setProductLoading(true);
        const params = buildFilterParams({ page: pageNumber, limit: LOAD_MORE_LIMIT, ...filters });
        const res: ProductApiResponse = await AllProductsApi(params);
        if (thisFetchId !== fetchIdRef.current) return;
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        setProducts((prev) => (isLoadMore ? [...prev, ...raw] : raw));
        setTotalProducts(res?.data?.data?.pagination?.total ?? 0);
        const more = raw.length === LOAD_MORE_LIMIT;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        if (thisFetchId === fetchIdRef.current) {
          setProductLoading(false);
          setProductGridLoading(false);
          setInitialLoading(false);
        }
      }
    },
    []
  );

  return {
    products,
    total_products,
    productLoading,
    productGridLoading,
    initialLoading,
    hasMore,
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
  };
}