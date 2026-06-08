"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductCustomization from "@/components/product/ProductCustomization";

interface Props {
  slug: string;
  productId: number | null;
  variantId: number | null;
  price: number | null;
  name: string | null;
  productImage: string | null;
}

export default function ProductCustomizationPage({
  productId,
  variantId,
  price,
  name,
  productImage,
}: Props) {
  /* ── Guard: missing params ── */
  if (!productId || !variantId || !price || !name) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#e8f0ea] flex items-center justify-center mx-auto">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-[#2d4a35] font-semibold text-lg">Product not found</p>
          <p className="text-[#8fa989] text-sm">
            Please navigate here from a product page.
          </p>
          <Link
            href="/categories"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#2d4a35] text-white text-sm font-semibold hover:bg-[#1f3526] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen">

      {/* ── Breadcrumb / back bar ── */}
      <div className="border-b border-[#ece8e2] bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3.5">
            <Link
              href={`/product/${productId}`}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8fa989] hover:text-[#2d4a35] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to product
            </Link>
            <span className="text-[#ccc]">/</span>
            <span className="text-xs font-medium text-[#2d4a35] truncate max-w-[200px]">
              Customize — {name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Page header ── */}
      <div className="border-b border-[#e2ece4] py-8">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a2e1e] mb-1">
            Customize Your Product
          </h1>
          <p className="text-sm text-[#7a9882]">
            Upload a logo or add custom text · drag to reposition · download your design
          </p>
        </div>
      </div>

      {/* ── Customization component ── */}
      <section className="py-10 lg:py-14">
        <div className="container max-w-5xl mx-auto px-4">
          <ProductCustomization
            productId={productId}
            variantId={variantId}
            price={price}
            name={name}
            productImage={productImage}
          />
        </div>
      </section>
    </div>
  );
}