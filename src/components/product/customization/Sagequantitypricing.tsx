"use client";
/**
 * SageQuantityPricing.tsx
 *
 * Handles SAGE-style parallel-array tiered pricing:
 *
 *  meta = {
 *    priceTiers : ["3.98","2.72","1.56","1.44","1.08","0.94"],  ← retail price per unit
 *    netTiers   : ["1.99","1.36","0.78","0.72","0.54","0.47"],  ← net cost (ignored in UI)
 *    qtyTiers   : ["100","200","300","500","1000","100000"],     ← min qty to unlock that price
 *  }
 *
 *  Rule: priceTiers[i] applies when qty >= qtyTiers[i]
 *        The last qtyTier with minQty <= qty wins.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Zap, Package, Tag, TrendingDown, Check } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════════ */

export interface PriceTier {
  minQty: number;
  maxQty: number | null;   // null = unlimited (last tier)
  price: number;           // retail unit price
  netPrice?: number;       // net cost (optional display)
}

export interface SageMeta {
  priceTiers: PriceTier[];
  qtyTiers: number[];
  setupFee?: number;
  currency?: string;
  productName?: string;
  sku?: string;
  productionTime?: string;
  themes?: string;
  dimensions?: string;
  raw?: Record<string, unknown>;
}

export interface SageQuantityChangeState {
  sku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SageQuantityPricingProps {
  metaStr: string | Record<string, unknown> | null | undefined;
  minOrderQuantity?: number;
  stock?: number | null;
  variant?: "compact" | "full";
  /** Identifier for the line item this instance represents — passed through to onChange so a parent rendering multiple instances (e.g. an order summary) can tell them apart. Falls back to meta.sku if not provided. */
  itemId?: string;
  onChange?: (state: SageQuantityChangeState & { itemId?: string }) => void;
  initialQty?: number;
}

/* ════════════════════════════════════════════════════════════════
   PARSER — handles the actual SAGE parallel-array format
════════════════════════════════════════════════════════════════ */

export function parseSageMeta(
  raw: string | Record<string, unknown> | null | undefined
): SageMeta | null {
  if (!raw) return null;

  let obj: Record<string, unknown> | null = null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "null" || trimmed === "{}") return null;
    try {
      obj = JSON.parse(trimmed);
      // double-encoded
      if (typeof obj === "string") obj = JSON.parse(obj as string);
    } catch {
      return null;
    }
  } else if (typeof raw === "object" && raw !== null) {
    obj = raw as Record<string, unknown>;
  }

  if (!obj || typeof obj !== "object") return null;

  /* ── Extract parallel arrays ── */
  const rawPriceTiers = obj.priceTiers;
  const rawNetTiers = obj.netTiers;
  const rawQtyTiers = obj.qtyTiers;

  if (!Array.isArray(rawPriceTiers) || !Array.isArray(rawQtyTiers)) return null;
  if (rawPriceTiers.length === 0 || rawQtyTiers.length === 0) return null;

  const count = Math.min(rawPriceTiers.length, rawQtyTiers.length);

  const rows: { minQty: number; price: number; netPrice?: number }[] = [];

 for (let i = 0; i < count; i++) {
  const minQty = Number(rawQtyTiers[i]);
  const price = Number(rawPriceTiers[i]);

  const netPrice =
    Array.isArray(rawNetTiers) && rawNetTiers[i] != null
      ? Number(rawNetTiers[i])
      : undefined;

  // Skip invalid / empty / zero tiers
  if (
    !Number.isFinite(minQty) ||
    minQty <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    continue;
  }

  rows.push({
    minQty,
    price,
    netPrice: Number.isFinite(netPrice) ? netPrice : undefined,
  });
}

  if (rows.length === 0) return null;

  // IMPORTANT: sort ascending by minQty before deriving maxQty bands.
  // SAGE doesn't guarantee the incoming arrays are already in qty order,
  // and everything downstream (effectiveMin, "BEST" badge, base-tier
  // savings comparison) assumes priceTiers[0] is the lowest tier.
  rows.sort((a, b) => a.minQty - b.minQty);

  const priceTiers: PriceTier[] = rows.map((row, i) => ({
    minQty: row.minQty,
    price: row.price,
    netPrice: row.netPrice,
    maxQty: i < rows.length - 1 ? rows[i + 1].minQty - 1 : null,
  }));

  return {
    priceTiers,
    qtyTiers: priceTiers.map(t => t.minQty),
    setupFee: typeof obj.setupFee === "number" ? obj.setupFee : undefined,
    currency: "USD",
    productName: obj.productName as string | undefined,
    sku: obj.sku as string | undefined,
    productionTime: obj.productionTime as string | undefined,
    themes: obj.themes as string | undefined,
    dimensions: obj.dimensions as string | undefined,
    raw: obj,
  };
}

/* ════════════════════════════════════════════════════════════════
   getSageUnitPrice — finds the retail price for a given qty
════════════════════════════════════════════════════════════════ */

/**
 * The retail markup applied on top of the raw SAGE tier price for display
 * and for the actual price charged. Exported so any other component
 * (e.g. the parent product page's Order Summary) computes the *same*
 * number shown in this component's price table — otherwise the two
 * will silently diverge.
 */
export const SAGE_PRICE_MARKUP = 1.4925;

export function applySageMarkup(price: number): number {
  return +(price * SAGE_PRICE_MARKUP).toFixed(2);
}

/** Raw SAGE tier price, with no markup applied. */
export function getSageUnitPrice(
  raw: string | Record<string, unknown> | null | undefined,
  qty: number
): number | null {
  const meta = parseSageMeta(raw);
  if (!meta) return null;
  return findActiveTier(meta.priceTiers, qty)?.price ?? null;
}

/**
 * Marked-up SAGE tier price — this is the number that actually gets
 * displayed in <SageQuantityPricing>'s table and price bar. Use this
 * (not getSageUnitPrice) anywhere you need to show or charge the same
 * price the customer sees in that component.
 */
export function getSageUnitPriceWithMarkup(
  raw: string | Record<string, unknown> | null | undefined,
  qty: number
): number | null {
  const rawPrice = getSageUnitPrice(raw, qty);
  return rawPrice == null ? null : applySageMarkup(rawPrice);
}

function findActiveTier(tiers: PriceTier[], qty: number): PriceTier | null {
  if (tiers.length === 0) return null;
  // tiers are already sorted ascending by minQty (parseSageMeta guarantees this).
  // Walk from highest minQty downward — first tier whose minQty ≤ qty wins.
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (qty >= tiers[i].minQty) return tiers[i];
  }
  // qty is below every tier's minQty — fall back to the lowest tier (index 0,
  // guaranteed lowest because tiers are sorted ascending).
  return tiers[0];
}

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(amount);
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */

export default function SageQuantityPricing({
  metaStr,
  minOrderQuantity = 1,
  stock,
  variant = "compact",
  itemId,
  onChange,
  initialQty,
}: SageQuantityPricingProps) {
  const applyMarkup = applySageMarkup;

  const meta = useMemo(() => parseSageMeta(metaStr), [metaStr]);

  // Effective minimum = max(variant minOrderQty, first tier's minQty)
  const effectiveMin = useMemo(() => {
    const tierMin = meta?.priceTiers[0]?.minQty ?? 1;
    return Math.max(minOrderQuantity, tierMin);
  }, [meta, minOrderQuantity]);

  const [qty, setQty] = useState<number>(() => {
    const start = initialQty ?? effectiveMin;
    return Math.max(start, effectiveMin);
  });

  useEffect(() => {
    setQty(q => (q < effectiveMin ? effectiveMin : q));
  }, [effectiveMin]);

  const [showTable, setShowTable] = useState(true);

  const activeTier = useMemo(
    () => meta ? findActiveTier(meta.priceTiers, qty) : null,
    [meta, qty]
  );

  const unitPrice = activeTier ? applyMarkup(activeTier.price) : 0;
  const total = unitPrice * qty + (meta?.setupFee ?? 0);

  const baseTierPrice = applyMarkup(meta?.priceTiers?.[0]?.price ?? 0);
  const saving = Math.max(0, (baseTierPrice - unitPrice) * qty);

  // Keep the latest onChange in a ref so the emitting effect doesn't need
  // it in its dependency array — avoids re-firing (and potential update
  // loops) just because a caller passed a fresh inline arrow function.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const resolvedItemId = itemId ?? meta?.sku;

  useEffect(() => {
    onChangeRef.current?.({
      itemId: resolvedItemId,
      sku: meta?.sku,
      productName: meta?.productName,
      quantity: qty,
      unitPrice,
      total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, unitPrice, total, resolvedItemId, meta?.sku, meta?.productName]);

  // A supplier feed can report stock as null/undefined (unknown/untracked),
  // 0, or even negative (e.g. backordered/oversold). Only a genuinely
  // positive number represents a real ceiling on how many can be ordered —
  // anything else should NOT clamp or disable the stepper.
  const stockLimit = stock != null && stock > 0 ? stock : null;

  const changeQty = useCallback((next: number) => {
    let clamped = Math.max(effectiveMin, Math.round(next));
    if (stockLimit != null) clamped = Math.min(clamped, stockLimit);
    setQty(clamped);
  }, [effectiveMin, stockLimit]);

  const jumpToTier = (tier: PriceTier) => changeQty(tier.minQty);

  const nextTier = useMemo(() => {
    if (!meta) return null;
    return meta.priceTiers
      .filter(t => t.minQty > qty)
      .sort((a, b) => a.minQty - b.minQty)[0] ?? null;
  }, [meta, qty]);

  /* ── Shared "typeable" quantity input logic ──
     A number input bound directly to a clamped `qty` state has a nasty
     bug: clearing the field to type a new value fires onChange with
     value === "", Number("") is 0 (not NaN), changeQty(0) clamps straight
     back up to effectiveMin, and the field snaps to that value mid-keystroke
     — making it impossible to type a smaller-then-larger multi-digit qty.
     Fix: buffer the raw text locally, only reconcile from the committed
     `qty` while the field isn't focused, and only clamp on blur. */
  const [qtyInput, setQtyInput] = useState(String(qty));
  const inputFocusedRef = useRef(false);

  useEffect(() => {
    if (!inputFocusedRef.current) setQtyInput(String(qty));
  }, [qty]);

  const handleQtyInputFocus = () => {
    inputFocusedRef.current = true;
  };

  const handleQtyInputChange = (raw: string) => {
    setQtyInput(raw);
    if (raw.trim() === "") return; // let the field sit empty while typing
    const v = Number(raw);
    if (Number.isFinite(v)) changeQty(v);
  };

  const handleQtyInputBlur = (raw: string) => {
    inputFocusedRef.current = false;
    const v = Number(raw);
    changeQty(Number.isFinite(v) ? v : effectiveMin);
    // changeQty updates `qty`, and the effect above will re-sync qtyInput
    // now that the field is no longer focused.
  };

  /* ── No meta: simple fallback stepper ── */
  if (!meta) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={() => changeQty(qty - 1)}
          disabled={qty <= effectiveMin}
          aria-label="Decrease quantity"
          className="w-11 h-11 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          −
        </button>
        <input
          type="number"
          value={qtyInput}
          min={effectiveMin}
          onFocus={handleQtyInputFocus}
          onChange={e => handleQtyInputChange(e.target.value)}
          onBlur={e => handleQtyInputBlur(e.target.value)}
          className="w-20 h-11 rounded-2xl border-2 border-gray-200 text-center text-lg font-black text-gray-900 outline-none focus:border-[#F5D800] transition-all"
        />
        <button
          onClick={() => changeQty(qty + 1)}
          disabled={stockLimit != null && qty >= stockLimit}
          aria-label="Increase quantity"
          className="w-11 h-11 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>
    );
  }

  /* ─── Sub-components ─── */

const TierTable = () => {
  const cheapestPrice = applyMarkup(
    meta.priceTiers.reduce((min, t) => Math.min(min, t.price), Infinity)
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {meta.priceTiers.map((tier) => {
        const active = activeTier?.minQty === tier.minQty;
        const markedPrice = applyMarkup(tier.price);
        const isBestValue = markedPrice === cheapestPrice && tier.maxQty === null;
        const pctOff = baseTierPrice > 0
          ? Math.round((1 - markedPrice / baseTierPrice) * 100)
          : 0;

        return (
          <button
            key={tier.minQty}
            onClick={() => jumpToTier(tier)}
            className={cn(
              "group relative rounded-2xl border p-3.5 text-left transition-all duration-150",
              active
                ? "border-[#F5D800] bg-gradient-to-b from-[#FFFBEA] to-[#FFF6CC] shadow-[0_4px_16px_-2px_rgba(245,216,0,0.35)] -translate-y-0.5"
                : "border-gray-200 bg-white hover:border-[#F5D800]/70 hover:-translate-y-0.5 hover:shadow-md"
            )}
          >
            {isBestValue && (
              <span className="absolute -top-2 right-2.5 inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                <TrendingDown size={9} strokeWidth={3} /> BEST
              </span>
            )}

            <div className="flex items-baseline justify-between gap-1">
              <span className={cn(
                "text-[11px] font-bold tracking-tight",
                active ? "text-[#8a6d00]" : "text-gray-400 group-hover:text-gray-600"
              )}>
                {tier.minQty.toLocaleString()}{tier.maxQty != null ? `–${tier.maxQty.toLocaleString()}` : "+"}
              </span>
              {active && <Check size={13} strokeWidth={3} className="text-[#b89000] flex-shrink-0" />}
            </div>

            <div className="mt-2 text-xl font-black leading-none tabular-nums text-gray-900">
              {fmt(markedPrice)}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">per piece</p>

            {pctOff > 0 && (
              <p className="mt-1.5 text-[10px] font-bold text-emerald-600">
                {pctOff}% off base
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

const QtyStepper = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="flex items-center gap-3">
      <button
        onClick={() => changeQty(qty - 1)}
        disabled={qty <= effectiveMin}
        aria-label="Decrease quantity"
        className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        −
      </button>

      <div className="flex flex-col items-center">
        <input
          type="number"
          value={qtyInput}
          min={effectiveMin}
          max={stockLimit ?? undefined}
          onFocus={handleQtyInputFocus}
          onChange={(e) => handleQtyInputChange(e.target.value)}
          onBlur={(e) => handleQtyInputBlur(e.target.value)}
          className="w-32 h-12 rounded-2xl border-2 border-gray-200 text-center text-xl font-black text-gray-900 outline-none focus:border-[#F5D800] focus:ring-4 focus:ring-[#F5D800]/15 transition-all tabular-nums"
        />
        {/* <p className="text-[10px] text-gray-400 mt-1">
          min {effectiveMin.toLocaleString()}{stockLimit != null ? ` · stock ${stockLimit.toLocaleString()}` : ""}
        </p> */}
      </div>

      <button
        onClick={() => changeQty(qty + 1)}
        disabled={stockLimit != null && qty >= stockLimit}
        aria-label="Increase quantity"
        className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        +
      </button>
    </div>

    {/* <div className="flex items-center gap-2 text-center">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unit price</p>
        <p className="text-2xl font-black text-gray-900 leading-tight tabular-nums">{fmt(unitPrice)}</p>
      </div>
      {saving > 0 && (
        <span className="ml-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
          −{fmt(saving)}
        </span>
      )}
    </div> */}
  </div>
);

  const PriceBar = () => (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 overflow-hidden relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
            {qty.toLocaleString()} units × {fmt(unitPrice)}
          </p>
          <p className="text-3xl font-black text-[#F5D800] leading-tight tabular-nums">
            {fmt(total)}
          </p>
        </div>
        {activeTier && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] font-bold text-gray-200 flex-shrink-0">
            <Package size={10} />
            Tier {activeTier.minQty.toLocaleString()}{activeTier.maxQty != null ? `–${activeTier.maxQty.toLocaleString()}` : "+"}
          </span>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-white/10">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Unit price</span>
          <span className="font-semibold text-gray-100 tabular-nums">{fmt(unitPrice)}</span>
        </div>
        {meta?.setupFee ? (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Setup fee</span>
            <span className="font-semibold text-gray-100 tabular-nums">{fmt(meta.setupFee)}</span>
          </div>
        ) : null}
        {saving > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 flex items-center gap-1"><TrendingDown size={11} /> You save</span>
            <span className="font-bold text-emerald-400 tabular-nums">{fmt(saving)}</span>
          </div>
        )}
      </div>
    </div>
  );

  const NextTierNudge = () => {
    if (!nextTier || !activeTier) return null;
    const needed = nextTier.minQty - qty;
    const savingPerPc = (
      applyMarkup(activeTier.price) -
      applyMarkup(nextTier.price)
    ).toFixed(2);
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <span className="relative flex-shrink-0">
          <Zap size={14} className="text-amber-500 relative z-10" />
          <span className="absolute inset-0 rounded-full bg-amber-300/50 animate-ping" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-800">
            {needed.toLocaleString()} more unlocks {fmt(applyMarkup(nextTier.price))}/pc
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Save ${savingPerPc}/pc at {nextTier.minQty.toLocaleString()}+ units
          </p>
        </div>
        <button
          onClick={() => jumpToTier(nextTier)}
          className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-full hover:bg-amber-200 transition-colors flex-shrink-0"
        >
          Jump to {nextTier.minQty.toLocaleString()}
        </button>
      </div>
    );
  };

  /* ── Compact layout (inside SectionCard) ── */
  if (variant === "compact") {
    return (
      <div className="space-y-4">
        {/* Collapsible tier table */}
        <button
          onClick={() => setShowTable(s => !s)}
          className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span className="w-6 h-6 rounded-lg bg-[#F5D800]/20 flex items-center justify-center">
              <Tag size={12} className="text-[#b89000]" />
            </span>
            Volume Pricing
            <span className="text-gray-400 font-medium">
              · {meta.priceTiers.length} tiers · {fmt(applyMarkup(meta.priceTiers[meta.priceTiers.length - 1]?.price ?? 0))}–{fmt(applyMarkup(meta.priceTiers[0]?.price ?? 0))}/pc
            </span>
          </div>
          {showTable ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {showTable && <TierTable />}

        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Select Quantity</p>
          <QtyStepper />
        </div>

        <NextTierNudge />
        <PriceBar />
      </div>
    );
  }

  /* ── Full layout ── */
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Tag size={12} className="text-[#F5D800]" /> Quantity Breaks
          </p>
          <TierTable />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Package size={12} className="text-[#F5D800]" /> Your Order
          </p>
          <QtyStepper />
          <NextTierNudge />
          <PriceBar />
        </div>
      </div>
    </div>
  );
}