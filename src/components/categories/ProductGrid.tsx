"use client";

import Link from "next/link";
import { useState } from "react";
import ProxyImage from "../Proxyimage";

interface Attachment {
  file_uri: string;
}

export interface Product {
  id: number | string;
  name: string;
  price: number | string;
  original_price?: number | string;
  rating?: number;
  review_count?: number;
  is_assured?: boolean;
  is_sponsored?: boolean;
  is_hot_deal?: boolean;
  variant_label?: string;
  attachments?: Attachment[];
}

interface ProductGridProps {
  products: Product[];
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

  .pg-card {
    font-family: 'Outfit', system-ui, sans-serif;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    text-decoration: none;
    display: block;
    color: inherit;
    transition: box-shadow 0.2s ease;
    animation: pgReveal 0.4s ease both;
    position: relative;
  }
  .pg-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.14);
    z-index: 1;
  }

  @keyframes pgReveal {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pg-img-wrap {
    position: relative;
    background: #f5f5f5;
    overflow: hidden;
  }
  .pg-img-aspect {
    position: relative;
    padding-bottom: 100%;
  }
  .pg-img {
    object-fit: contain !important;
    padding: 12px !important;
    transition: transform 0.4s ease !important;
  }
  .pg-card:hover .pg-img {
    transform: scale(1.05) !important;
  }

  .pg-sponsored {
    position: absolute;
    top: 8px;
    left: 10px;
    font-size: 10px;
    color: #878787;
    font-family: 'Outfit', system-ui, sans-serif;
    pointer-events: none;
    z-index: 2;
  }

  .pg-wish {
    position: absolute;
    top: 7px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #ccc;
    transition: color 0.18s, transform 0.18s;
    z-index: 2;
  }
  .pg-wish:hover { color: #e74c3c; transform: scale(1.15); }
  .pg-wish.saved { color: #e74c3c; }

  .pg-body {
    padding: 10px 12px 13px;
    border-top: 1px solid #f0f0f0;
  }
  .pg-name {
    font-size: 13.5px;
    font-weight: 500;
    color: #212121;
    line-height: 1.4;
    margin: 0 0 3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pg-variant {
    font-size: 11.5px;
    color: #878787;
    margin: 0 0 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pg-rating-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
    flex-wrap: wrap;
  }
  .pg-rating-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #388e3c;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 3px;
    line-height: 1.5;
    font-family: 'Outfit', system-ui, sans-serif;
  }
  .pg-rating-badge.low  { background: #f57c00; }
  .pg-rating-badge.mid  { background: #388e3c; }
  .pg-rating-badge.high { background: #1565c0; }
  .pg-review-count {
    font-size: 11.5px;
    color: #878787;
  }
  .pg-assured {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 10px;
    font-weight: 700;
    color: #e65100;
    font-family: 'Outfit', system-ui, sans-serif;
  }

  .pg-price-row {
    display: flex;
    align-items: baseline;
    gap: 7px;
    flex-wrap: wrap;
    margin-bottom: 7px;
  }
  .pg-price {
    font-size: 16px;
    font-weight: 700;
    color: #212121;
  }
  .pg-original {
    font-size: 12.5px;
    color: #878787;
    text-decoration: line-through;
  }
  .pg-discount {
    font-size: 12.5px;
    color: #388e3c;
    font-weight: 600;
  }

  .pg-hot-deal {
    display: inline-block;
    border: 1.5px solid #388e3c;
    color: #388e3c;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 3px;
    letter-spacing: 0.02em;
    font-family: 'Outfit', system-ui, sans-serif;
  }

  .pg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(211px, 1fr));
    gap: 1px;
    background: #e8e8e8;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    overflow: hidden;
  }
  .pg-grid > * { background: #fff; }

  @media (max-width: 480px) {
    .pg-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .pg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 10px;
    font-family: 'Outfit', system-ui, sans-serif;
    color: #878787;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
  }
`;

function getRatingClass(rating: number) {
  if (rating < 3.2) return "low";
  if (rating >= 4.3) return "high";
  return "mid";
}

function formatINR(val: number | string) {
  const n = Number(val);
  if (!n) return null;
  return "$" + n.toLocaleString("en-IN");
}

function getDiscount(price: number | string, original: number | string) {
  const p = Number(price);
  const o = Number(original);
  if (!p || !o || o <= p) return null;
  return Math.round(((o - p) / o) * 100) + "% off";
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [saved, setSaved] = useState(false);

  const imageUrl =
    Array.isArray(product.attachments) &&
    product.attachments.length > 0 &&
    product.attachments[0]?.file_uri
      ? product.attachments[0].file_uri
      : "/placeholder.png";

  const price = formatINR(product.price);
  const original = product.original_price ? formatINR(product.original_price) : null;
  const discount = product.original_price
    ? getDiscount(product.price, product.original_price)
    : null;

  const rating = product.rating ?? 3.9;
  const reviewCount = product.review_count ?? 182;

  return (
    <Link
      href={`/product/${product.id}`}
      className="pg-card"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="pg-img-wrap">
        {product.is_sponsored && (
          <span className="pg-sponsored">Sponsored</span>
        )}
        {/* <button
          className={`pg-wish${saved ? " saved" : ""}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved((v) => !v); }}
          aria-label="Add to wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button> */}
        <div className="pg-img-aspect">
          <ProxyImage
            src={imageUrl}
            alt={product.name || "Product"}
            fill
            className="pg-img"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </div>
      </div>

      <div className="pg-body">
        <p className="pg-name">{product.name}</p>
        {product.variant_label && (
          <p className="pg-variant">{product.variant_label}</p>
        )}

        <div className="pg-rating-row">
          {/* <span className={`pg-rating-badge ${getRatingClass(rating)}`}>
            {rating.toFixed(1)} ★
          </span> */}
          {/* <span className="pg-review-count">({reviewCount.toLocaleString("en-IN")})</span> */}
          {product.is_assured && (
            <span className="pg-assured">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Assured
            </span>
          )}
        </div>

        <div className="pg-price-row">
          {price && <span className="pg-price">{price}</span>}
          {/* {original && <span className="pg-original">{original}</span>} */}
          {/* {discount && <span className="pg-discount">{discount}</span>} */}
        </div>

        {product.is_hot_deal && (
          <span className="pg-hot-deal">Hot Deal</span>
        )}
      </div>
    </Link>
  );
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <>
      <style>{styles}</style>
      {!Array.isArray(products) || products.length === 0 ? (
        <div className="pg-empty">
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No products found</p>
          <p style={{ margin: 0, fontSize: 13 }}>Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="pg-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </>
  );
}