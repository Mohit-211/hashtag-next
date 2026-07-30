"use client";
import ProductGrid from "@/components/categories/ProductGrid";
import EmptyProducts from "@/components/categories/EmptyProducts";

interface ProductsAreaProps {
  products: any[];
  productGridLoading: boolean;
  productLoading: boolean;
  page: number;
  onResetFilters: () => void;
}

/** Product grid area: shows the grid (dimmed while a full refetch is in
 * flight), an infinite-scroll "loading more" row, a full loading state when
 * there are no products yet, or the empty state. */
export default function ProductsArea({
  products,
  productGridLoading,
  productLoading,
  page,
  onResetFilters,
}: ProductsAreaProps) {
  return (
    <div className="products-area">
      {products.length > 0 ? (
        <>
          <div
            style={{
              opacity: productGridLoading ? 0.4 : 1,
              transition: "opacity .15s ease",
              pointerEvents: productGridLoading ? "none" : "auto",
            }}
          >
            <ProductGrid products={products} />
          </div>
          {productLoading && page > 1 && !productGridLoading && (
            <div className="products-load-more"><div className="spinner" /> Loading more products…</div>
          )}
        </>
      ) : productGridLoading ? (
        <div className="grid-loading"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : (
        <EmptyProducts reset={onResetFilters} />
      )}
    </div>
  );
}
