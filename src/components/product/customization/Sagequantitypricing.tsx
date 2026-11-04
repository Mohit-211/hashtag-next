"use client";


import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Zap, Package, Tag, TrendingDown, Check } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════════ */

/** One quantity break from a variant's `price_tiers`: the selling price, exactly what the cart charges. */
export interface PriceTier {
  min_qty: number;
  max_qty: number | null;  // null = unlimited (last tier)
  unit_price: number;
}

export interface SageQuantityChangeState {
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SageQuantityPricingProps {
  tiers: PriceTier[];
  minOrderQuantity?: number;
  stock?: number | null;
  variant?: "compact" | "full";
  /** Identifier for the line item this instance represents — passed through to onChange so a parent rendering multiple instances (e.g. an order summary) can tell them apart. */
  itemId?: string;
  onChange?: (state: SageQuantityChangeState & { itemId?: string }) => void;
  initialQty?: number;
}

/* ════════════════════════════════════════════════════════════════
   PRICE TIERS — straight from the API, markup already included
════════════════════════════════════════════════════════════════ */

/**
 * A variant's usable tiers, lowest quantity first. Every supplier but SAGE
 * sends an empty list. The sort matters: everything downstream (minimum,
 * "BEST" badge, base-tier savings) assumes tiers[0] is the lowest tier.
 */
export function getPriceTiers(variant?: { price_tiers?: PriceTier[] | null } | null): PriceTier[] {
  const tiers = variant?.price_tiers;
  if (!Array.isArray(tiers)) return [];
  return tiers
    .filter((t) => Number(t?.min_qty) > 0 && Number(t?.unit_price) > 0)
    .sort((a, b) => a.min_qty - b.min_qty);
}

/** The unit price at `qty`, or null when there are no tiers. */
export function getTierUnitPrice(tiers: PriceTier[], qty: number): number | null {
  return findActiveTier(tiers, qty)?.unit_price ?? null;
}

function findActiveTier(tiers: PriceTier[], qty: number): PriceTier | null {
  if (tiers.length === 0) return null;
  // Walk from highest min_qty downward — first tier whose min_qty ≤ qty wins.
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (qty >= tiers[i].min_qty) return tiers[i];
  }
  // qty is below every tier — fall back to the lowest tier.
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
  tiers: PriceTier[];
  activeTier: PriceTier | null;
  baseTierPrice: number;
  onJumpToTier: (tier: PriceTier) => void;
}

const TierTable = React.memo(function TierTable({
  tiers,
  activeTier,
  baseTierPrice,
  onJumpToTier,
}: TierTableProps) {
  const cheapestPrice = useMemo(
    () => tiers.reduce((min, t) => Math.min(min, t.unit_price), Infinity),
    [tiers]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {tiers.map((tier) => {
        const active = activeTier?.min_qty === tier.min_qty;
        const isBestValue = tier.unit_price === cheapestPrice && tier.max_qty === null;
        const pctOff = baseTierPrice > 0
          ? Math.round((1 - tier.unit_price / baseTierPrice) * 100)
          : 0;

        return (
          <button
            key={tier.min_qty}
            onClick={() => onJumpToTier(tier)}
            className={cn(
              "group relative rounded-2xl border p-3.5 text-left transition-all duration-150",
              active
                ? "border-primary bg-gradient-to-b from-primary-soft to-primary-soft shadow-lg shadow-primary/35 -translate-y-0.5"
                : "border-border bg-card hover:border-primary/70 hover:-translate-y-0.5 hover:shadow-md"
            )}
          >
            {isBestValue && (
              <span className="absolute -top-2 right-2.5 inline-flex items-center gap-0.5 text-[9px] font-black bg-success text-background px-1.5 py-0.5 rounded-full shadow-sm">
                <TrendingDown size={9} strokeWidth={3} /> BEST
              </span>
            )}

            <div className="flex items-baseline justify-between gap-1">
              <span className={cn(
                "text-[11px] font-bold tracking-tight",
                active ? "text-primary-ink" : "text-muted-foreground group-hover:text-muted-foreground"
              )}>
                {tier.min_qty.toLocaleString()}{tier.max_qty != null ? `–${tier.max_qty.toLocaleString()}` : "+"}
              </span>
              {active && <Check size={13} strokeWidth={3} className="text-primary-ink flex-shrink-0" />}
            </div>

            <div className="mt-2 text-xl font-black leading-none tabular-nums text-foreground">
              {fmt(tier.unit_price)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">per piece</p>

            {pctOff > 0 && (
              <p className="mt-1.5 text-[10px] font-bold text-success">
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
          className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold text-muted-foreground hover:border-input hover:bg-muted active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            className="w-32 h-12 rounded-2xl border-2 border-border text-center text-xl font-black text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums"
          />
        </div>

        <button
          onClick={onIncrease}
          disabled={stockLimit != null && qty >= stockLimit}
          aria-label="Increase quantity"
          className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold text-muted-foreground hover:border-input hover:bg-muted active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
  saving: number;
  activeTier: PriceTier | null;
}

const PriceBar = React.memo(function PriceBar({
  qty,
  unitPrice,
  total,
  saving,
  activeTier,
}: PriceBarProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground text-background p-5 overflow-hidden relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
            {qty.toLocaleString()} units × {fmt(unitPrice)}
          </p>
          <p className="text-3xl font-black text-primary-ink leading-tight tabular-nums">
            {fmt(total)}
          </p>
        </div>
        {activeTier && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card/10 border border-card/15 text-[10px] font-bold text-muted-foreground flex-shrink-0">
            <Package size={10} />
            Tier {activeTier.min_qty.toLocaleString()}{activeTier.max_qty != null ? `–${activeTier.max_qty.toLocaleString()}` : "+"}
          </span>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-card/10">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Unit price</span>
          <span className="font-semibold text-background tabular-nums">{fmt(unitPrice)}</span>
        </div>
        {saving > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-success flex items-center gap-1"><TrendingDown size={11} /> You save</span>
            <span className="font-bold text-success tabular-nums">{fmt(saving)}</span>
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
  const needed = nextTier.min_qty - qty;
  const savingPerPc = (activeTier.unit_price - nextTier.unit_price).toFixed(2);
  return (
    <div className="flex items-center gap-3 bg-primary-soft border border-primary rounded-xl px-4 py-3">
      <span className="relative flex-shrink-0">
        <Zap size={14} className="text-primary-ink relative z-10" />
        <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary-ink">
          {needed.toLocaleString()} more unlocks {fmt(nextTier.unit_price)}/pc
        </p>
        <p className="text-[11px] text-primary-ink mt-0.5">
          Save ${savingPerPc}/pc at {nextTier.min_qty.toLocaleString()}+ units
        </p>
      </div>
      <button
        onClick={() => onJumpToTier(nextTier)}
        className="text-[10px] font-black text-primary-ink bg-primary-soft border border-primary px-2.5 py-1.5 rounded-full hover:bg-primary transition-colors flex-shrink-0"
      >
        Jump to {nextTier.min_qty.toLocaleString()}
      </button>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */

export default function SageQuantityPricing({
  tiers,
  minOrderQuantity = 1,
  stock,
  variant = "compact",
  itemId,
  onChange,
  initialQty,
}: SageQuantityPricingProps) {
  // Effective minimum = max(variant minOrderQty, first tier's min_qty)
  const effectiveMin = useMemo(() => {
    const tierMin = tiers[0]?.min_qty ?? 1;
    return Math.max(minOrderQuantity, tierMin);
  }, [tiers, minOrderQuantity]);

  const [qty, setQty] = useState<number>(() => {
    const start = initialQty ?? effectiveMin;
    return Math.max(start, effectiveMin);
  });

  // A higher minimum (new variant) lifts the quantity to it — adjusted
  // during render so the clamped value is what gets painted.
  if (qty < effectiveMin) setQty(effectiveMin);

  const [showTable, setShowTable] = useState(true);

  const activeTier = useMemo(
    () => findActiveTier(tiers, qty),
    [tiers, qty]
  );

  const unitPrice = useMemo(
    () => activeTier?.unit_price ?? 0,
    [activeTier]
  );

  // SAGE products carry no setup charge (client decision Q12), so this is
  // exactly what the cart charges: units × unit price.
  const total = useMemo(
    () => unitPrice * qty,
    [unitPrice, qty]
  );

  const baseTierPrice = tiers[0]?.unit_price ?? 0;

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

  useEffect(() => {
    onChangeRef.current?.({ itemId, quantity: qty, unitPrice, total });
  }, [qty, unitPrice, total, itemId]);

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

  const jumpToTier = useCallback((tier: PriceTier) => changeQty(tier.min_qty), [changeQty]);

  const nextTier = useMemo(
    () => tiers.find(t => t.min_qty > qty) ?? null,
    [tiers, qty]
  );

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

  /* ── No tiers: simple fallback stepper ── */
  if (tiers.length === 0) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={handleDecrease}
          disabled={qty <= effectiveMin}
          aria-label="Decrease quantity"
          className="w-11 h-11 rounded-2xl border-2 border-border flex items-center justify-center text-lg font-bold text-muted-foreground hover:border-input disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          className="w-20 h-11 rounded-2xl border-2 border-border text-center text-lg font-black text-foreground outline-none focus:border-primary transition-all"
        />
        <button
          onClick={handleIncrease}
          disabled={stockLimit != null && qty >= stockLimit}
          aria-label="Increase quantity"
          className="w-11 h-11 rounded-2xl border-2 border-border flex items-center justify-center text-lg font-bold text-muted-foreground hover:border-input disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>
    );
  }

  /* ── Compact layout (inside SectionCard) ── */
  if (variant === "compact") {
    return (
      <div className="space-y-4">
        {/* Collapsible tier table */}
        <button
          onClick={() => setShowTable(s => !s)}
          className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-border bg-muted hover:bg-border hover:border-input transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Tag size={12} className="text-primary-ink" />
            </span>
            Volume Pricing
            <span className="text-muted-foreground font-medium">
              · {tiers.length} tiers · {fmt(tiers[tiers.length - 1].unit_price)}–{fmt(tiers[0].unit_price)}/pc
            </span>
          </div>
          {showTable ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {showTable && (
          <TierTable
            tiers={tiers}
            activeTier={activeTier}
            baseTierPrice={baseTierPrice}
            onJumpToTier={jumpToTier}
          />
        )}

        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Select Quantity</p>
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
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Tag size={12} className="text-primary-ink" /> Quantity Breaks
          </p>
          <TierTable
            tiers={tiers}
            activeTier={activeTier}
            baseTierPrice={baseTierPrice}
            onJumpToTier={jumpToTier}
          />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Package size={12} className="text-primary-ink" /> Your Order
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
            saving={saving}
            activeTier={activeTier}
          />
        </div>
      </div>
    </div>
  );
}