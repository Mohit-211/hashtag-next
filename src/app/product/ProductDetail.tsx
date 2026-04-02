"use client";

import { useEffect, useState } from "react";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import { ProductDetailApi, ProductVariantApi } from "@/api/operations/product.api";

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

interface VariantData {
  id: number;
  price: string;
  stock: number;
  sku: string;
  color: string;
  color_code: string;
  size: string;
  size_id: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  images: VariantImage[];
  size_details: Size;
  [key: string]: any;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<VariantData | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);

  // Fetch base product
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

  // Fetch variant when BOTH color and size are selected
  useEffect(() => {
    if (!selectedColor || !id) return;

    const fetchVariant = async () => {
      setVariantLoading(true);
      try {
        const res = await ProductVariantApi({
          product_id: Number(id),   // ✅ must be number
          color: selectedColor,      // ✅ e.g. "White"
          size_id: selectedSize?.id,  // ✅ e.g. 1
        });
        const data = res?.data?.data || res?.data;
        setVariantData(data);
      } catch (error) {
        console.error("Error fetching variant:", error);
        setVariantData(null);
      } finally {
        setVariantLoading(false);
      }
    };

    fetchVariant();
  }, [selectedColor, selectedSize, id]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null);  // reset size when color changes
    setVariantData(null);
  };

  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
    setVariantData(null);
  };

  if (loading) return <p className="text-center py-10">Loading product...</p>;
  if (!product) return <p className="text-center py-10">Product not found</p>;

  // ✅ Use variant data if available, fallback to base product
  const displayPrice = variantData?.price
    ? Number(variantData.price)
    : product.price;

  // ✅ Build gallery images from variant images
  const displayAttachments = variantData?.images?.length
    ? variantData.images.map((img) => ({
        ...img,
        url: `${BASE_URL}${img.file_uri}/${img.file_name}`,
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
              // ✅ Pass variant info for stock/sku display
              variantStock={variantData?.stock ?? null}
              variantSku={variantData?.sku ?? null}
              variantLoading={variantLoading}
            />

            <ProductCustomization />
          </div>
        </div>

        <ProductAccordion description={product.description} />
        <RelatedProducts category_id={product?.categories[0]?.id} />
      </div>
    </section>
  );
}