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
const CATEGORY_LIMIT = 15;

// ─── Skeleton shimmer style ───────────────────────────────────────────────────
const skeletonStyle = `
  @keyframes cat-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .cat-skeleton {
    background: linear-gradient(90deg, #f4f4f5 25%, #ebebeb 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: cat-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  .cat-skeleton-round {
    background: linear-gradient(90deg, #f4f4f5 25%, #ebebeb 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: cat-shimmer 1.4s ease-in-out infinite;
    border-radius: 999px;
  }
  .cat-product-skeleton {
    background: linear-gradient(90deg, #f4f4f5 25%, #ebebeb 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: cat-shimmer 1.6s ease-in-out infinite;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  .cat-load-more-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #e4e4e7;
    border-top-color: #18181b;
    animation: cat-spin 0.75s linear infinite;
  }
  @keyframes cat-spin {
    to { transform: rotate(360deg); }
  }
  .cat-grid-fade-in {
    animation: cat-fade-in 0.3s ease-out both;
  }
  @keyframes cat-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Skeleton subcomponents ────────────────────────────────────────────────────
function HeaderSkeleton() {
  return (
    <section style={{ paddingTop: "48px", paddingBottom: "24px" }}>
      <style>{skeletonStyle}</style>
      <div className="container" style={{ maxWidth: "896px" }}>
        <div className="cat-skeleton" style={{ height: "11px", width: "72px", marginBottom: "14px" }} />
        <div className="cat-skeleton" style={{ height: "34px", width: "220px", marginBottom: "12px", borderRadius: "10px" }} />
        <div className="cat-skeleton" style={{ height: "14px", width: "300px" }} />
      </div>
    </section>
  );
}

function BannerSkeleton() {
  return (
    <section style={{ paddingBottom: "28px" }}>
      <div className="container">
        <div className="cat-skeleton" style={{ width: "100%", height: "168px", borderRadius: "20px" }} />
      </div>
    </section>
  );
}

function FilterBarSkeleton() {
  return (
    <section style={{ paddingBottom: "20px" }}>
      <div className="container" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[72, 88, 64, 96, 80, 76].map((w, i) => (
          <div
            key={i}
            className="cat-skeleton-round"
            style={{ height: "32px", width: `${w}px`, flexShrink: 0, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </section>
  );
}

function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
      }}
      className="md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="cat-product-skeleton"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div style={{ paddingBottom: "100%", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "inherit" }} />
          </div>
          <div style={{ padding: "12px" }}>
            <div className="cat-skeleton" style={{ height: "11px", width: "70%", marginBottom: "8px", borderRadius: "4px" }} />
            <div className="cat-skeleton" style={{ height: "11px", width: "40%", borderRadius: "4px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Categories() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [productGridLoading, setProductGridLoading] = useState<boolean>(false);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);

  const [categoryPage, setCategoryPage] = useState<number>(1);
  const [hasMoreCategories, setHasMoreCategories] = useState<boolean>(true);
  const [categorySearch, setCategorySearch] = useState<string>("");

  const [activeCategory, setActiveCategory] = useState<Category>({ id: null, name: "All" });
  const [sortBy, setSortBy] = useState<SortOption["value"]>("popular");
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const pageRef = useRef<number>(1);
  const fetchingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);
  const productLoadingRef = useRef<boolean>(false);
  const activeCategoryRef = useRef<Category>(activeCategory);
  const sortByRef = useRef<SortOption["value"]>(sortBy);
  const categorySearchAbortRef = useRef<AbortController | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);
  const categorySearchInitRef = useRef<boolean>(false);
  const filterInitRef = useRef<boolean>(false);

  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);

  const getLimitForPage = (pageNumber: number): number =>
    pageNumber === 1 ? INITIAL_LIMIT : LOAD_MORE_LIMIT;

  const sortProducts = (data: Product[], sort: SortOption["value"]): Product[] => {
    const copy = [...data];
    if (sort === "price-asc") return copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    if (sort === "price-desc") return copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    return copy;
  };

  const fetchCategories = useCallback(
    async (pageNumber: number, isLoadMore: boolean, search: string): Promise<void> => {
      categorySearchAbortRef.current?.abort();
      const controller = new AbortController();
      categorySearchAbortRef.current = controller;
      try {
        setCategoryLoading(true);
        const res: ProductCategoryApiResponse = await ProductCategoryApi({ page: pageNumber, limit: CATEGORY_LIMIT, search });
        if (controller.signal.aborted) return;
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const formatted: Category[] = raw.map((cat) => ({
          id: cat.id,
          name: cat.name ?? cat.category_name ?? cat.title ?? "Unnamed",
        }));
        setCategories((prev) =>
          isLoadMore ? [...prev, ...formatted] : [{ id: null, name: "All" }, ...formatted]
        );
        setHasMoreCategories(raw.length === CATEGORY_LIMIT);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === "AbortError") return;
        console.error("Error fetching categories:", error);
        if (!isLoadMore) setCategories([{ id: null, name: "All" }]);
        setHasMoreCategories(false);
      } finally {
        if (!controller.signal.aborted) setCategoryLoading(false);
      }
    },
    []
  );

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
        const raw = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const sorted = sortProducts(raw, sort);
        setProducts((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));
        const more = raw.length === limit;
        setHasMore(more);
        hasMoreRef.current = more;
      } catch (error) {
        console.error("Error fetching products:", error);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        setProductLoading(false);
        setProductGridLoading(false);
        productLoadingRef.current = false;
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
          setInitialLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    Promise.all([
      fetchCategories(1, false, ""),
      fetchProducts(1, false, { id: null, name: "All" }, "popular"),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categorySearchInitRef.current) { categorySearchInitRef.current = true; return; }
    setCategoryPage(1);
    fetchCategories(1, false, categorySearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySearch]);

  useEffect(() => {
    if (!filterInitRef.current) { filterInitRef.current = true; return; }
    pageRef.current = 1;
    setPage(1);
    setProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    setProductGridLoading(true);
    fetchProducts(1, false, activeCategory, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sortBy]);

  useEffect(() => {
    const handleScroll = async (): Promise<void> => {
      if (fetchingRef.current || !hasMoreRef.current || productLoadingRef.current) return;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= fullHeight - 200) {
        fetchingRef.current = true;
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        await fetchProducts(nextPage, true, activeCategoryRef.current, sortByRef.current);
        fetchingRef.current = false;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchProducts]);

  const handleLoadMoreCategories = useCallback((): void => {
    const nextPage = categoryPage + 1;
    setCategoryPage(nextPage);
    fetchCategories(nextPage, true, categorySearch);
  }, [categoryPage, categorySearch, fetchCategories]);

  // ─── Full-page skeleton ────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <>
        <style>{skeletonStyle}</style>
        <HeaderSkeleton />
        <BannerSkeleton />
        <FilterBarSkeleton />
        <section style={{ paddingBottom: "80px" }}>
          <div className="container">
            <ProductGridSkeleton count={8} />
          </div>
        </section>
      </>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{skeletonStyle}</style>

      <CategoryHeader category={activeCategory.name} />
      <CategoryBanner />

      <section style={{ paddingBottom: "20px" }}>
        <div className="container">
          <CategoryFilterBar
            subcategories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            sortOptions={sortOptions as SortOption[]}
            sortOpen={sortOpen}
            setSortOpen={setSortOpen}
            filteredCount={products.length}
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            hasMoreCategories={hasMoreCategories}
            onLoadMoreCategories={handleLoadMoreCategories}
            categoryLoading={categoryLoading}
          />
        </div>
      </section>

      <section style={{ paddingBottom: "80px" }}>
        <div className="container">
          {productGridLoading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="cat-grid-fade-in">
              <ProductGrid products={products} />
              {productLoading && page > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    padding: "32px 0",
                    fontSize: "13px",
                    color: "#a1a1aa",
                  }}
                >
                  <div className="cat-load-more-spinner" />
                  Loading more products…
                </div>
              )}
            </div>
          ) : (
            <EmptyProducts reset={() => setActiveCategory({ id: null, name: "All" })} />
          )}
        </div>
      </section>
    </>
  );
}