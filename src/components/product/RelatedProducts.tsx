"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import { AllProductsApi } from "@/api/operations/product.api";

interface Product {
  attachments: any;
  id: any;
  _id: string;
  name: string;
  price: number;
  images: string[];
  customizable?: boolean;
}

const ITEMS_PER_PAGE = 6;

export default function RelatedProducts({
  category_id,
}: {
  category_id: string | null;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!category_id) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await AllProductsApi({ category_id, limit: 10 });
        const data = res?.data?.data?.data
        setProducts(data);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category_id]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = products?.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Build page number range with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a7a58] mb-1">
            Related
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            You Might Also Like
          </h2>
        </div>

        {/* Prev / Next quick nav */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center transition-all hover:bg-[#2d4a35] hover:border-[#2d4a35] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center transition-all hover:bg-[#2d4a35] hover:border-[#2d4a35] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols- gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No related products found.
        </div>
      ) : (
        <>
          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-5">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                image={product.attachments?.[0]?.file_uri}
                name={product.name}
                price={product.price}
                customizable={product.customizable ?? true}
                productId={Number(product.id)}
              />
            ))}
          </div>

          {/* Full pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              {/* Prev */}
              <button
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous"
                className="h-9 px-3 rounded-lg border border-border text-sm font-medium flex items-center gap-1 transition-all hover:bg-[#e8f0ea] hover:border-[#4a7a58] hover:text-[#2d4a35] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="h-9 w-9 flex items-center justify-center text-muted-foreground text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goTo(page as number)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-[#2d4a35] text-white border border-[#2d4a35]"
                        : "border border-border hover:border-[#4a7a58] hover:text-[#2d4a35] hover:bg-[#e8f0ea]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next"
                className="h-9 px-3 rounded-lg border border-border text-sm font-medium flex items-center gap-1 transition-all hover:bg-[#e8f0ea] hover:border-[#4a7a58] hover:text-[#2d4a35] disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Result count */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, products.length)} of {products.length} products
          </p>
        </>
      )}
    </div>
  );
}