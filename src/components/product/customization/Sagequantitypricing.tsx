"use client";


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
  netTiers: PriceTier[];
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

  if (!Array.isArray(rawNetTiers) || !Array.isArray(rawQtyTiers)) return null;
  if (rawNetTiers.length === 0 || rawQtyTiers.length === 0) return null;

  const count = Math.min(rawNetTiers.length, rawQtyTiers.length);

  const rows: { minQty: number; price: number; netPrice?: number }[] = [];

  for (let i = 0; i < count; i++) {
    const minQty = Number(rawQtyTiers[i]);
    const price = Number(rawNetTiers[i]);

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
  // savings comparison) assumes netTiers[0] is the lowest tier.
  rows.sort((a, b) => a.minQty - b.minQty);

  const netTiers: PriceTier[] = rows.map((row, i) => ({
    minQty: row.minQty,
    price: row.price,
    netPrice: row.netPrice,
    maxQty: i < rows.length - 1 ? rows[i + 1].minQty - 1 : null,
  }));

  return {
    netTiers,
    qtyTiers: netTiers.map(t => t.minQty),
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
  console.log(meta,"meta==1")
  if (!meta) return null;
  return findActiveTier(meta.netTiers, qty)?.price ?? null;
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
   SUB-COMPONENTS
   Pulled out to module scope (rather than declared inside the main
   component body) and wrapped in React.memo. Declaring them inside
   the parent function meant React saw a *new component type* on
   every parent render, forcing a full unmount/remount of each
   subtree — dropping input focus, restarting CSS transitions, and
   doing far more DOM work than a normal re-render needs. Hoisting
   them out + memoizing means they only re-render when their own
   props actually change.
════════════════════════════════════════════════════════════════ */

interface TierTableProps {
  netTiers: PriceTier[];
  activeTier: PriceTier | null;
  baseTierPrice: number;
  onJumpToTier: (tier: PriceTier) => void;
}

const TierTable = React.memo(function TierTable({
  netTiers,
  activeTier,
  baseTierPrice,
  onJumpToTier,
}: TierTableProps) {
  console.log("TierTable render", { netTiers, activeTier, baseTierPrice },onJumpToTier);
  const cheapestPrice = useMemo(
    () => applySageMarkup(netTiers.reduce((min, t) => Math.min(min, t.price), Infinity)),
    [netTiers]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {netTiers.map((tier) => {
        const active = activeTier?.minQty === tier.minQty;
        const markedPrice = applySageMarkup(tier.price);
        const isBestValue = markedPrice === cheapestPrice && tier.maxQty === null;
        const pctOff = baseTierPrice > 0
          ? Math.round((1 - markedPrice / baseTierPrice) * 100)
          : 0;

        return (
          <button
            key={tier.minQty}
            onClick={() => onJumpToTier(tier)}
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
});

interface QtyStepperProps {
  qty: number;
  qtyInput: string;
  effectiveMin: number;
  stockLimit: number | null;
  onDecrease: () => void;
  onIncrease: () => void;
  onFocus: () => void;
  onInputChange: (raw: string) => void;
  onInputBlur: (raw: string) => void;
}

const QtyStepper = React.memo(function QtyStepper({
  qty,
  qtyInput,
  effectiveMin,
  stockLimit,
  onDecrease,
  onIncrease,
  onFocus,
  onInputChange,
  onInputBlur,
}: QtyStepperProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrease}
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
            onFocus={onFocus}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={(e) => onInputBlur(e.target.value)}
            className="w-32 h-12 rounded-2xl border-2 border-gray-200 text-center text-xl font-black text-gray-900 outline-none focus:border-[#F5D800] focus:ring-4 focus:ring-[#F5D800]/15 transition-all tabular-nums"
          />
        </div>

        <button
          onClick={onIncrease}
          disabled={stockLimit != null && qty >= stockLimit}
          aria-label="Increase quantity"
          className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
});

interface PriceBarProps {
  qty: number;
  unitPrice: number;
  total: number;
  setupFee?: number;
  saving: number;
  activeTier: PriceTier | null;
}

const PriceBar = React.memo(function PriceBar({
  qty,
  unitPrice,
  total,
  setupFee,
  saving,
  activeTier,
}: PriceBarProps) {
  return (
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
        {setupFee ? (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Setup fee</span>
            <span className="font-semibold text-gray-100 tabular-nums">{fmt(setupFee)}</span>
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
});

interface NextTierNudgeProps {
  qty: number;
  activeTier: PriceTier | null;
  nextTier: PriceTier | null;
  onJumpToTier: (tier: PriceTier) => void;
}

const NextTierNudge = React.memo(function NextTierNudge({
  qty,
  activeTier,
  nextTier,
  onJumpToTier,
}: NextTierNudgeProps) {
  if (!nextTier || !activeTier) return null;
  const needed = nextTier.minQty - qty;
  const savingPerPc = (
    applySageMarkup(activeTier.price) -
    applySageMarkup(nextTier.price)
  ).toFixed(2);
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <span className="relative flex-shrink-0">
        <Zap size={14} className="text-amber-500 relative z-10" />
        <span className="absolute inset-0 rounded-full bg-amber-300/50 animate-ping" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-800">
          {needed.toLocaleString()} more unlocks {fmt(applySageMarkup(nextTier.price))}/pc
        </p>
        <p className="text-[11px] text-amber-600 mt-0.5">
          Save ${savingPerPc}/pc at {nextTier.minQty.toLocaleString()}+ units
        </p>
      </div>
      <button
        onClick={() => onJumpToTier(nextTier)}
        className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-full hover:bg-amber-200 transition-colors flex-shrink-0"
      >
        Jump to {nextTier.minQty.toLocaleString()}
      </button>
    </div>
  );
});

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
  const meta = useMemo(() => parseSageMeta(metaStr), [metaStr]);

  // Effective minimum = max(variant minOrderQty, first tier's minQty)
  const effectiveMin = useMemo(() => {
    const tierMin = meta?.netTiers[0]?.minQty ?? 1;
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
    () => meta ? findActiveTier(meta.netTiers, qty) : null,
    [meta, qty]
  );

  const unitPrice = useMemo(
    () => activeTier ? applySageMarkup(activeTier.price) : 0,
    [activeTier]
  );

  const total = useMemo(
    () => unitPrice * qty + (meta?.setupFee ?? 0),
    [unitPrice, qty, meta?.setupFee]
  );

  const baseTierPrice = useMemo(
    () => applySageMarkup(meta?.netTiers?.[0]?.price ?? 0),
    [meta]
  );

  const saving = useMemo(
    () => Math.max(0, (baseTierPrice - unitPrice) * qty),
    [baseTierPrice, unitPrice, qty]
  );

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

  const jumpToTier = useCallback((tier: PriceTier) => changeQty(tier.minQty), [changeQty]);

  const nextTier = useMemo(() => {
    if (!meta) return null;
    return meta.netTiers
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

  const handleQtyInputFocus = useCallback(() => {
    inputFocusedRef.current = true;
  }, []);

  const handleQtyInputChange = useCallback((raw: string) => {
    setQtyInput(raw);
    if (raw.trim() === "") return; // let the field sit empty while typing
    const v = Number(raw);
    if (Number.isFinite(v)) changeQty(v);
  }, [changeQty]);

  const handleQtyInputBlur = useCallback((raw: string) => {
    inputFocusedRef.current = false;
    const v = Number(raw);
    changeQty(Number.isFinite(v) ? v : effectiveMin);
    // changeQty updates `qty`, and the effect above will re-sync qtyInput
    // now that the field is no longer focused.
  }, [changeQty, effectiveMin]);

  const handleDecrease = useCallback(() => changeQty(qty - 1), [changeQty, qty]);
  const handleIncrease = useCallback(() => changeQty(qty + 1), [changeQty, qty]);

  /* ── No meta: simple fallback stepper ── */
  if (!meta) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={handleDecrease}
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
          onClick={handleIncrease}
          disabled={stockLimit != null && qty >= stockLimit}
          aria-label="Increase quantity"
          className="w-11 h-11 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>
    );
  }

  /* ── Compact layout (inside SectionCard) ── */
  if (variant === "compact") {
    console.log(meta,"meta")
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
              · {meta.netTiers.length} tiers · {fmt(applySageMarkup(meta.netTiers[meta.netTiers.length - 1]?.price ?? 0))}–{fmt(applySageMarkup(meta.netTiers[0]?.price ?? 0))}/pc
            </span>
          </div>
          {showTable ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {showTable && (
          <TierTable
            netTiers={meta.netTiers}
            activeTier={activeTier}
            baseTierPrice={baseTierPrice}
            onJumpToTier={jumpToTier}
          />
        )}

        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Select Quantity</p>
          <QtyStepper
            qty={qty}
            qtyInput={qtyInput}
            effectiveMin={effectiveMin}
            stockLimit={stockLimit}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onFocus={handleQtyInputFocus}
            onInputChange={handleQtyInputChange}
            onInputBlur={handleQtyInputBlur}
          />
        </div>

        <NextTierNudge qty={qty} activeTier={activeTier} nextTier={nextTier} onJumpToTier={jumpToTier} />
        <PriceBar
          qty={qty}
          unitPrice={unitPrice}
          total={total}
          setupFee={meta.setupFee}
          saving={saving}
          activeTier={activeTier}
        />
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
          <TierTable
            netTiers={meta.netTiers}
            activeTier={activeTier}
            baseTierPrice={baseTierPrice}
            onJumpToTier={jumpToTier}
          />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Package size={12} className="text-[#F5D800]" /> Your Order
          </p>
          <QtyStepper
            qty={qty}
            qtyInput={qtyInput}
            effectiveMin={effectiveMin}
            stockLimit={stockLimit}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
            onFocus={handleQtyInputFocus}
            onInputChange={handleQtyInputChange}
            onInputBlur={handleQtyInputBlur}
          />
          <NextTierNudge qty={qty} activeTier={activeTier} nextTier={nextTier} onJumpToTier={jumpToTier} />
          <PriceBar
            qty={qty}
            unitPrice={unitPrice}
            total={total}
            setupFee={meta.setupFee}
            saving={saving}
            activeTier={activeTier}
          />
        </div>
      </div>
    </div>
  );
}