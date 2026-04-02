"use client";

import { useMemo } from "react";
import { Star, Loader2 } from "lucide-react";

interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}

interface Variant {
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
  // ✅ Unique colors from variants
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => {
      if (!map.has(v.color)) map.set(v.color, v.color_code);
    });
    return Array.from(map, ([color, color_code]) => ({ color, color_code }));
  }, [variants]);

  // ✅ Only show sizes available for selected color
  const availableSizeIds = useMemo(() => {
    if (!selectedColor) return new Set<number>();
    return new Set(
      variants
        .filter((v) => v.color === selectedColor && v.is_active)
        .map((v) => v.size_id)
    );
  }, [selectedColor, variants]);

  // ✅ Parse measurements safely
  const measurements = useMemo(() => {
    if (!selectedSize?.measurements) return null;
    try {
      return JSON.parse(selectedSize.measurements);
    } catch {
      return null;
    }
  }, [selectedSize]);

  return (
    <div>
      <span className="text-xs uppercase text-muted-foreground">Apparel</span>
      <h1 className="text-3xl font-heading font-bold">{name}</h1>

      {/* ⭐ Rating */}
      <div className="flex items-center gap-1 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < 4 ? "fill-primary text-primary" : "text-border"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          4.0 (128 reviews)
        </span>
      </div>

      {/* 📄 Description */}
      <p className="mt-4 text-muted-foreground">
        {description || "No description available"}
      </p>

      {/* 💰 Price — updates from variant */}
      <p className="text-2xl font-bold mt-4">₹{price}</p>

      {/* ✅ SKU */}
      {variantSku && (
        <p className="text-xs text-muted-foreground mt-1">SKU: {variantSku}</p>
      )}

      {/* ✅ Stock status */}
      {variantLoading && (
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking availability...
        </div>
      )}
    {variantLoading ? (
  // 🔹 Skeleton Loader
  <div className="mt-2">
    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
  </div>
) : (
  variantStock !== null &&
  variantStock !== undefined && (
    <p
      className={`text-sm mt-2 font-medium ${
        variantStock > 0 ? "text-green-600" : "text-red-500"
      }`}
    >
      {variantStock > 0
        ? `✓ In Stock (${variantStock} available)`
        : "✗ Out of Stock"}
    </p>
  )
)}

      {/* 🎨 Colors */}
      {colors.length > 0 && (
        <div className="mt-6">
          <p className="font-medium mb-2">
            Color:{" "}
            <span className="text-muted-foreground font-normal">
              {selectedColor || "Select a color"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((item) => (
              <button
                key={item.color}
                onClick={() => onColorChange(item.color)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-all ${
                  selectedColor === item.color
                    ? "border-black bg-black text-white"
                    : "border-gray-300 hover:border-gray-500"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: item.color_code }}
                />
                {item.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📏 Sizes — filtered by selected color */}
      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="font-medium mb-2">
            Size:{" "}
            <span className="text-muted-foreground font-normal">
              {selectedSize?.name || "Select a size"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = !selectedColor || availableSizeIds.has(size.id);
              return (
                <button
                  key={size.id}
                  onClick={() => available && onSizeChange(size)}
                  disabled={!available}
                  className={`px-3 py-1.5 border rounded transition-all ${
                    selectedSize?.id === size.id
                      ? "border-black bg-black text-white"
                      : available
                      ? "border-gray-300 hover:border-gray-500"
                      : "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
          {selectedColor && availableSizeIds.size === 0 && (
            <p className="text-sm text-red-500 mt-2">
              No sizes available for this color.
            </p>
          )}
        </div>
      )}

      {/* 📊 Size Chart */}
      {measurements && (
        <div className="mt-8 border rounded p-4 bg-muted/30">
          <h3 className="font-semibold mb-3">Size Chart</h3>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(measurements).map(([key, value]) => (
                <tr key={key} className="border-b last:border-none">
                  <td className="py-1.5 capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </td>
                  <td className="py-1.5 font-medium">{String(value)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}