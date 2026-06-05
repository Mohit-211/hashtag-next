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

        const rawData = Array.isArray(res?.data?.data?.data)
          ? res.data.data.data
          : [];

        const formattedData = rawData.map(
          (item: Product, index: number) => ({
            ...item,
            id: item.id || item._id || index,
          })
        );

        setProducts(formattedData);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching related products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category_id]);

  const totalPages =
    products.length > 0
      ? Math.ceil(products.length / ITEMS_PER_PAGE)
      : 0;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentProducts = products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    if (typeof window !== "undefined") {
      window.scrollTo({
        top:
          document.getElementById("related-products")?.offsetTop ??
          0,
        behavior: "smooth",
      });
    }
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  return (
    <section
      id="related-products"
      className="mt-16 pt-10 border-t border-[#E5E5E5]"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#CFAF2E] mb-2">
            <span className="w-4 h-px bg-[#CFAF2E]" />
            Related Products
          </span>

          <h2 className="text-2xl font-bold text-[#111111]">
            You Might Also Like
          </h2>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="
                w-10 h-10
                border border-[#E5E5E5]
                bg-white
                flex items-center justify-center
                text-[#111111]
                transition-all duration-200
                hover:bg-[#F8F5E7]
                hover:border-[#E8D03A]
                disabled:opacity-40
                disabled:pointer-events-none
              "
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-semibold text-[#6B7280]">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="
                w-10 h-10
                border border-[#E5E5E5]
                bg-white
                flex items-center justify-center
                text-[#111111]
                transition-all duration-200
                hover:bg-[#F8F5E7]
                hover:border-[#E8D03A]
                disabled:opacity-40
                disabled:pointer-events-none
              "
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-[#E5E5E5] bg-white overflow-hidden"
            >
              <div className="aspect-square bg-[#F5F5F5] animate-pulse" />

              <div className="p-4 space-y-3">
                <div className="h-3 bg-[#EFEFEF] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-[#EFEFEF] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[#6B7280]">
            No related products found.
          </p>
        </div>
      ) : (
        <>
          <ProductGrid products={currentProducts} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
                className="
                  h-10 px-4
                  border border-[#E5E5E5]
                  bg-white
                  text-[#111111]
                  text-sm font-semibold
                  flex items-center gap-2
                  transition-all duration-200
                  hover:bg-[#F8F5E7]
                  hover:border-[#E8D03A]
                  disabled:opacity-40
                  disabled:pointer-events-none
                "
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="h-10 w-10 flex items-center justify-center text-[#999]"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => goTo(page)}
                    aria-current={
                      currentPage === page ? "page" : undefined
                    }
                    className={`h-10 w-10 text-sm font-semibold transition-all duration-200 ${
                      currentPage === page
                        ? "bg-[#111111] text-[#E8D03A] border border-[#111111]"
                        : "bg-white text-[#111111] border border-[#E5E5E5] hover:bg-[#F8F5E7] hover:border-[#E8D03A]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="
                  h-10 px-4
                  border border-[#E5E5E5]
                  bg-white
                  text-[#111111]
                  text-sm font-semibold
                  flex items-center gap-2
                  transition-all duration-200
                  hover:bg-[#F8F5E7]
                  hover:border-[#E8D03A]
                  disabled:opacity-40
                  disabled:pointer-events-none
                "
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Count */}
          <p className="text-center text-sm text-[#6B7280] mt-4">
            Showing {startIndex + 1}–
            {Math.min(
              startIndex + ITEMS_PER_PAGE,
              products.length
            )}{" "}
            of{" "}
            <span className="font-semibold text-[#111111]">
              {products.length}
            </span>{" "}
            items
          </p>
        </>
      )}
    </section>
  );
}