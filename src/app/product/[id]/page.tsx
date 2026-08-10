"use client";

import React from "react";
import ProductDetail from "../ProductDetail";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variant_id");

  const handleBack = (e: React.MouseEvent) => {
    
      router.push("/categories");
    
  };

  return (
    <main>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="pt-10 pb-4">
          <Link
            href="/categories"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />Back to All Product
          </Link>
        </div>
        <ProductDetail id={id} variantId={variantId} />
      </div>
    </main>
  );
};

export default ProductDetailsPage;