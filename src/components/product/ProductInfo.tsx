"use client";

import { useMemo } from "react";
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
  brandName,
  brandLogo,
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
  brandName?: string | null;
  brandLogo?: string | null;
}) {
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => {
      if (!map.has(v.color)) {
        const code =
          v.color_code ??
          v.color.split(/[\/,\s]+/)[0].trim().toLowerCase();
        map.set(v.color, code);
      }
    });
    return Array.from(map, ([color, color_code]) => ({ color, color_code }));
  }, [variants]);

  const availableSizeIds = useMemo(() => {
    if (!selectedColor) return new Set<number>();
    return new Set(
      variants
        .filter((v) => v.color === selectedColor && v.is_active)
        .map((v) => v.size_id)
    );
  }, [selectedColor, variants]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {/* Brand row */}
        {brandName && (
          <div className="flex items-center gap-2 mb-3">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={brandName}
                className="w-7 h-7 rounded-md object-contain border border-[#E5E5E5] bg-white p-0.5"
              />
            ) : (
              <span className="w-7 h-7 rounded-md border border-[#E5E5E5] bg-[#F5F5F5] flex items-center justify-center text-[10px] font-bold text-[#888] uppercase tracking-wide select-none">
                {brandName.slice(0, 2)}
              </span>
            )}
            <span className="text-[13px] font-semibold text-[#444] tracking-tight">
              {brandName}
            </span>
          </div>
        )}

        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#CFAF2E]">
          <span className="w-4 h-px bg-[#CFAF2E]" />
          Premium Apparel
        </span>

        <h1 className="mt-2 text-[2rem] leading-[1.15] font-bold text-[#111111]">
          {name}
        </h1>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <p className="text-[2rem] font-bold text-[#111111]">${price}</p>
      </div>

      <div className="h-px bg-[#E5E5E5]" />

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
              Color
            </p>
            <p className="text-sm font-semibold text-[#111111]">
              {selectedColor || "Select a color"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {colors.map((item) => {
              const colorCodes = item.color_code
                ?.split(",")
                .map((c) => c.trim())
                .filter(Boolean);

              const background =
                colorCodes?.length > 1
                  ? `linear-gradient(135deg, ${colorCodes.join(",")})`
                  : colorCodes?.[0] || "#ccc";

              return (
                <button
                  key={item.color}
                  title={item.color}
                  onClick={() => onColorChange(item.color)}
                  className={`relative w-10 h-10 rounded-full  transition-all duration-200 hover:scale-110 ${selectedColor === item.color
                      ? " scale-105"
                      : "border-[#E5E5E5]"
                    }`}
                  style={{
                    background:
                      colorCodes?.length > 1 ? background : undefined,
                    backgroundColor:
                      colorCodes?.length === 1 ? colorCodes[0] : undefined,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
              Size
            </p>
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
                  className={`min-w-[52px] px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${isActive
                    ? "bg-[#111111] text-[#E8D03A] border-[#111111]"
                    : available
                      ? "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                      : "bg-[#F5F5F5] text-[#BDBDBD] border-[#E5E5E5] cursor-not-allowed line-through"
                    }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>

          {selectedColor && availableSizeIds.size === 0 && (
            <p className="text-xs text-[#C0392B] font-medium mt-3">
              No sizes available for this color.
            </p>
          )}
        </div>
      )}
    </div>
  );
}