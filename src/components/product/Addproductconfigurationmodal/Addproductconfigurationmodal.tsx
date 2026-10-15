// components/common/AddProductConfigurationModal.tsx
"use client";
import React, { useState, useMemo } from "react";
import { X, Plus, Minus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSageUnitPriceWithMarkup, parseSageMeta } from "../customization/Sagequantitypricing";
import { calculateVariantTotal, sumVariantTotals, formatMoney } from "../customization/pricing";
import { getPromoMinQty } from "../customization/Productcustomizationpage";
import { getMaterialPrintTotal, getDigitizingFee, type MaterialId, type SpColorCount } from "../customization/pricing";

/* ─────────────────────────────────────────── Types ── */
interface Size {
  id: number;
  name: string;
  measurements?: string;
}
interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}
interface Variant {
  id: number;
  product_id: number;
  sku: string;
  color: string;
  color_code: string;
  size: string | null;
  size_id: number | null;
  price: number;
  original_price?: number | string;
  stock: number;
  min_order_quantity: number;
  images: VariantImage[];
  size_details: Size | null;
  meta?: string | null;
}

/** Per-row price breakdown. `decoration_price` and `digitizing_fee` are
 *  ALWAYS kept separate: decoration_price is a genuine per-unit price
 *  (tier-based, scales with quantity), while digitizing_fee is a flat,
 *  one-time charge (embroidery only, qty <= 11) that must never be
 *  divided by / multiplied by quantity. */
interface SelectedSize {
  variant_id: number;
  quantity: number;
  size_name: string;
  unit_price: number;
  decoration_price: number;
  digitizing_fee: number;
  line_total: number;
}
interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: ConfigurationData) => void | Promise<void>;
  productName: string;
  variants?: Variant[];
  sizes?: Size[];
  selectedVariant?: Variant;
  mode: "customized" | "premade";
  isSubmitting?: boolean;
  selectedMaterial?: MaterialId | null;
  selectedLocations?: string[];
  spColorCount?: SpColorCount;
  dtgStyle?: string;
  isApparel?: boolean;
  isPromo?: boolean;
  /** The grand total already locked in from previously configured/added
   *  variants (e.g. Color A added on a prior pass). The modal's
   *  "Estimated Total" is this + whatever is being selected right now,
   *  so it always shows the true running cart total. */
  previousTotal?: number;
  previousQty?: number;
}
interface ConfigurationData {
  selectedColor: string;
  selectedSizes: SelectedSize[];
  addAlso: boolean;
  totalQuantity: number;
  /** Σ(unit_price × quantity) across all valid rows. */
  totalProductPrice: number;
  /** Σ(decoration_price × quantity) across all valid rows — excludes digitizing fees. */
  totalDecoration: number;
  /** Σ(digitizing_fee) across all valid rows — flat, not quantity-scaled. */
  totalDigitizingFee: number;
  /** totalProductPrice + totalDecoration + totalDigitizingFee. */
  totalPrice: number;
}
interface ConfigRow {
  id: number;
  color: string;
  sizeId: number | "";
  qty: number;
}

let rowIdCounter = 1;

/** Resolves a variant's charge price. Mirrors the main customization
 *  page's getVariantPrice exactly (price first, falls back to 0) so the
 *  two screens can never disagree on what a variant costs. */
const getVariantPrice = (v?: { price?: number | string } | null): number => {
  if (!v) return 0;
  if (v.price !== undefined && v.price !== null && v.price !== "") {
    const n = Number(v.price);
    if (!Number.isNaN(n)) return n;
  }
  return Number(v.price ?? 0);
};

export default function AddProductConfigurationModal({
  open,
  onClose,
  onConfirm,
  productName,
  variants: variantsProp,
  sizes: sizesProp,
  selectedVariant,
  mode = "premade",
  isSubmitting = false,
  selectedMaterial = null,
  selectedLocations = [],
  spColorCount = "1 Color",
  dtgStyle = "Front Regular",
  isApparel,
  isPromo,
  previousTotal = 0,
  previousQty = 0,
}: Props) {
  const variants = useMemo(() => variantsProp ?? [], [variantsProp]);
  const sizes = useMemo(() => sizesProp ?? [], [sizesProp]);

  const PROMO_MIN_QTY = selectedVariant?.meta
    ? getPromoMinQty(selectedVariant.meta, selectedVariant.min_order_quantity)
    : (selectedVariant?.min_order_quantity ?? 1);

  const DEFAULT_MIN_QTY = isPromo ? PROMO_MIN_QTY : (selectedVariant?.min_order_quantity ?? 1);

  const newRow = (color = "", qty = DEFAULT_MIN_QTY): ConfigRow => ({
    id: rowIdCounter++,
    color,
    sizeId: "",
    qty,
  });

  const uniqueColors = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))],
    [variants]
  );
  const allSizesSorted = useMemo(() => [...sizes].sort((a, b) => a.id - b.id), [sizes]);
  const productHasSizes = allSizesSorted.length > 0;

  // Callers mount this modal only while it's open, so every opening starts
  // with a single fresh row.
  const [rows, setRows] = useState<ConfigRow[]>(() => [
    newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY),
  ]);

  // Variants that arrive after opening fill in the first row's colour.
  const [seenVariantCount, setSeenVariantCount] = useState(variants.length);
  if (variants.length !== seenVariantCount) {
    setSeenVariantCount(variants.length);
    if (uniqueColors.length > 0) {
      setRows((prev) =>
        prev.map((r, i) =>
          i === 0 && !r.color ? { ...r, color: selectedVariant?.color ?? uniqueColors[0] } : r
        )
      );
    }
  }

  const getVariantForRow = (row: ConfigRow): Variant | undefined => {
    if (!row.color) return undefined;
    if (productHasSizes) {
      if (row.sizeId === "") return undefined;
      return variants.find((v) => v.color === row.color && v.size_id === row.sizeId);
    }
    return variants.find((v) => v.color === row.color);
  };

  const effectiveMinFor = (v?: Variant) => Math.max(DEFAULT_MIN_QTY, v?.min_order_quantity ?? 1);

  const sizesForColor = (color: string) =>
    allSizesSorted.map((size) => {
      const v = variants.find((vv) => vv.color === color && vv.size_id === size.id);
      return { size, variant: v, available: (v?.stock ?? 0) > 0 };
    });

  const addRow = () =>
    setRows((prev) => [...prev, newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY)]);

  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const updateRow = (id: number, patch: Partial<ConfigRow>) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        if (patch.color !== undefined && patch.color !== r.color) {
          updated.sizeId = "";
          updated.qty = DEFAULT_MIN_QTY;
        }
        return updated;
      })
    );

  const setRowQty = (id: number, qty: number, max: number, min: number) => {
    const safeQty = Number.isFinite(qty) ? Math.floor(qty) : min;
    const clamped = Math.max(min, Math.min(safeQty, Math.max(max, min)));
    updateRow(id, { qty: clamped });
  };

  const validRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!r.color || r.qty <= 0) return false;
        if (productHasSizes && r.sizeId === "") return false;
        const v = getVariantForRow(r);
        if (!v || v.stock <= 0) return false;
        const min = effectiveMinFor(v);
        if (r.qty < min) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, variants, productHasSizes, DEFAULT_MIN_QTY]
  );

  /** Promo tiered pricing (per unit), falls back to the flat variant price
   *  when the variant has no SAGE tier meta. */
  const unitPriceFor = (v: Variant, qty: number): number => {
    const flat = getVariantPrice(v);
    if (!isPromo) return flat;
    const parsed = parseSageMeta(v.meta ?? null);
    const hasTiers = Array.isArray(parsed?.netTiers) && parsed.netTiers.length > 0;
    if (!hasTiers) return flat;
    return getSageUnitPriceWithMarkup(v.meta, qty) ?? flat;
  };

  /** Decoration is recalculated PER ROW at that row's own quantity, since
   *  Embroidery/DTF/Screen Print/DTG are all tiered by qty. Delegates to
   *  the same getMaterialPrintTotal + getDigitizingFee the main
   *  customization page uses, so the two screens can never drift apart.
   *
   *  The one-time digitizing fee is subtracted out BEFORE dividing by
   *  quantity, and returned separately — never folded into the per-unit
   *  decoration price. */
  const rowDecoration = (qty: number): { perUnit: number; digitizingFee: number } => {
    if (!isApparel || !selectedMaterial || selectedLocations.length === 0) {
      return { perUnit: 0, digitizingFee: 0 };
    }
    const total = getMaterialPrintTotal(
      selectedMaterial,
      selectedLocations,
      qty,
      spColorCount,
      dtgStyle
    );
    if (total === null || qty <= 0) return { perUnit: 0, digitizingFee: 0 };
    const fee = getDigitizingFee(selectedMaterial, qty);
    const decorationOnly = total - fee;
    return { perUnit: decorationOnly / qty, digitizingFee: fee };
  };

  const selectedSizesData: SelectedSize[] = useMemo(
    () =>
      validRows.map((r) => {
        const v = getVariantForRow(r)!;
        const sizeObj = productHasSizes ? sizes.find((s) => s.id === r.sizeId) : null;
        const unitPrice = unitPriceFor(v, r.qty);
        const { perUnit: decorationPrice, digitizingFee } = rowDecoration(r.qty);
        const pricing = calculateVariantTotal({
          productPrice: unitPrice,
          decorationPrice,
          quantity: r.qty,
        });
        return {
          variant_id: v.id,
          quantity: r.qty,
          size_name: sizeObj?.name ?? "",
          unit_price: unitPrice,
          decoration_price: decorationPrice,
          digitizing_fee: digitizingFee,
          // digitizing fee is flat — added once, never multiplied by qty
          line_total: pricing.total + digitizingFee,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validRows, isPromo, isApparel, selectedMaterial, selectedLocations, spColorCount, dtgStyle, sizes, productHasSizes]
  );

  const hasSelectedSizes = selectedSizesData.length > 0;
  const totalItems = selectedSizesData.reduce((sum, s) => sum + s.quantity, 0);
  const primaryColor = validRows[0]?.color ?? rows[0]?.color ?? "";

  const totals = useMemo(() => {
    const base = sumVariantTotals(
      selectedSizesData.map((s) => ({
        productPrice: s.unit_price,
        decorationPrice: s.decoration_price,
        quantity: s.quantity,
      }))
    );
    const digitizingFeeTotal = selectedSizesData.reduce((sum, s) => sum + s.digitizing_fee, 0);
    return {
      productTotal: base.productTotal,
      decorationTotal: base.decorationTotal,
      digitizingFeeTotal,
      grandTotal: base.total + digitizingFeeTotal,
    };
  }, [selectedSizesData]);

  // Combined total = whatever was already locked in (previousTotal, from
  // parent) + this modal's own current selection. This is what
  // "Estimated Total" displays, and it's what's true the instant "Add"
  // is clicked.

  const handleSkip = () => {
    onConfirm({
      selectedColor: primaryColor,
      selectedSizes: [],
      addAlso: false,
      totalQuantity: 0,
      totalProductPrice: 0,
      totalDecoration: 0,
      totalDigitizingFee: 0,
      totalPrice: 0,
    });
  };

  const handleAdd = async () => {
    if (!hasSelectedSizes) return;
    await onConfirm({
      selectedColor: primaryColor,
      selectedSizes: selectedSizesData,
      addAlso: true,
      totalQuantity: totalItems,
      totalProductPrice: totals.productTotal,
      totalDecoration: totals.decorationTotal,
      totalDigitizingFee: totals.digitizingFeeTotal,
      totalPrice: totals.grandTotal,
    });
  };

  if (!open) return null;

  const isCustomized = mode === "customized";
  const gridCols = productHasSizes ? "1fr 1fr 128px 36px" : "1fr 128px 36px";
  const pcs = (n: number) => `${n} ${n === 1 ? "pc" : "pcs"}`;
  const orderTotal = previousTotal + (hasSelectedSizes ? totals.grandTotal : 0);
  const orderQty = previousQty + (hasSelectedSizes ? totalItems : 0);
  const canAdd = hasSelectedSizes && !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <h2 id="config-modal-title" className="text-lg font-bold text-foreground">
              {isCustomized ? "Add more colors or sizes?" : "Choose colors & sizes"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCustomized
                ? "Your design will be printed on these too. Don't need any? Skip this step."
                : productName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isCustomized && previousQty > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">Your current selection</p>
                <p className="truncate text-xs text-muted-foreground">
                  {pcs(previousQty)} of {productName}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">${formatMoney(previousTotal)}</span>
            </div>
          )}

          {variants.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading options…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden gap-2 px-0.5 sm:grid" style={{ gridTemplateColumns: gridCols }}>
                <p className="text-xs font-semibold text-muted-foreground">Color</p>
                {productHasSizes && <p className="text-xs font-semibold text-muted-foreground">Size</p>}
                <p className="text-xs font-semibold text-muted-foreground">
                  Quantity{DEFAULT_MIN_QTY > 1 ? ` (min ${DEFAULT_MIN_QTY})` : ""}
                </p>
                <span />
              </div>

              {rows.map((row) => {
                const rowSizes = row.color ? sizesForColor(row.color) : [];
                const rowVariant = getVariantForRow(row);
                const maxStock = rowVariant?.stock ?? 0;
                const rowMin = effectiveMinFor(rowVariant);
                const rowInvalid = row.color && (productHasSizes ? row.sizeId !== "" : true) && maxStock <= 0;
                const belowMin = !!rowVariant && row.qty < rowMin;
                const fieldClass =
                  "h-11 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50";

                return (
                  <div key={row.id}>
                    <div
                      className="grid grid-cols-2 items-center gap-2 sm:grid-cols-(--row-grid-cols)"
                      style={{ "--row-grid-cols": gridCols } as React.CSSProperties}
                    >
                      <select
                        aria-label="Color"
                        value={row.color}
                        onChange={(e) => updateRow(row.id, { color: e.target.value })}
                        className={cn(fieldClass, "col-span-2 sm:col-span-1")}
                      >
                        <option value="">Select color…</option>
                        {uniqueColors.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      {productHasSizes && (
                        <select
                          aria-label="Size"
                          value={row.sizeId}
                          onChange={(e) => {
                            const newSizeId = e.target.value ? Number(e.target.value) : "";
                            const v = newSizeId
                              ? variants.find((vv) => vv.color === row.color && vv.size_id === newSizeId)
                              : undefined;
                            updateRow(row.id, { sizeId: newSizeId, qty: effectiveMinFor(v) });
                          }}
                          disabled={!row.color}
                          className={cn(fieldClass, "col-span-2 sm:col-span-1")}
                        >
                          <option value="">Select size…</option>
                          {rowSizes.map(({ size, available }) => (
                            <option key={size.id} value={size.id} disabled={!available}>
                              {size.name}
                              {available ? "" : " (out of stock)"}
                            </option>
                          ))}
                        </select>
                      )}

                      <div
                        className={cn(
                          "flex h-11 items-center overflow-hidden rounded-lg border border-input",
                          rowInvalid && "opacity-50"
                        )}
                      >
                        <button
                          aria-label="Decrease quantity"
                          disabled={!rowVariant || maxStock <= 0 || row.qty <= rowMin}
                          onClick={() => setRowQty(row.id, row.qty - 1, maxStock, rowMin)}
                          className="flex h-full w-9 items-center justify-center text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          aria-label="Quantity"
                          value={row.qty}
                          min={rowMin}
                          disabled={!rowVariant || maxStock <= 0}
                          onChange={(e) => setRowQty(row.id, Number(e.target.value), maxStock, rowMin)}
                          onBlur={(e) => setRowQty(row.id, Number(e.target.value), maxStock, rowMin)}
                          className="w-full flex-1 bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          aria-label="Increase quantity"
                          disabled={!rowVariant || maxStock <= 0}
                          onClick={() => setRowQty(row.id, row.qty + 1, maxStock, rowMin)}
                          className="flex h-full w-9 items-center justify-center text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        aria-label="Remove row"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive disabled:invisible"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {belowMin && (
                      <p className="mt-1 text-xs text-destructive">Minimum for this item is {rowMin}.</p>
                    )}
                    {rowVariant && maxStock > 0 && maxStock < rowMin && (
                      <p className="mt-1 text-xs text-destructive">
                        Only {maxStock} in stock, below the {rowMin}-piece minimum, so this row can&apos;t be added.
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addRow}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground"
              >
                <Plus size={15} /> Add another {productHasSizes ? "color or size" : "color"}
              </button>
            </div>
          )}

          {/* What's being added, and the resulting order total */}
          {hasSelectedSizes && (
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              {validRows.map((row, idx) => {
                const s = selectedSizesData[idx];
                const sizeObj = productHasSizes ? sizes.find((sz) => sz.id === row.sizeId) : null;
                return (
                  <div key={row.id} className="flex items-center justify-between gap-3 text-muted-foreground">
                    <span className="truncate">
                      {row.color}
                      {sizeObj ? ` · ${sizeObj.name}` : ""} × {s.quantity}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      ${formatMoney((s.unit_price + s.decoration_price) * s.quantity)}
                    </span>
                  </div>
                );
              })}
              {totals.digitizingFeeTotal > 0 && (
                <div className="flex items-center justify-between gap-3 text-muted-foreground">
                  <span>Digitizing fee (waived from 12 pcs)</span>
                  <span className="shrink-0 tabular-nums">${formatMoney(totals.digitizingFeeTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 pt-1 font-semibold text-foreground">
                <span>{isCustomized && previousQty > 0 ? `Order total · ${pcs(orderQty)}` : `Total · ${pcs(orderQty)}`}</span>
                <span className="shrink-0 text-base tabular-nums">${formatMoney(orderTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-lg border border-input text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {isCustomized ? "Skip" : "Cancel"}
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={cn(
              "h-11 flex-1 rounded-lg text-sm font-semibold transition",
              canAdd
                ? "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98]"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Adding…
              </span>
            ) : hasSelectedSizes ? (
              `Add ${pcs(totalItems)}`
            ) : isCustomized ? (
              "Pick a color to add"
            ) : (
              "Pick a color & size"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
