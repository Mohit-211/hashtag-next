"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import CategoryHeader from "@/components/categories/CategoryHeader";
import CategoryBanner from "@/components/categories/CategoryBanner";
import CategoryFilterBar from "@/components/categories/CategoryFilterBar";
import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";

import { sortOptions } from "@/data/products";
import { AllProductsApi, ProductCategoryApi } from "@/api/operations/product.api";
import type {
  Category,
  Product,
  SortOption,
  ProductApiResponse,
  ProductCategoryApiResponse,
} from "@/data/typesproduct";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_LIMIT = 15;
const LOAD_MORE_LIMIT = 15;

// ─────────────────────────────────────────────────────────────────────────────

export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productLoading, setProductLoading] = useState<boolean>(true);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(true);

  const [activeCategory, setActiveCategory] = useState<Category>({
    id: null,
    name: "All",
  });

  const [sortBy, setSortBy] = useState<SortOption["value"]>("popular");
  const [sortOpen, setSortOpen] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Refs to avoid stale closures in the scroll handler
  const pageRef = useRef<number>(1);
  const fetchingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);
  const productLoadingRef = useRef<boolean>(true);

  // Keep latest category/sort accessible inside scroll handler without re-binding
  const activeCategoryRef = useRef<Category>(activeCategory);
  const sortByRef = useRef<SortOption["value"]>(sortBy);

  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);

  const loading = productLoading || categoryLoading;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Page 1 → 10 items for a fast first paint. Page 2+ → 20 items. */
const getLimitForPage = (pageNumber: number): number =>
  pageNumber === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT;

  const sortProducts = (
    data: Product[],
    sort: SortOption["value"]
  ): Product[] => {
    const copy = [...data];
    if (sort === "price-asc")
      return copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sort === "price-desc")
      return copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return copy;
  };

  // ─── Fetch Categories ──────────────────────────────────────────────────────

  const fetchCategories = async (): Promise<void> => {
    try {
      setCategoryLoading(true);

      const res: ProductCategoryApiResponse = await ProductCategoryApi({
        page: 1,
        limit: 5,
      });

      const raw = Array.isArray(res?.data?.data?.data)
        ? res.data.data.data
        : [];

      const formatted: Category[] = [
        { id: null, name: "All" },
        ...raw.map((cat) => ({
          id: cat.id,
          name: cat.name ?? cat.category_name ?? cat.title ?? "Unnamed",
        })),
      ];

      setCategories(formatted);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([{ id: null, name: "All" }]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // ─── Fetch Products ────────────────────────────────────────────────────────

  const fetchProducts = useCallback(
    async (
      pageNumber: number,
      isLoadMore: boolean,
      category: Category,
      sort: SortOption["value"]
    ): Promise<void> => {
      try {
        setProductLoading(true);
        productLoadingRef.current = true;

        const limit = getLimitForPage(pageNumber);

        const res: ProductApiResponse = await AllProductsApi({
          page: pageNumber,
          limit,
          ...(category.id !== null && { category_id: category.id }),
        });

        const raw = Array.isArray(res?.data?.data?.data)
          ? res.data.data.data
          : [];

        const sorted = sortProducts(raw, sort);

        setProducts((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));

        // Compare against the limit used for this specific page
        const more = raw.length === limit;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch (error) {
        console.error("Error fetching products:", error);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        setProductLoading(false);
        productLoadingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ─── Initial Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, []);

  // ─── Reset on filter / sort change ────────────────────────────────────────

  useEffect(() => {
    pageRef.current = 1;
    setPage(1);
    setProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchProducts(1, false, activeCategory, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sortBy]);

  // ─── Infinite Scroll ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleScroll = async (): Promise<void> => {
      if (
        fetchingRef.current ||
        !hasMoreRef.current ||
        productLoadingRef.current
      )
        return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        fetchingRef.current = true;

        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);

        await fetchProducts(
          nextPage,
          true,
          activeCategoryRef.current,
          sortByRef.current
        );

        fetchingRef.current = false;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts]);

  // ─── Skeleton UI ──────────────────────────────────────────────────────────

  if (loading && products.length === 0) {
    return (
      <>
        <section className="pt-12 pb-6">
          <div className="container max-w-4xl space-y-3">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-9 w-56 bg-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-muted rounded animate-pulse" />
          </div>
        </section>

        <section className="pb-8">
          <div className="container">
            <div className="w-full h-44 rounded-2xl bg-muted animate-pulse" />
          </div>
        </section>

        <section className="pb-20">
          <div className="container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border">
                <div className="aspect-square bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────

  return (
    <>
      <CategoryHeader category={activeCategory.name} />
      <CategoryBanner />

      <section className="pb-6">
        <div className="container">
          <CategoryFilterBar
            subcategories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            sortOptions={sortOptions as SortOption[]}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOpen={sortOpen}
            setSortOpen={setSortOpen}
            filteredCount={products.length}
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} />

              {productLoading && page > 1 && (
                <div className="flex justify-center items-center gap-2 py-8 text-sm text-muted-foreground">
                  <span className="h-4 w-4 rounded-full border-2 border-[#2d4a35] border-t-transparent animate-spin" />
                  Loading more products…
                </div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  You've seen all {products.length} products
                </div>
              )}
            </>
          ) : (
            <EmptyProducts
              reset={() => setActiveCategory({ id: null, name: "All" })}
            />
          )}
        </div>
      </section>
    </>
  );
}