"use client";
import React, { useMemo, useState } from "react";
import { Check, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   ▌ SAGE markup config
   ▌ Change this one constant if the markup % ever changes.
════════════════════════════════════════════════════════════════ */
export const SAGE_MARKUP_MULTIPLIER = 1.4925; // +49.25%

/* ════════════════════════════════════════════════════════════════
   ▌ Types
════════════════════════════════════════════════════════════════ */
export interface SageMeta {
  priceTiers: string[];
  qtyTiers: string[];
  priceOnRequest: boolean;
  stockMessage: string;
  dimensions: string;
  productionTime: string;
  themes: string;
}

export interface SageTier {
  qty: number;
  basePrice: number;   // raw supplier price (no markup)
  price: number;       // marked-up price, what the customer sees
}

/* ════════════════════════════════════════════════════════════════
   ▌ Parsing + markup helpers
   ▌ Use these the same way for the product page AND, later,
   ▌ the customize page — single source of truth.
════════════════════════════════════════════════════════════════ */

/** Safely parse the meta/eta JSON string SAGE products store on the variant. */
export function parseSageMeta(metaStr: string | null | undefined): SageMeta | null {
  if (!metaStr) return null;
  try {
    const parsed = JSON.parse(metaStr);
    if (!Array.isArray(parsed.qtyTiers) || !Array.isArray(parsed.priceTiers)) return null;
    return parsed as SageMeta;
  } catch {
    return null;
  }
}

/** Turn parsed meta into a clean numeric tier list, with markup applied. */
export function buildSageTiers(meta: SageMeta): SageTier[] {
  const tiers: SageTier[] = [];
  const len = Math.min(meta.qtyTiers.length, meta.priceTiers.length);
  for (let i = 0; i < len; i++) {
    const qty = Number(meta.qtyTiers[i]);
    const basePrice = Number(meta.priceTiers[i]);
    if (Number.isNaN(qty) || Number.isNaN(basePrice)) continue;
    tiers.push({ qty, basePrice, price: basePrice * SAGE_MARKUP_MULTIPLIER });
  }
  return tiers.sort((a, b) => a.qty - b.qty);
}

/** Given a quantity, find the applicable (highest qualifying) tier. */
export function getSageTierForQty(tiers: SageTier[], qty: number): SageTier | null {
  if (!tiers.length) return null;
  let match = tiers[0];
  for (const t of tiers) {
    if (qty >= t.qty) match = t;
  }
  return match;
}

/** Convenience: parse + build + price in one call. */
export function getSageUnitPrice(metaStr: string | null | undefined, qty: number): number | null {
  const meta = parseSageMeta(metaStr);
  if (!meta) return null;
  const tiers = buildSageTiers(meta);
  const tier = getSageTierForQty(tiers, qty);
  return tier ? tier.price : null;
}

/* ════════════════════════════════════════════════════════════════
   ▌ Component
════════════════════════════════════════════════════════════════ */
interface SageQuantityPricingProps {
  metaStr: string | null | undefined;
  minOrderQuantity?: number;
  stock?: number;
  productionTime?: string;
  /** "full" = product page layout w/ heading + Add to Cart.
   *  "compact" = for embedding inside the customize page step. */
  variant?: "full" | "compact";
  /** Fires on every quantity change — use this to drive an existing
   *  variantQty/sidebar flow (e.g. on the customize page). */
  onChange?: (payload: { quantity: number; unitPrice: number; totalPrice: number }) => void;
  /** Optional standalone Add to Cart button (product page use). Omit
   *  when embedding inside a page that has its own cart CTA. */
  onAddToCart?: (payload: { quantity: number; unitPrice: number; totalPrice: number }) => void;
  addToCartLoading?: boolean;
}

export default function SageQuantityPricing({
  metaStr,
  minOrderQuantity = 1,
  stock,
  productionTime,
  variant = "full",
  onChange,
  onAddToCart,
  addToCartLoading = false,
}: SageQuantityPricingProps) {
  const meta = useMemo(() => parseSageMeta(metaStr), [metaStr]);
  const tiers = useMemo(() => (meta ? buildSageTiers(meta) : []), [meta]);

  const lowestTierQty = tiers[0]?.qty ?? minOrderQuantity;
  const [qty, setQty] = useState<number>(Math.max(minOrderQuantity, lowestTierQty));
  const [qtyInput, setQtyInput] = useState<string>(String(Math.max(minOrderQuantity, lowestTierQty)));

  const activeTier = useMemo(() => getSageTierForQty(tiers, qty), [tiers, qty]);
  const unitPrice = activeTier?.price ?? 0;
  const totalPrice = unitPrice * qty;

  const belowMin = qty < minOrderQuantity;
  const overStock = typeof stock === "number" && qty > stock;

  const commitQty = (raw: string) => {
    setQtyInput(raw);
    const n = Number(raw.replace(/[^\d]/g, ""));
    if (!Number.isNaN(n) && n > 0) setQty(n);
  };

  // Notify parent on every resolved qty/price change (not just on a button click)
  React.useEffect(() => {
    if (!onChange) return;
    if (belowMin || overStock) return;
    onChange({ quantity: qty, unitPrice, totalPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, unitPrice]);

  if (!meta || tiers.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <AlertCircle size={14} className="text-gray-300 flex-shrink-0" />
        <p className="text-xs text-gray-400">No tiered pricing available for this item.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", variant === "full" && "rounded-2xl border border-gray-200 bg-white p-5")}>
      {variant === "full" && (
        <div>
          <p className="text-sm font-black text-gray-900">Quantity Pricing</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Price per piece drops as quantity increases. Enter your quantity below.
          </p>
        </div>
      )}

      {/* Tier table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-bold text-gray-500">Quantity</th>
              <th className="text-right px-3 py-2 font-bold text-gray-500">Price / pc</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => {
              const isActive = activeTier?.qty === t.qty;
              const nextQty = tiers[i + 1]?.qty;
              const label = nextQty ? `${t.qty.toLocaleString()}–${(nextQty - 1).toLocaleString()}` : `${t.qty.toLocaleString()}+`;
              return (
                <tr
                  key={t.qty}
                  className={cn(
                    "border-b border-gray-100 last:border-0 transition-colors",
                    isActive ? "bg-[#F5D800]/10" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  )}
                >
                  <td className={cn("px-3 py-2", isActive ? "font-bold text-[#b89000]" : "text-gray-600")}>
                    {isActive && <Check size={11} className="inline mr-1 -mt-0.5" />}
                    {label}
                  </td>
                  <td className={cn("px-3 py-2 text-right", isActive ? "font-black text-[#b89000]" : "font-semibold text-gray-700")}>
                    ${t.price.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quantity input */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Quantity</p>
        <input
          type="text"
          inputMode="numeric"
          value={qtyInput}
          onChange={(e) => commitQty(e.target.value)}
          className={cn(
            "w-full h-11 rounded-xl border-2 px-4 text-sm font-bold text-gray-900 outline-none transition-all",
            belowMin || overStock ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#F5D800]"
          )}
          placeholder={`Min ${minOrderQuantity}`}
        />
        {belowMin && (
          <p className="text-[11px] text-red-500 mt-1">Minimum order quantity is {minOrderQuantity}.</p>
        )}
        {overStock && (
          <p className="text-[11px] text-red-500 mt-1">Only {stock?.toLocaleString()} in stock.</p>
        )}
      </div>

      {/* Price summary */}
      <div className="rounded-xl bg-gray-900 text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold opacity-70">Price per piece</span>
          <span className="text-sm font-black text-[#F5D800]">${unitPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold opacity-70">Total ({qty.toLocaleString()} pcs)</span>
          <span className="text-lg font-black text-[#F5D800]">${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {productionTime && (
        <p className="text-[11px] text-gray-400">Production time: {productionTime}</p>
      )}

      {/* Add to cart */}
      {onAddToCart && (
        <button
          onClick={() => onAddToCart({ quantity: qty, unitPrice, totalPrice })}
          disabled={belowMin || overStock || addToCartLoading}
          className={cn(
            "w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all",
            belowMin || overStock || addToCartLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
              : "bg-[#F5D800] text-black hover:bg-[#e6ca00] shadow-md"
          )}
        >
          {addToCartLoading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          {addToCartLoading ? "Adding…" : "Add to Cart"}
        </button>
      )}
    </div>
  );
}