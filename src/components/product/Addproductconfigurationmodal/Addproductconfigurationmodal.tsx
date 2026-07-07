// components/common/AddProductConfigurationModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSageUnitPriceWithMarkup, } from "../customization/Sagequantitypricing";
import { calculateVariantTotal, sumVariantTotals, formatMoney } from "../customization/pricing";
import { getPromoMinQty } from "../customization/Productcustomizationpage";
// import { getSageUnitPriceWithMarkup } from "../product/customization/Sagequantitypricing";
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
  meta?: string | null; // ← Sage tier-pricing meta (mirrors Productcustomizationpage's Variant)
}
interface SelectedSize {
  variant_id: number;
  quantity: number;
  size_name: string;
  unit_price: number;
  /** This modal never offers a decoration step — always 0. Kept explicit
   *  (rather than omitted) so every consumer can rely on the field being
   *  present and route it through calculateVariantTotal like every other
   *  screen, instead of assuming "no decoration" via a missing key. */
  decoration_price: number;
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
  selectedLocations?: any[];
  isApparel?: boolean;
  isPromo?: boolean;
  isPreMade?: boolean;
}
interface ConfigurationData {
  selectedColor: string;
  selectedSizes: SelectedSize[];
  addAlso: boolean; // true if user clicked "Add"/"Add to Cart", false if "Skip"
  totalQuantity: number;
  totalPrice: number;
  /** Always 0 from this modal — no decoration step exists here. Explicit
   *  so the parent page never has to guess/assume. */
  totalDecoration: number;
}
/* ── Default / floor quantity applied to every row in this modal.
   Mirrors the PROMO_MIN_QTY floor used on the customization page so
   "Add Variant" flows started from here never start below 100. ── */
/* ── A single row in the row-based selector ── */
interface ConfigRow {
  id: number;
  color: string;
  sizeId: number | "";
  qty: number;
}
let rowIdCounter = 1;
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
  isApparel,
  isPromo,
  isPreMade
}: Props) {
  const variants = variantsProp ?? [];
  const sizes = sizesProp ?? [];
  const PROMO_MIN_QTY =
    selectedVariant?.meta
      ? getPromoMinQty(selectedVariant.meta, selectedVariant.min_order_quantity)
      : (selectedVariant?.min_order_quantity ?? 1);

  const DEFAULT_MIN_QTY = isPromo
    ? PROMO_MIN_QTY
    : (selectedVariant?.min_order_quantity ?? 1);
  // TODO: Replace this with the actual decoration price passed from the parent.
  // const decorationUnitPrice = 0;
  /* ★ FIX — newRow lives inside the component (not at module scope) so it
     closes over the real, per-render DEFAULT_MIN_QTY (which depends on the
     isPromo prop). Referencing DEFAULT_MIN_QTY from a module-level function
     was a ReferenceError ("Cannot find name 'DEFAULT_MIN_QTY'"), since that
     binding only exists inside this component. */
  const newRow = (color = "", qty = DEFAULT_MIN_QTY): ConfigRow => ({
    id: rowIdCounter++,
    color,
    sizeId: "",
    qty,
  });
  /* ── Computed (product-level) ── */
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const allSizesSorted = [...sizes].sort((a, b) => a.id - b.id);
  const productHasSizes = allSizesSorted.length > 0;
  /* ── Row state — always starts at DEFAULT_MIN_QTY (100), never 1 ── */
  const [rows, setRows] = useState<ConfigRow[]>([
    newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY),
  ]);
  /* ── Reset on open — re-seed at DEFAULT_MIN_QTY every time the modal opens ── */
  useEffect(() => {
    if (!open) return;
    setRows([newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // Re-sync first row's color once variants finish loading (if it was empty)
  useEffect(() => {
    if (!open || uniqueColors.length === 0) return;
    setRows((prev) =>
      prev.map((r, i) =>
        i === 0 && !r.color
          ? { ...r, color: selectedVariant?.color ?? uniqueColors[0] }
          : r
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variants.length]);
  /* ── Row helpers ── */
  const getVariantForRow = (row: ConfigRow): Variant | undefined => {
    if (!row.color) return undefined;
    if (productHasSizes) {
      if (row.sizeId === "") return undefined;
      return variants.find(
        (v) => v.color === row.color && v.size_id === row.sizeId
      );
    }
    return variants.find((v) => v.color === row.color);
  };
  /* ── Effective floor for a row: the larger of DEFAULT_MIN_QTY and the
     variant's own backend min_order_quantity (never goes below 100) ── */
  const effectiveMinFor = (v?: Variant) =>
    Math.max(DEFAULT_MIN_QTY, v?.min_order_quantity ?? 1);
  const sizesForColor = (color: string) =>
    allSizesSorted.map((size) => {
      const v = variants.find((vv) => vv.color === color && vv.size_id === size.id);
      return { size, variant: v, available: (v?.stock ?? 0) > 0 };
    });
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      newRow(selectedVariant?.color ?? uniqueColors[0] ?? "", DEFAULT_MIN_QTY),
    ]);
  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const updateRow = (id: number, patch: Partial<ConfigRow>) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // Changing color invalidates the previously picked size and
        // resets quantity back to the 100 floor (not 1).
        if (patch.color !== undefined && patch.color !== r.color) {
          updated.sizeId = "";
          updated.qty = DEFAULT_MIN_QTY;
        }
        return updated;
      })
    );
  /* ── Quantity clamp: floor is always max(DEFAULT_MIN_QTY, variant min),
     ceiling is available stock (never below the floor even if stock is low —
     stock-too-low rows simply fail validation downstream and surface a message). ── */
  const setRowQty = (id: number, qty: number, max: number, min: number) => {
    const safeQty = Number.isFinite(qty) ? Math.floor(qty) : min;
    const clamped = Math.max(min, Math.min(safeQty, Math.max(max, min)));
    updateRow(id, { qty: clamped });
  };
  /* ── Build payload from valid rows ── */
  const validRows = rows.filter((r) => {
    if (!r.color || r.qty <= 0) return false;
    if (productHasSizes && r.sizeId === "") return false;
    const v = getVariantForRow(r);
    if (!v || v.stock <= 0) return false;
    const min = effectiveMinFor(v);
    if (r.qty < min) return false; // enforce the 100-floor (or higher backend min)
    return true;
  });
  /* ── Same pricing rule as Productcustomizationpage.tsx: if the variant has
      Sage tier-pricing meta, the unit price depends on the row's own quantity
      (getSageUnitPriceWithMarkup). Otherwise fall back to flat price — exactly
      the same fallback order the page uses (original_price → price → 0). ── */
  const unitPriceFor = (v: Variant, qty: number): number => {
    const flat = Number(v.price || 0);
    if (!v.meta) return flat;
    return getSageUnitPriceWithMarkup(v.meta, qty) ?? flat;
  };
  const selectedSizesData: SelectedSize[] = validRows.map((r) => {
    const v = getVariantForRow(r)!;
    const sizeObj = productHasSizes
      ? sizes.find((s) => s.id === r.sizeId)
      : null;
    const unitPrice = unitPriceFor(v, r.qty);
    const pricing = calculateVariantTotal({
      productPrice: unitPrice,
      decorationPrice: 0,
      quantity: r.qty,
    });
    return {
      variant_id: v.id,
      quantity: r.qty,
      size_name: sizeObj?.name ?? "",
      unit_price: unitPrice,
      decoration_price: decorationUnitPrice,
      line_total: pricing.total,
    };
  });
  const hasSelectedSizes = selectedSizesData.length > 0;
  const totalItems = selectedSizesData.reduce((sum, s) => sum + s.quantity, 0);
  const primaryColor = validRows[0]?.color ?? rows[0]?.color ?? "";
  const totals = sumVariantTotals(

    selectedSizesData.map((s) => ({
      productPrice: s.unit_price,
      decorationPrice: s.decoration_price,
      quantity: s.quantity,
    }))
  );
  console.log(selectedSizesData,"selectedSizesData")
  const totalPrice = totals.productTotal;
  const decorationTotal = totals.decorationTotal;
  const grandTotal = totals.total;
  console.log(mode, "mode")
  /* ── Handlers ── */
  const handleSkip = () => {
    // ★ Skip must NEVER add a decoration (or any) charge, and must never
    // create an empty/placeholder customization. Every field here is
    // explicit and zeroed — nothing is left for a parent/caller to infer,
    // and selectedSizes is empty so the parent's merge is a strict no-op
    // (the page's existing configuredVariants pass through unchanged).
    onConfirm({
      selectedColor: primaryColor,
      selectedSizes: [],           // empty for skip
      addAlso: false,
      totalQuantity: 0,
      totalPrice: 0,
      totalDecoration: 0,
    });
  };
  const handleAdd = async () => {
    if (!hasSelectedSizes) return;
    await onConfirm({
      selectedColor: primaryColor,
      selectedSizes: selectedSizesData,
      addAlso: true,
      totalQuantity: totalItems,
      totalPrice: grandTotal,
      totalDecoration: decorationTotal,
    });
  };
  if (!open) return null;
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
        {/* ── Header ── */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === "customized" ? "Complete Your Order" : "Add to Cart"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[420px]">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {/* ── Body ── */}
        <div className="p-5 space-y-5">
          {/* Mode note for customized */}
          {mode === "customized" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                You can optionally add pre-made sizes to your customized order.
              </p>
            </div>
          )}
          {/* Min-qty hint */}
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
              {/* ── Column headers ── */}
              <div
                className="hidden sm:grid gap-2 px-0.5"
                style={{
                  gridTemplateColumns: productHasSizes
                    ? "1fr 1fr 130px 36px"
                    : "1fr 130px 36px",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Color
                </p>
                {productHasSizes && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Size
                  </p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Quantity (min {DEFAULT_MIN_QTY})
                </p>
                <span />
              </div>
              {/* ── Rows ── */}
              <div className="space-y-2.5">
                {rows.map((row) => {
                  const rowSizes = row.color ? sizesForColor(row.color) : [];
                  const rowVariant = getVariantForRow(row);
                  const maxStock = rowVariant?.stock ?? 0;
                  const rowMin = effectiveMinFor(rowVariant);
                  const rowInvalid =
                    row.color && (productHasSizes ? row.sizeId !== "" : true) && maxStock <= 0;
                  const belowMin = !!rowVariant && row.qty < rowMin;
                  return (
                    <div key={row.id}>
                      <div
                        className="grid gap-2 items-center"
                        style={{
                          gridTemplateColumns: productHasSizes
                            ? "1fr 1fr 130px 36px"
                            : "1fr 130px 36px",
                        }}
                      >
                        {/* Color dropdown */}
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
                        {/* Size dropdown (only if product has sizes) */}
                        {productHasSizes && (
                          <select
                            value={row.sizeId}
                            onChange={(e) => {
                              const newSizeId = e.target.value ? Number(e.target.value) : "";
                              const v = newSizeId
                                ? variants.find(
                                  (vv) => vv.color === row.color && vv.size_id === newSizeId
                                )
                                : undefined;
                              updateRow(row.id, {
                                sizeId: newSizeId,
                                // Default the new row's qty to the 100-floor
                                // (or the variant's own min if it's higher),
                                // never to 1.
                                qty: effectiveMinFor(v),
                              });
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
                        {/* Quantity stepper */}
                        <div
                          className={cn(
                            "flex items-center border-2 rounded-xl overflow-hidden h-11",
                            rowInvalid ? "border-gray-100 opacity-40" : "border-gray-200"
                          )}
                        >
                          <button
                            disabled={!rowVariant || maxStock <= 0 || row.qty <= rowMin}
                            onClick={() =>
                              setRowQty(row.id, row.qty - 1, maxStock, rowMin)
                            }
                            className="w-9 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            value={row.qty}
                            min={rowMin}
                            disabled={!rowVariant || maxStock <= 0}
                            onChange={(e) =>
                              setRowQty(row.id, Number(e.target.value), maxStock, rowMin)
                            }
                            onBlur={(e) =>
                              setRowQty(row.id, Number(e.target.value), maxStock, rowMin)
                            }
                            className="flex-1 w-full text-center text-sm font-black text-gray-900 outline-none bg-transparent disabled:opacity-40"
                          />
                          <button
                            disabled={!rowVariant || maxStock <= 0}
                            onClick={() =>
                              setRowQty(row.id, row.qty + 1, maxStock, rowMin)
                            }
                            className="w-9 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {/* Remove row */}
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
              {/* ── Add row button ── */}
              <button
                onClick={addRow}
                className="w-full h-10 rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:border-[#F5D800] hover:text-[#b89000] hover:bg-[#FFFBEA] transition-all"
              >
                <Plus size={14} /> Add another row
              </button>
              {/* ── Breakdown — matches Order Summary style on the customization page ── */}
              {hasSelectedSizes && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    {productHasSizes ? "Size Breakdown" : "Color Breakdown"}
                  </div>
                  {validRows.map((row) => {
                    const v = getVariantForRow(row)!;
                    const sizeObj = productHasSizes
                      ? sizes.find((s) => s.id === row.sizeId)
                      : null;
                    const unitPrice = unitPriceFor(v, row.qty);
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-700 px-1 text-center leading-tight">
                            {sizeObj?.name ?? row.color.slice(0, 3)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {row.color}
                            {sizeObj ? ` · ${sizeObj.name}` : ""} · ×{row.qty}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* <span className="text-xs font-bold text-gray-700">
                            $
                            {formatMoney(
                              calculateVariantTotal({
                                productPrice: unitPrice,
                                decorationPrice: 0,
                                quantity: row.qty,
                              }).productTotal
                            )}
                          </span> */}

                          {/* {isApparel && decorationUnitPrice > 0 && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-gray-500">
                                Decoration ({row.qty} × ${formatMoney(decorationUnitPrice)})
                                {selectedMaterial === "embroidery" && row.qty <= 11
                                  ? " incl. $35 digitizing"
                                  : selectedLocations.length > 1
                                    ? ` · ${selectedLocations.length} loc.`
                                    : ""}
                              </span>

                              <span className="font-bold text-gray-900">
                                $
                                {formatMoney(
                                  calculateVariantTotal({
                                    productPrice: 0,
                                    decorationPrice: decorationUnitPrice,
                                    quantity: row.qty,
                                  }).decorationTotal
                                )}
                              </span>
                            </div>
                          )} */}
                          {/* <span className="text-xs font-black text-[#F5D800]">
    Total $
    {formatMoney(
      calculateVariantTotal({
        productPrice: unitPrice,
        decorationPrice: decorationUnitPrice,
        quantity: row.qty,
      }).total
    )}
  </span> */}
                        </div>
                      </div>
                    );
                  })}
                  {/* <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-700">
                      {totalItems} total {totalItems === 1 ? "piece" : "pieces"}
                    </span>
                 <span className="text-xs font-black text-gray-900">
  ${formatMoney(grandTotal)}
</span>
                  </div> */}
                </div>
              )}
              {/* ── Estimated Total — dark card, same as customization page ── */}
              <div className="rounded-xl bg-gray-900 text-white p-4">
                <div className="space-y-2">
                  {/* {isApparel &&
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-70">Product Total</span>
                        <span>${formatMoney(totalPrice)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-70">Decoration Total</span>
                        <span>${formatMoney(decorationTotal)}</span>
                      </div>
                    </>
                  } */}
                  <div className=" border-gray-700 pt-2 flex items-center justify-between">
                    <span className="text-sm font-bold">Estimated Total</span>
                    <span className="text-xl font-black text-[#F5D800]">
                      {hasSelectedSizes
                        ? `$${formatMoney(grandTotal)}`
                        : "—"}
                    </span>
                  </div>
                  {hasSelectedSizes && (
                    <p className="text-[10px] text-gray-400">
                      ${formatMoney(grandTotal / Math.max(totalItems, 1))}/pc ·{" "}
                      {totalItems.toLocaleString()} units
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        {/* ── Footer Actions ── */}
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