"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import { ProductDetailApi } from "@/api/operations/product.api";

/* ================= TYPES ================= */

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

  // ✅ FIXED FLAGS
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

/* ================= COMPONENT ================= */

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<Variant | null>(null);

  /* ================= FETCH PRODUCT ================= */

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

const reloadProduct = () => {
  fetchProduct();
};
  /* ================= DEFAULT VARIANT ================= */

  useEffect(() => {
    if (!product || !product.variants?.length) return;

    const firstVariant = product.variants[0];

    setSelectedColor(firstVariant.color);
    setSelectedSize(firstVariant.size_details);
    setVariantData(firstVariant);
  }, [product]);

  /* ================= UPDATE VARIANT ================= */

  useEffect(() => {
    if (!product || !selectedColor || !selectedSize) return;

    const matchedVariant = product.variants.find(
      (v) =>
        v.color === selectedColor &&
        v.size_id === selectedSize.id
    );

    if (matchedVariant) {
      setVariantData(matchedVariant);
    }
  }, [selectedColor, selectedSize, product]);

  /* ================= HANDLERS ================= */

  // ✅ FIXED (no flicker)
  const handleColorChange = (color: string) => {
    setSelectedColor(color);

    const firstMatch = product?.variants.find(
      (v) => v.color === color
    );

    if (firstMatch) {
      setSelectedSize(firstMatch.size_details);
      setVariantData(firstMatch);
    }
  };

  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
              <div className="flex gap-2.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[72px] h-[72px] rounded-xl bg-muted animate-pulse"
                  />
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
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-muted animate-pulse"
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-9 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ================= NO PRODUCT ================= */

  if (!product) {
    return (
      <section className="py-20">
        <div className="container text-center">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </section>
    );
  }

  /* ================= DERIVED DATA ================= */

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

  /* ================= UI ================= */

  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ProductGallery attachments={displayAttachments} />

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

            {/* ✅ SAFE RENDER */}
            {variantData && (
              <ProductCustomization
                productId={Number(product.id)}
                variantId={variantData.id}
                price={displayPrice}
                name={product.name}
                is_in_cart={Boolean(variantData.is_in_cart)}
                is_in_wishlist={Boolean(variantData.is_in_wishlist)}
                wishlist_id={variantData.wishlist_id ?? null}
                onReload={reloadProduct}
              />
            )}
          </div>
        </div>

        <ProductAccordion description={product.description} />
        <RelatedProducts
          category_id={product?.categories?.[0]?.id ?? null}
        />
      </div>
    </section>
  );
}