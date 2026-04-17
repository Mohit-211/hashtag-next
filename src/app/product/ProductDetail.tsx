"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import { ProductDetailApi } from "@/api/operations/product.api";

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

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<Variant | null>(null);

  // ✅ Fetch product
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await ProductDetailApi(id);
        const data = res?.data?.data || res?.data;

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ Set default variant (first one)
  useEffect(() => {
    if (!product || !product.variants?.length) return;

    const firstVariant = product.variants[0];

    setSelectedColor(firstVariant.color);
    setSelectedSize(firstVariant.size_details);
    setVariantData(firstVariant); // no API call needed
  }, [product]);

  // ✅ Update variant locally (NO API CALL)
  useEffect(() => {
    if (!product || !selectedColor || !selectedSize) return;

    const matchedVariant = product.variants.find(
      (v) =>
        v.color === selectedColor &&
        v.size_id === selectedSize.id
    );

    setVariantData(matchedVariant || null);
  }, [selectedColor, selectedSize, product]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null); // reset size
  };

  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
  };

  if (loading)
    return <p className="text-center py-10">Loading product...</p>;

  if (!product)
    return <p className="text-center py-10">Product not found</p>;

  // ✅ Price
  const displayPrice = variantData?.price
    ? Number(variantData.price)
    : product.price;

  // ✅ Images
  const displayAttachments = variantData?.images?.length
    ? variantData.images.map((img) => ({
        ...img,
        url: img.file_name.startsWith("http")
          ? img.file_name
          : `${BASE_URL}${img.file_uri}`,
      }))
    : product.attachments;

  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <ProductGallery attachments={displayAttachments} />

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
              variantLoading={false} // no API now
            />

        <ProductCustomization
  productId={Number(product.id)}
  variantId={variantData?.id}
  price={displayPrice}
  name={product.name}
/>
          </div>
        </div>

        <ProductAccordion description={product.description} />
        <RelatedProducts category_id={product?.categories[0]?.id} />
      </div>
    </section>
  );
}