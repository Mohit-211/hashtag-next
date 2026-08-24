// components/common/AddProductConfigurationModal.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSageUnitPriceWithMarkup, parseSageMeta } from "../customization/Sagequantitypricing";
import { calculateVariantTotal, sumVariantTotals, formatMoney } from "../customization/pricing";
import { getPromoMinQty, getMaterialPrintTotal, getDigitizingFee, SpColorCount } from "../customization/Productcustomizationpage";

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
  productId: number;
  productName: string;
  variants?: Variant[];
  sizes?: Size[];
  selectedVariant?: Variant;
  mode: "customized" | "premade";
  isSubmitting?: boolean;
  decorationUnitPrice?: number;
  selectedMaterial?: string;
  selectedLocations?: string[];
  spColorCount?: SpColorCount;
  dtgStyle?: string;
  isApparel?: boolean;
  isPromo?: boolean;
  isPreMade?: boolean;
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
  productId,
  productName,
  variants: variantsProp,
  sizes: sizesProp,
  selectedVariant,
  mode = "premade",
  isSubmitting = false,
  decorationUnitPrice = 0,
  selectedMaterial = "",
  selectedLocations = [],
  spColorCount = "1 Color",
  dtgStyle = "Front Regular",
  isApparel,
  isPromo,
  isPreMade,
  previousTotal = 0,
  previousQty = 0,
}: Props) {
  const variants = variantsProp ?? [];
  const sizes = sizesProp ?? [];

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

  const [rows, setRows] = useState<ConfigRow[]>([
    newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY),
  ]);

  useEffect(() => {
    if (!open) return;
    setRows([newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || uniqueColors.length === 0) return;
    setRows((prev) =>
      prev.map((r, i) =>
        i === 0 && !r.color ? { ...r, color: selectedVariant?.color ?? uniqueColors[0] } : r
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variants.length]);

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
    const hasTiers = !!(
      parsed &&
      Array.isArray((parsed as any).priceTiers) &&
      (parsed as any).priceTiers.length > 0
    );
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
      selectedMaterial as any,
      selectedLocations,
      qty,
      spColorCount,
      dtgStyle as any
    );
    if (total === null || qty <= 0) return { perUnit: 0, digitizingFee: 0 };
    const fee = getDigitizingFee(selectedMaterial as any, qty);
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
  const combinedTotal = previousTotal + totals.grandTotal;
  const combinedQty = previousQty + totalItems;

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

  const gridCols = productHasSizes ? "1fr 1fr 130px 36px" : "1fr 130px 36px";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === "customized" ? "Need to add more colors ?" : "Add to Cart"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[420px]">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-medium">
              Minimum quantity per row is {DEFAULT_MIN_QTY} pieces.
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading variants…
            </div>
          ) : (
            <>
              <div
                className="hidden sm:grid gap-2 px-0.5"
                style={{ gridTemplateColumns: gridCols }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Color</p>
                {productHasSizes && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Size</p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Quantity (min {DEFAULT_MIN_QTY})
                </p>
                <span />
              </div>

              <div className="space-y-2.5">
                {rows.map((row) => {
                  const rowSizes = row.color ? sizesForColor(row.color) : [];
                  const rowVariant = getVariantForRow(row);
                  const maxStock = rowVariant?.stock ?? 0;
                  const rowMin = effectiveMinFor(rowVariant);
                  const rowInvalid = row.color && (productHasSizes ? row.sizeId !== "" : true) && maxStock <= 0;
                  const belowMin = !!rowVariant && row.qty < rowMin;

                  return (
                    <div key={row.id}>
                      <div className="grid gap-2 items-center" style={{ gridTemplateColumns: gridCols }}>
                        <select
                          value={row.color}
                          onChange={(e) => updateRow(row.id, { color: e.target.value })}
                          className="h-11 rounded-xl border-2 border-gray-200 px-3 text-sm font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none"
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
                            value={row.sizeId}
                            onChange={(e) => {
                              const newSizeId = e.target.value ? Number(e.target.value) : "";
                              const v = newSizeId
                                ? variants.find((vv) => vv.color === row.color && vv.size_id === newSizeId)
                                : undefined;
                              updateRow(row.id, { sizeId: newSizeId, qty: effectiveMinFor(v) });
                            }}
                            disabled={!row.color}
                            className="h-11 rounded-xl border-2 border-gray-200 px-3 text-sm font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none disabled:opacity-40"
                          >
                            <option value="">Select size…</option>
                            {rowSizes.map(({ size, available }) => (
                              <option key={size.id} value={size.id} disabled={!available}>
                                {size.name}
                              </option>
                            ))}
                          </select>
                        )}

                        <div
                          className={cn(
                            "flex items-center border-2 rounded-xl overflow-hidden h-11",
                            rowInvalid ? "border-gray-100 opacity-40" : "border-gray-200"
                          )}
                        >
                          <button
                            disabled={!rowVariant || maxStock <= 0 || row.qty <= rowMin}
                            onClick={() => setRowQty(row.id, row.qty - 1, maxStock, rowMin)}
                            className="w-9 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            value={row.qty}
                            min={rowMin}
                            disabled={!rowVariant || maxStock <= 0}
                            onChange={(e) => setRowQty(row.id, Number(e.target.value), maxStock, rowMin)}
                            onBlur={(e) => setRowQty(row.id, Number(e.target.value), maxStock, rowMin)}
                            className="flex-1 w-full text-center text-sm font-black text-gray-900 outline-none bg-transparent disabled:opacity-40"
                          />
                          <button
                            disabled={!rowVariant || maxStock <= 0}
                            onClick={() => setRowQty(row.id, row.qty + 1, maxStock, rowMin)}
                            className="w-9 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 hover:border-red-200 disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {belowMin && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 pl-0.5">
                          Minimum quantity for this row is {rowMin}.
                        </p>
                      )}
                      {rowVariant && maxStock > 0 && maxStock < rowMin && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 pl-0.5">
                          Only {maxStock} in stock — below the {rowMin}-pc minimum. This row won't be included.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={addRow}
                className="w-full h-10 rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:border-[#F5D800] hover:text-[#b89000] hover:bg-[#FFFBEA] transition-all"
              >
                <Plus size={14} /> Add another row
              </button>

              {/* Price breakdown per row */}
              {hasSelectedSizes && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    {productHasSizes ? "Size Breakdown" : "Color Breakdown"}
                  </div>
                  {validRows.map((row, idx) => {
                    const s = selectedSizesData[idx];
                    const sizeObj = productHasSizes ? sizes.find((sz) => sz.id === row.sizeId) : null;
                    return (
                      <div key={row.id} className="px-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-700 px-1 text-center leading-tight flex-shrink-0">
                              {sizeObj?.name ?? row.color.slice(0, 3)}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {row.color}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 pl-9">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>Product price</span>
                            <span>${formatMoney(s.unit_price * s.quantity + s.decoration_price * s.quantity)}</span>
                          </div>
                        </div>
                        {s.digitizing_fee > 0 && (
                          <div className="mt-1 pl-9">
                            <div className="flex items-center justify-between text-[10px] text-[#b89000] font-semibold">
                              <span>Digitizing Fee (one-time, free on 12+ pcs)</span>
                              <span>${formatMoney(s.digitizing_fee)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-700">Total — {totalItems} pcs</span>
                    <span className="text-xs font-black text-gray-900">${formatMoney(totals.grandTotal)}</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gray-900 text-white p-4">
                <div className="space-y-2">
                  {previousTotal > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Already in cart ({previousQty} pcs)</span>
                      <span>${formatMoney(previousTotal)}</span>
                    </div>
                  )}
                  {hasSelectedSizes && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>This selection ({totalItems} pcs)</span>
                      <span>${formatMoney(totals.grandTotal)}</span>
                    </div>
                  )}
                  {/* <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold">Estimated Total</span>
                    <span className="text-xl font-black text-[#F5D800]">
                      {hasSelectedSizes || previousTotal > 0 ? `$${formatMoney(combinedTotal)}` : "—"}
                    </span>
                  </div> */}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-5">
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 h-12 font-bold uppercase tracking-widest rounded-lg border-2 border-gray-900 text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={handleAdd}
              disabled={isSubmitting || !hasSelectedSizes}
              className={cn(
                "flex-1 h-12 font-bold uppercase tracking-widest rounded-lg transition-all",
                isSubmitting || !hasSelectedSizes
                  ? "bg-[#F5D800]/40 text-gray-500 cursor-not-allowed"
                  : "bg-[#F5D800] text-black hover:bg-[#e5c200] active:scale-[0.98]"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Adding…
                </span>
              ) : (
                "Add"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}