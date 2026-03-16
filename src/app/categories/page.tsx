"use client";

import { useState, useMemo, useEffect } from "react";

import CategoryHeader from "@/components/categories/CategoryHeader";
import CategoryBanner from "@/components/categories/CategoryBanner";
import CategoryFilterBar from "@/components/categories/CategoryFilterBar";
import ProductGrid from "@/components/categories/ProductGrid";
import LoadMoreButton from "@/components/categories/LoadMoreButton";
import EmptyProducts from "@/components/categories/EmptyProducts";

import { products, subcategories, sortOptions } from "@/data/products";

const ITEMS_PER_PAGE = 8;

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, sortBy]);

  const filtered = useMemo(() => {
    let items = [...products];

    if (activeCategory !== "All") {
      items = items.filter((p) => p.category === activeCategory);
    }

    if (sortBy === "price-asc") {
      items.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-desc") {
      items.sort((a, b) => b.price - a.price);
    }

    return items;
  }, [activeCategory, sortBy]);

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page * ITEMS_PER_PAGE < filtered.length;

  return (
    <>
      <CategoryHeader category={activeCategory} />

      <CategoryBanner />

      <section className="pb-6">
        <div className="container">
          <CategoryFilterBar
            subcategories={subcategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            sortOptions={sortOptions}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOpen={sortOpen}
            setSortOpen={setSortOpen}
            filteredCount={filtered.length}
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          {filtered.length > 0 ? (
            <>
              <ProductGrid products={paginated} />

              <LoadMoreButton
                hasMore={hasMore}
                onLoadMore={() => setPage((prev) => prev + 1)}
              />
            </>
          ) : (
            <EmptyProducts reset={() => setActiveCategory("All")} />
          )}
        </div>
      </section>
    </>
  );
}
