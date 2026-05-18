"use client";

import Link from "next/link";
import ProxyImage from "../Proxyimage";

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

function ProductCard({ product, index }: { product: Product; index: number }) {
  const price = product.price
    ? Number(product.price).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : null;

  const imageUrl =
    Array.isArray(product.attachments) &&
    product.attachments.length > 0 &&
    product.attachments[0]?.file_uri
      ? product.attachments[0].file_uri
      : "/placeholder.png";

  return (
    <Link
      href={`/product/${product.id}`}
      className="product-card group block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image container */}
      <div className="image-wrapper relative overflow-hidden rounded-xl bg-[#f5f4f0]">
        <div className="aspect-square relative">
          <ProxyImage
            src={imageUrl}
            alt={product.name || "Product Image"}
            fill
            className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        {/* Hover overlay shimmer */}
        <div className="shimmer-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Quick-view pill */}
        <div className="quick-view absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 bg-[#1a1a1a] text-white text-[11px] font-medium tracking-wide uppercase px-3.5 py-1.5 rounded-full shadow-lg">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-70">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 3v2l1.2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Quick View
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="pt-3 pb-1 px-0.5">
        <p className="text-[13px] font-semibold text-[#1a1a1a] truncate leading-snug tracking-[-0.01em] mb-1">
          {product.name}
        </p>

        <div className="flex items-center justify-between gap-2">
          {price ? (
            <p className="text-[13px] font-bold text-[#2d4a35] tabular-nums">
              {price}
            </p>
          ) : (
            <p className="text-[12px] text-[#aaa] italic">Price on request</p>
          )}

          {/* Arrow indicator */}
          <span className="text-[#2d4a35] opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 4l3.5 3L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>

      <style jsx>{`
        .product-card {
          animation: fadeSlideUp 0.45s ease both;
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-wrapper {
          box-shadow:
            0 1px 2px rgba(0,0,0,0.04),
            0 4px 12px rgba(0,0,0,0.06);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }

        .product-card:hover .image-wrapper {
          box-shadow:
            0 2px 4px rgba(0,0,0,0.06),
            0 12px 32px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .shimmer-overlay {
          background: linear-gradient(
            135deg,
            transparent 40%,
            rgba(255,255,255,0.18) 50%,
            transparent 60%
          );
          background-size: 200% 200%;
          animation: shimmer 0.6s ease forwards;
        }

        @keyframes shimmer {
          from { background-position: 200% 200%; }
          to   { background-position: -50% -50%; }
        }
      `}</style>
    </Link>
  );
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#f0ede8] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-[#aaa]">
            <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 11h8M11 7v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] text-[#999] font-medium">No products found</p>
        <p className="text-[12px] text-[#bbb]">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-7">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}