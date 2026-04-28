"use client";

import { useMemo, useState } from "react";
import { Star, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import DOMPurify from "dompurify";

interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}

interface Variant {
  is_active: boolean;
  id: number;
  sku: string;
  color: string;
  color_code: string;
  size: string;
  size_id: number;
  price: string;
  stock: number;
  images: VariantImage[];
}

interface Size {
  id: number;
  name: string;
  measurements?: string;
}

export default function ProductInfo({
  name,
  price,
  description,
  variants = [],
  sizes = [],
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  variantStock,
  variantSku,
  variantLoading,
}: {
  name: string;
  price: number;
  description?: string;
  variants: Variant[];
  sizes: Size[];
  selectedColor: string | null;
  selectedSize: Size | null;
  onColorChange: (color: string) => void;
  onSizeChange: (size: Size) => void;
  variantStock?: number | null;
  variantSku?: string | null;
  variantLoading?: boolean;
}) {
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Unique colors
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => {
      if (!map.has(v.color)) map.set(v.color, v.color_code);
    });
    return Array.from(map, ([color, color_code]) => ({ color, color_code }));
  }, [variants]);

  // Available sizes for selected color
  const availableSizeIds = useMemo(() => {
    if (!selectedColor) return new Set<number>();
    return new Set(
      variants
        .filter((v) => v.color === selectedColor && v.is_active)
        .map((v) => v.size_id)
    );
  }, [selectedColor, variants]);

  // Parse measurements
  const measurements = useMemo(() => {
    if (!selectedSize?.measurements) return null;
    try {
      return JSON.parse(selectedSize.measurements);
    } catch {
      return null;
    }
  }, [selectedSize]);

  const rating = 4.2;
  const reviewCount = 128;

  return (
    <div className="space-y-5">
      {/* Eyebrow + Name */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4a7a58]">
          Premium Apparel
        </span>
        <h1 className="font-heading text-[2rem] leading-[1.15] font-bold text-foreground mt-1">
          {name}
        </h1>
      </div>
{/* do not remove we will impliment later */}
      {/* Rating */}
      {/* <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.floor(rating)
                  ? "fill-amber-500 text-amber-500"
                  : i < rating
                  ? "fill-amber-300 text-amber-300"
                  : "fill-border text-border"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {rating} · {reviewCount} reviews
        </span>
      </div> */}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <p className="font-heading text-[2rem] font-bold text-foreground">
          ${price}
        </p>
       
      </div>

      {/* Stock */}
      <div className="h-7 flex items-center">
        {variantLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Checking availability…</span>
          </div>
        ) : variantStock !== null && variantStock !== undefined ? (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              variantStock > 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                variantStock > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {variantStock > 0
              ? `In Stock (${variantStock} available)`
              : "Out of Stock"}
          </span>
        ) : null}
      </div>

      <div className="h-px bg-border" />

      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Color
            </p>
            <p className="text-sm text-foreground font-medium">
              {selectedColor || "Select a color"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((item) => (
              <button
                key={item.color}
                title={item.color}
                onClick={() => onColorChange(item.color)}
                className={`relative w-9 h-9 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                  selectedColor === item.color
                    ? "border-foreground ring-2 ring-background ring-offset-2 ring-offset-foreground/10 scale-105"
                    : "border-transparent"
                }`}
                style={{
                  backgroundColor: item.color_code,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Size
            </p>
            <button
              onClick={() => setShowSizeChart((v) => !v)}
              className="text-xs text-[#4a7a58] underline underline-offset-2 flex items-center gap-0.5"
            >
              Size guide
              {showSizeChart ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = !selectedColor || availableSizeIds.has(size.id);
              const isActive = selectedSize?.id === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => available && onSizeChange(size)}
                  disabled={!available}
                  className={`min-w-[48px] px-3.5 py-2 text-sm font-medium rounded-lg border transition-all duration-150 ${
                    isActive
                      ? "bg-[#2d4a35] text-white border-[#2d4a35]"
                      : available
                      ? "bg-background text-foreground border-border hover:border-[#4a7a58] hover:text-[#4a7a58] hover:bg-[#e8f0ea]"
                      : "bg-muted/30 text-muted-foreground/40 border-border/40 cursor-not-allowed line-through"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>

          {selectedColor && availableSizeIds.size === 0 && (
            <p className="text-xs text-red-500 mt-2">
              No sizes available for this color.
            </p>
          )}

          {/* Collapsible size chart */}
          {showSizeChart && measurements && (
            <div className="mt-3 rounded-xl border border-border overflow-hidden bg-muted/20">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Size Chart — {selectedSize?.name}
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(measurements).map(([key, value]) => (
                    <tr key={key} className="border-b border-border last:border-none">
                      <td className="px-4 py-2 capitalize text-muted-foreground text-xs">
                        {key.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2 font-semibold text-right text-xs">
                        {String(value)} cm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Description preview */}
      {description && (
        <p
          className="text-sm text-muted-foreground leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(description),
          }}
        />
      )}
    </div>
  );
}