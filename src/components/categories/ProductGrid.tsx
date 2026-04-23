"use client";

import Image from "next/image";
import Link from "next/link";

interface Attachment {
  file_uri: string;
}

export interface Product {
  id: number | string;
  name: string;
  price: number | string;
  attachments?: Attachment[];
}

interface ProductGridProps {
  products: Product[];
}

function ProductCard({ product }: { product: Product }) {
  const price = product.price
    ? Number(product.price).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      })
    : null;

  // ✅ Safe image handling
  const imageUrl =
    Array.isArray(product.attachments) &&
    product.attachments.length > 0 &&
    product.attachments[0]?.file_uri
      ? product.attachments[0].file_uri
      : "/placeholder.png"; // fallback image
console.log(product,"product")
  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-background border border-border rounded-2xl overflow-hidden hover:border-[#2d4a35] transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          crossOrigin="anonymous"
          src={imageUrl}
          alt={product.name || "Product Image"}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[13px] font-medium text-foreground truncate mb-1 leading-snug">
          {product.name}
        </p>

        {price && (
          <p className="text-[14px] font-medium text-[#2d4a35]">
            {price}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}