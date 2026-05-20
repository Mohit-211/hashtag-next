"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AllProductsApi } from "@/api/operations/product.api";
import ProductGrid from "../categories/ProductGrid";

interface Product {
  attachments?: {
    file_uri: string;
  }[];
  id: number | string;
  _id?: string;
  name: string;
  price: number;
  original_price?: number;
  rating?: number;
  review_count?: number;
  is_assured?: boolean;
  is_sponsored?: boolean;
  is_hot_deal?: boolean;
  variant_label?: string;
  customizable?: boolean;
}

const ITEMS_PER_PAGE = 6;

export default function RelatedProducts({
  category_id,
}: {
  category_id: string | null;
}) {
  console.log(category_id,"category_id")
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!category_id) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await AllProductsApi({
          category_id,
          limit: 50,
        });

        const data = res?.data?.data?.data || [];

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

  const currentProducts = products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top:
        document.getElementById("related-products")?.offsetTop ?? 0,
      behavior: "smooth",
    });
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    const pages: (number | "...")[] = [];

    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(
        1,
        "...",
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }

    return pages;
  };

  return (
    <div
      id="related-products"
      className="mt-16 pt-10 border-t border-[#ece8e2]"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4a7a58] mb-2">
            <span className="w-3 h-px bg-[#4a7a58] inline-block" />
            Related
          </span>

          <h2 className="font-heading text-2xl font-bold text-[#1a2e1f]">
            You Might Also Like
          </h2>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="w-9 h-9 rounded-xl border border-[#dde8df] bg-white flex items-center justify-center transition-all hover:bg-[#2d4a35] hover:border-[#2d4a35] hover:text-white text-[#4a7a58] disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-[#8fa989] tabular-nums px-1">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-9 h-9 rounded-xl border border-[#dde8df] bg-white flex items-center justify-center transition-all hover:bg-[#2d4a35] hover:border-[#2d4a35] hover:text-white text-[#4a7a58] disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-[#ece8e2] bg-white"
            >
              <div className="aspect-square bg-[#f0ede8] animate-pulse" />

              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-[#e8e4df] rounded-full animate-pulse w-3/4" />
                <div className="h-3.5 bg-[#e8e4df] rounded-full animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#e8f0ea] flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🌿</span>
          </div>

          <p className="text-[#8fa989] text-sm font-medium">
            No related products found.
          </p>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <ProductGrid products={currentProducts} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <button
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-3 rounded-xl border border-[#dde8df] bg-white text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-[#f0f6f1] hover:border-[#4a7a58] hover:text-[#2d4a35] text-[#6b8070] disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="h-9 w-9 flex items-center justify-center text-[#8fa989] text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goTo(page as number)}
                    aria-current={
                      currentPage === page ? "page" : undefined
                    }
                    className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      currentPage === page
                        ? "bg-[#2d4a35] text-white border border-[#2d4a35] shadow-md shadow-[#2d4a35]/20"
                        : "border border-[#dde8df] bg-white text-[#6b8070] hover:border-[#4a7a58] hover:text-[#2d4a35] hover:bg-[#f0f6f1]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-3 rounded-xl border border-[#dde8df] bg-white text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-[#f0f6f1] hover:border-[#4a7a58] hover:text-[#2d4a35] text-[#6b8070] disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Count */}
          <p className="text-center text-xs text-[#8fa989] font-medium mt-4">
            Showing {startIndex + 1}–
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              products.length
            )}{" "}
            of {products.length} items
          </p>
        </>
      )}
    </div>
  );
}