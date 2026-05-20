"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";

import {
  ProductDetailApi,
  ProductDetailGuestApi,
} from "@/api/operations/product.api";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Size {
  id: number;
  name: string;
  measurements?: string;
}

interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}

interface Variant {
  id: number;
  product_id: number;
  sku: string;
  color: string;
  color_code: string;
  size: string;
  size_id: number;
  price: string;
  stock: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  is_active: boolean;
  is_in_cart?: boolean;
  is_in_wishlist?: boolean;
  wishlist_id?: number | null;
  images: VariantImage[];
  size_details: Size;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  sizes: Size[];
  attachments: any;
  categories: any;
  variants: Variant[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<Variant | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  /* ── Fetch ── */
  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("hastagBillionaire")
          : null;
      const res = token
        ? await ProductDetailApi(id)
        : await ProductDetailGuestApi(id);
      const data = res?.data?.data || res?.data;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.variants?.length) return;
    const first = product.variants[0];
    setSelectedColor(first.color);
    setSelectedSize(first.size_details);
    setVariantData(first);
  }, [product]);

  useEffect(() => {
    if (!product || !selectedColor || !selectedSize) return;
    const match = product.variants.find(
      (v) => v.color === selectedColor && v.size_id === selectedSize.id
    );
    if (match) setVariantData(match);
  }, [selectedColor, selectedSize, product]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const first = product?.variants.find((v) => v.color === color);
    if (first) {
      setSelectedSize(first.size_details);
      setVariantData(first);
    }
  };

  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <section className="min-h-screen bg-[#faf9f7] py-10 lg:py-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-10">
            {[80, 60, 100].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 rounded-full bg-[#e8e4df] animate-pulse" style={{ width: w }} />
                {i < 2 && <div className="w-1 h-1 rounded-full bg-[#ccc]" />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
            {/* Gallery skeleton */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[68px] h-[68px] rounded-xl bg-[#e8e4df] animate-pulse" />
                ))}
              </div>
              <div className="flex-1 aspect-square rounded-3xl bg-[#e8e4df] animate-pulse" />
            </div>

            {/* Info skeleton */}
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <div className="h-3 w-28 bg-[#e8e4df] rounded-full animate-pulse" />
                <div className="h-10 w-4/5 bg-[#e8e4df] rounded-xl animate-pulse" />
                <div className="h-10 w-2/5 bg-[#e8e4df] rounded-xl animate-pulse" />
              </div>
              <div className="h-px bg-[#e8e4df]" />
              <div className="flex gap-2.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-[#e8e4df] animate-pulse" />
                ))}
              </div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-14 h-10 rounded-lg bg-[#e8e4df] animate-pulse" />
                ))}
              </div>
              <div className="h-28 rounded-2xl bg-[#e8e4df] animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#e8f0ea] flex items-center justify-center mx-auto">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-[#2d4a35] font-semibold text-lg">Product not found</p>
          <p className="text-[#8fa989] text-sm">This item may have been removed or is temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  /* ── Derived data ── */
  const displayPrice = variantData?.price
    ? Number(variantData.price)
    : product.price;

  const displayAttachments = variantData?.images?.length
    ? variantData.images.map((img) => ({
        ...img,
        url: img.file_name.startsWith("http")
          ? img.file_name
          : `${BASE_URL}${img.file_uri}`,
      }))
    : product.attachments;
  const category = product?.categories?.[0]?.parent_categories?.[0]?.id;
  /* ── UI ── */
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-[#ece8e2] bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="container max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 py-3.5 text-xs text-[#8fa989] font-medium">
            <a href="/" className="hover:text-[#2d4a35] transition-colors">Home</a>
            <span className="text-[#ccc]">/</span>
            <a href="/categories" className="hover:text-[#2d4a35] transition-colors">Products</a>
            {category && (
              <>
                <span className="text-[#ccc]">/</span>
                <span className="text-[#8fa989]">{category.name}</span>
              </>
            )}
            <span className="text-[#ccc]">/</span>
            <span className="text-[#2d4a35] truncate max-w-[180px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="py-10 lg:py-16">
        <div className="container max-w-7xl mx-auto px-4">

          {/* ── Main product grid ── */}
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 xl:gap-24 items-start">
            {/* Gallery */}
            <div className="lg:sticky lg:top-[60px]">
              <ProductGallery
                attachments={displayAttachments}
                onActiveChange={setActiveGalleryIndex}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <ProductInfo
                name={product.name}
                price={displayPrice}
                description={product.description}
                variants={product.variants}
                sizes={product.sizes}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                variantStock={variantData?.stock ?? null}
                variantSku={variantData?.sku ?? null}
                variantLoading={false}
              />

              {/* SKU badge */}
              {/* {variantData?.sku && (
                <div className="flex items-center gap-2 text-xs text-[#8fa989]">
                  <span className="font-medium uppercase tracking-widest">SKU</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#e8f0ea] text-[#4a7a58] font-mono font-semibold tracking-wider">
                    {variantData.sku}
                  </span>
                </div>
              )} */}

              {variantData && (
                <ProductCustomization
                  productId={Number(product.id)}
                  variantId={variantData.id}
                  price={displayPrice}
                  name={product.name}
                  productImage={
                    (
                      displayAttachments?.[activeGalleryIndex] ??
                      displayAttachments?.[0]
                    )?.file_uri ?? null
                  }
                  is_in_cart={Boolean(variantData.is_in_cart)}
                  is_in_wishlist={Boolean(variantData.is_in_wishlist)}
                  wishlist_id={variantData.wishlist_id ?? null}
                  onReload={fetchProduct}
                />
              )}

             
            </div>
          </div>

          {/* ── Accordion ── */}
          <ProductAccordion description={product.description} />

          {/* ── Related ── */}
          <RelatedProducts category_id={category} />
        </div>
      </section>
    </div>
  );
}