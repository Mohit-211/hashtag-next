"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import { ProductDetailApi } from "@/api/operations/product.api";

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

  // Tracks whichever thumbnail the user is viewing in the gallery
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  /* ── Fetch ── */
  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await ProductDetailApi(id);
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

  /* ── Default variant on load ── */
  useEffect(() => {
    if (!product?.variants?.length) return;
    const first = product.variants[0];
    setSelectedColor(first.color);
    setSelectedSize(first.size_details);
    setVariantData(first);
  }, [product]);

  /* ── Sync variant when color/size changes ── */
  useEffect(() => {
    if (!product || !selectedColor || !selectedSize) return;
    const match = product.variants.find(
      (v) => v.color === selectedColor && v.size_id === selectedSize.id
    );
    if (match) setVariantData(match);
  }, [selectedColor, selectedSize, product]);

  /* ── Handlers ── */
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
      <section className="py-8 lg:py-14">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
              <div className="flex gap-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[72px] h-[72px] rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-9 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
              <div className="h-px bg-border" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                ))}
              </div>
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-12 h-9 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <section className="py-20">
        <div className="container text-center">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </section>
    );
  }

  /* ── Derived data ── */
  const displayPrice = variantData?.price ? Number(variantData.price) : product.price;

  const displayAttachments = variantData?.images?.length
    ? variantData.images.map((img) => ({
        ...img,
        url: img.file_name.startsWith("http")
          ? img.file_name
          : `${BASE_URL}${img.file_uri}`,
      }))
    : product.attachments;

  /* ── UI ── */
  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ProductGallery
            attachments={displayAttachments}
            onActiveChange={setActiveGalleryIndex}
          />

          <div className="space-y-5">
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

            {variantData && (
              <ProductCustomization
                productId={Number(product.id)}
                variantId={variantData.id}
                price={displayPrice}
                name={product.name}
                productImage={
                  // Use the exact image the user is viewing in the gallery
                  (displayAttachments?.[activeGalleryIndex] ?? displayAttachments?.[0])?.file_uri ?? null
                }
                is_in_cart={Boolean(variantData.is_in_cart)}
                is_in_wishlist={Boolean(variantData.is_in_wishlist)}
                wishlist_id={variantData.wishlist_id ?? null}
                onReload={fetchProduct}
              />
            )}
          </div>
        </div>

        <ProductAccordion description={product.description} />
        <RelatedProducts category_id={product?.categories?.[0]?.id ?? null} />
      </div>
    </section>
  );
}