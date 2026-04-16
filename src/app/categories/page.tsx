"use client";

import { useState, useEffect } from "react";

import CategoryHeader from "@/components/categories/CategoryHeader";
import CategoryBanner from "@/components/categories/CategoryBanner";
import CategoryFilterBar from "@/components/categories/CategoryFilterBar";
import ProductGrid from "@/components/categories/ProductGrid";
import LoadMoreButton from "@/components/categories/LoadMoreButton";
import EmptyProducts from "@/components/categories/EmptyProducts";

import { sortOptions } from "@/data/products";

import {
  AllProductsApi,
  ProductCategoryApi,
} from "@/api/operations/product.api";

const ITEMS_PER_PAGE = 8;

export default function Categories() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [productLoading, setProductLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const loading = productLoading || categoryLoading;

  const [activeCategory, setActiveCategory] = useState<any>({
    id: null,
    name: "All",
  });

  const [sortBy, setSortBy] = useState<string>("popular");
  const [sortOpen, setSortOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  // ✅ Fetch categories on load
  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Fetch products on category change
  useEffect(() => {
    fetchProducts();
  }, [activeCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setProductLoading(true);

      const params =
        activeCategory?.id !== null
          ? { category_id: activeCategory.id }
          : {};


      const res = await AllProductsApi(params);

      const productData =
        res?.data?.data ||
        res?.data?.products ||
        res?.data ||
        [];

      let sorted = [...productData];

      if (sortBy === "price-asc") {
        sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      }

      if (sortBy === "price-desc") {
        sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      }

      setProducts(sorted);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
    } finally {
      setProductLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const res = await ProductCategoryApi();

      const categoryData = res?.data?.data?.rows || [];

      const formattedCategories = [
        { id: null, name: "All" },
        ...categoryData.map((cat: any) => ({
          id: cat.id,
          name: cat.name || cat.category_name || cat.title,
        })),
      ];

      setCategories(formattedCategories);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeCategory, sortBy]);

  const paginated = products.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page * ITEMS_PER_PAGE < products.length;

  if (loading) {
    return (
      <p className="text-center py-20 text-lg">
        Loading products...
      </p>
    );
  }
console.log(paginated,"paginated")
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
            sortOptions={sortOptions}
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
              <ProductGrid products={paginated} />
              <LoadMoreButton
                hasMore={hasMore}
                onLoadMore={() => setPage((prev) => prev + 1)}
              />
            </>
          ) : (
            <EmptyProducts
              reset={() =>
                setActiveCategory({ id: null, name: "All" })
              }
            />
          )}
        </div>
      </section>
    </>
  );
}