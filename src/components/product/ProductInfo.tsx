"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { ManualMeta } from "@/components/product/customization/Productcustomizationpage";
import { formatMoney } from "@/components/product/customization/pricing";
import ProductOptionGroup, { resolveDisplayStyle, type OptionGroupValue } from "@/components/product/ProductOptionGroup";

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
  type?: string;
  id: number;
  name: string;
  measurements?: string;
}

export interface ManualOptionGroup {
  name: string;
  values: OptionGroupValue[];
  /** Backend `display_style` — picks the control; unknown/missing → dropdown. */
  displayStyle?: string | null;
}

const money = (n: number) => `$${formatMoney(Number(n))}`;

export default function ProductInfo({
  name,
  price,
  variants = [],
  sizes = [],
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  brandName,
  brandLogo,
  tagline = null,
  manualOptions,
  selectedOptions = {},
  onOptionChange,
  manualPricing,
}: {
  name: string;
  price: number;
  variants: Variant[];
  sizes: Size[];
  selectedColor: string | null;
  selectedSize: Size | null;
  onColorChange: (color: string) => void;
  onSizeChange: (size: Size) => void;
  brandName?: string | null;
  brandLogo?: string | null;
  /** Eyebrow above the title; null hides it. */
  tagline?: string | null;
  /** MANUAL-supplier option groups — replace the color/size pickers when set. */
  manualOptions?: ManualOptionGroup[];
  selectedOptions?: Record<string, string>;
  onOptionChange?: (name: string, value: string) => void;
  manualPricing?: ManualMeta | null;
}) {
const colors = useMemo(() => {
  const map = new Map<string, string>();
  variants.forEach((v) => {
    if (!v?.color) return; // skip variants without a color entirely
    if (!map.has(v?.color)) {
      const code =
        v?.color_code ||
        v?.color?.split(/[\/,\s]+/)[0]?.trim().toLowerCase() ||
        "var(--color-muted)";
      map.set(v?.color, code);
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
              <Image
                src={brandLogo}
                alt={brandName}
                width={28}
                height={28}
                unoptimized
                className="w-7 h-7 rounded-md object-contain border border-border bg-card p-0.5"
              />
            ) : (
              <span className="w-7 h-7 rounded-md border border-border bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide select-none">
                {brandName.slice(0, 2)}
              </span>
            )}
            <span className="text-[13px] font-semibold text-foreground tracking-tight">
              {brandName}
            </span>
          </div>
        )}

        {tagline && (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-ink">
            <span className="w-4 h-px bg-primary" />
            {tagline}
          </span>
        )}

        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          {name}
        </h1>
      </div>

      {/* Price */}
      {manualPricing?.pricing_mode === "quantity_fixed" ? (
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {money(manualPricing.quantity_pricing[0].price)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            for {manualPricing.quantity_pricing[0].quantity} pcs
          </p>
        </div>
      ) : manualPricing?.pricing_mode === "tiered" ? (
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium text-muted-foreground">From</p>
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {money(Math.min(...manualPricing.bulk_pricing.map((t) => t.price)))}
          </p>
          <p className="text-sm font-medium text-muted-foreground">/ pc</p>
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold tabular-nums text-foreground">{money(price)}</p>
        </div>
      )}


      <div className="h-px bg-muted" />

      {/* MANUAL option groups (Pages / Size / Color …) */}
      {!!manualOptions?.length && (
        <div
          className={`grid grid-cols-2 gap-x-3 gap-y-5 ${manualOptions.filter((g) => resolveDisplayStyle(g.displayStyle) === "dropdown").length >= 3
            ? "sm:grid-cols-3"
            : ""
            }`}
        >
          {manualOptions.map((group) => (
            <ProductOptionGroup
              key={group.name}
              name={group.name}
              values={group.values}
              displayStyle={group.displayStyle}
              selected={selectedOptions[group.name]}
              onChange={(value) => onOptionChange?.(group.name, value)}
            />
          ))}
        </div>
      )}

      {/* Color Selection */}
      {!manualOptions && colors?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Color
            </p>
            <p className="text-sm font-semibold text-foreground">
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
                  : colorCodes?.[0] || "var(--color-muted)";

              return (
                <button
                  key={item.color}
                  title={item.color}
                  onClick={() => onColorChange(item.color)}
                  type="button"
                  aria-label={item.color}
                  aria-pressed={selectedColor === item.color}
                  className={`relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-110 ${
                    selectedColor === item.color ? "scale-105" : ""
                  }`}
                  style={{
                    background:
                      colorCodes?.length > 1 ? background : undefined,
                    backgroundColor:
                      colorCodes?.length === 1 ? colorCodes[0] : undefined,
                    // Hairline keeps white swatches visible; the selected one also gets an offset ring
                    // (done here because an inline box-shadow would override Tailwind's ring utilities).
                    boxShadow: [
                      "inset 0 0 0 1px color-mix(in srgb, var(--color-foreground) 12%, transparent)",
                      selectedColor === item.color &&
                        "0 0 0 2px var(--color-background), 0 0 0 4px var(--color-foreground)",
                    ]
                      .filter(Boolean)
                      .join(", "),
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {!manualOptions && sizes?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
                    ? "bg-foreground text-primary border-foreground"
                    : available
                      ? "bg-card text-foreground border-border hover:border-primary hover:bg-primary-soft"
                      : "bg-muted text-muted-foreground border-border cursor-not-allowed line-through"
                    }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>

          {selectedColor && availableSizeIds.size === 0 && (
            <p className="text-xs text-destructive font-medium mt-3">
              No sizes available for this color.
            </p>
          )}
        </div>
      )}
    </div>
  );
}