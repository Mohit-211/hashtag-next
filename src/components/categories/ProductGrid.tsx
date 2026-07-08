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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --pg-ink:        #1a1612;
    --pg-ink-soft:   #6b6560;
    --pg-ink-faint:  #a09b96;
    --pg-border:     #e8e3de;
    --pg-bg:         #faf8f5;
    --pg-white:      #ffffff;
    --pg-accent:     #c8502a;
    --pg-accent-lt:  #f5ede8;
    --pg-green:      #2e7d32;
    --pg-green-lt:   #f1f8f1;
    --pg-gold:       #b45309;
    --pg-gold-lt:    #fffbeb;
    --pg-radius:     12px;
    --pg-font:       'DM Sans', system-ui, sans-serif;
  }

  /* ── Grid layout ── */
  .pg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  @media (max-width: 480px) {
    .pg-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  }

  /* ── Card ── */
  .pg-card {
    font-family: var(--pg-font);
    background: var(--pg-white);
    border: 1px solid var(--pg-border);
    border-radius: var(--pg-radius);
    overflow: hidden;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    color: inherit;
    position: relative;
    transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
    animation: pgReveal 0.35s ease both;
  }
  .pg-card:hover {
    box-shadow: 0 8px 32px rgba(26,22,18,0.10), 0 2px 8px rgba(26,22,18,0.06);
    transform: translateY(-2px);
    border-color: #d8d3ce;
    z-index: 1;
  }

  @keyframes pgReveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Image area ── */
  .pg-img-wrap {
    position: relative;
    
    overflow: hidden;
  }
  .pg-img-aspect {
    position: relative;
    padding-bottom: 100%;
  }
  .pg-img {
    object-fit: contain !important;
    padding: 16px !important;
    transition: transform 0.4s ease !important;
  }
  .pg-card:hover .pg-img {
    transform: scale(1.06) !important;
  }

  /* ── Badges on image ── */
  .pg-badges-top {
    position: absolute;
    top: 9px;
    left: 9px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 2;
    pointer-events: none;
  }
  .pg-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    font-family: var(--pg-font);
    letter-spacing: 0.02em;
    line-height: 1.4;
  }
  .pg-badge-hot {
    background: var(--pg-accent);
    color: #fff;
  }
  .pg-badge-sponsored {
    background: rgba(26,22,18,0.55);
    color: rgba(255,255,255,0.92);
    backdrop-filter: blur(4px);
    font-weight: 400;
    font-size: 10px;
  }

  /* ── Wishlist button ── */
  .pg-wish {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(4px);
    border: 1px solid var(--pg-border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ccc;
    transition: color 0.18s, transform 0.18s, background 0.18s;
    z-index: 2;
  }
  .pg-wish:hover { color: #e74c3c; transform: scale(1.12); background: #fff; }
  .pg-wish.saved { color: #e74c3c; background: #fff0ef; border-color: #fcc; }

  /* ── Discount ribbon (bottom of image) ── */
  .pg-discount-ribbon {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, var(--pg-green) 0%, #43a047 100%);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--pg-font);
    text-align: center;
    padding: 4px 0;
    letter-spacing: 0.03em;
    z-index: 2;
  }

  /* ── Body ── */
  .pg-body {
    padding: 12px 13px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  /* ── Brand name (if you add brand to product type) ── */
  .pg-brand {
    font-size: 11px;
    font-weight: 600;
    color: var(--pg-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }

  .pg-name {
    font-size: 13px;
    font-weight: 400;
    color: var(--pg-ink);
    line-height: 1.45;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .pg-variant {
    font-size: 11.5px;
    color: var(--pg-ink-faint);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Rating ── */
  .pg-rating-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .pg-stars {
    display: flex;
    align-items: center;
    gap: 1px;
  }
  .pg-star { color: #f59e0b; }
  .pg-star-empty { color: #e5e7eb; }
  .pg-review-count {
    font-size: 11px;
    color: var(--pg-ink-faint);
  }

  /* ── Assured badge ── */
  .pg-assured {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: var(--pg-gold-lt);
    border: 1px solid #fde68a;
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 600;
    color: var(--pg-gold);
    font-family: var(--pg-font);
  }

  /* ── Divider ── */
  .pg-divider {
    height: 1px;
    background: var(--pg-border);
    margin: 0;
    flex-shrink: 0;
  }

  /* ── Price row ── */
  .pg-price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }
  .pg-price {
    font-size: 17px;
    font-weight: 600;
    color: var(--pg-ink);
    letter-spacing: -0.02em;
  }
  .pg-original {
    font-size: 12px;
    color: var(--pg-ink-faint);
    text-decoration: line-through;
  }
  .pg-discount-pct {
    font-size: 12px;
    color: var(--pg-green);
    font-weight: 500;
  }

  /* ── Add to cart strip ── */
  .pg-cart-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--pg-accent);
    border-top: 1px solid var(--pg-border);
    margin: 2px -13px -14px;
    padding: 8px 13px;
    transition: background 0.15s, color 0.15s;
  }
  .pg-card:hover .pg-cart-strip {
    background: var(--pg-accent-lt);
  }

  /* ── Empty state ── */
  .pg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 10px;
    font-family: var(--pg-font);
    color: var(--pg-ink-faint);
    background: var(--pg-white);
    border: 1px solid var(--pg-border);
    border-radius: var(--pg-radius);
  }
`;

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span className="pg-stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="pg-star" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="pg-star-empty" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
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
console.log(product,"product")
  const imageUrl =
    Array.isArray(product.attachments) &&
    product.attachments.length > 0 &&
    product.attachments[0]?.file_uri
      ? product.attachments[0].file_uri
      : null;

  const price = formatINR(product.price);
  const original = product.price ? formatINR(product.price) : null;
  const discount = product.price
    ? getDiscount(product.price, product.price)
    : null;

  const rating = product.rating ?? 0;
  const reviewCount = product.review_count;

  return (
    <Link
      href={`/product/${product.id}`}
      className="pg-card"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      {/* ── Image ── */}
      <div className="pg-img-wrap">
        {/* Top-left badges */}
        <div className="pg-badges-top">
          {product.is_hot_deal && (
            <span className="pg-badge pg-badge-hot">
              🔥 Hot Deal
            </span>
          )}
          {product.is_sponsored && (
            <span className="pg-badge pg-badge-sponsored">Sponsored</span>
          )}
        </div>

        {/* Wishlist */}
        {/* <button
          className={`pg-wish${saved ? " saved" : ""}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved((v) => !v); }}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
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

        {/* Discount ribbon at bottom of image */}
        {discount && (
          <div className="pg-discount-ribbon">{discount}</div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="pg-body">
        <p className="pg-name">{product.name}</p>

        {product.variant_label && (
          <p className="pg-variant">{product.variant_label}</p>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="pg-rating-row">
            <StarRating rating={rating} />
            {reviewCount != null && (
              <span className="pg-review-count">({reviewCount.toLocaleString("en-IN")})</span>
            )}
            {product.is_assured && (
              <span className="pg-assured">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Assured
              </span>
            )}
          </div>
        )}

        {/* Assured only (when no rating) */}
        {rating === 0 && product.is_assured && (
          <div className="pg-rating-row">
            <span className="pg-assured">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Assured
            </span>
          </div>
        )}

        {/* Price */}
        <div className="pg-price-row">
          {original && <span className="pg-price">{original}</span>}
          {/* {original && <span className="pg-original">{original}</span>} */}
          {discount && <span className="pg-discount-pct">{discount}</span>}
        </div>

        {/* Add to cart strip */}
        {/* <div className="pg-cart-strip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Add to Cart
        </div> */}
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
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f5f0eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c8502a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1a1612", fontFamily: "var(--pg-font)" }}>No products found</p>
          <p style={{ margin: 0, fontSize: 13, fontFamily: "var(--pg-font)" }}>Try adjusting your filters or search</p>
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