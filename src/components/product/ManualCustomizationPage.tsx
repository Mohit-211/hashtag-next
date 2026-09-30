"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCustomizationsApi } from "@/api/operations/product.api";
import { AddToCartApi } from "@/api/operations/cart.api";
import { buildConfiguredCustomizationPayload, type ConfiguredVariant } from "@/components/common/AddToCartModal";
import {
  findManualTier,
  getManualUnitPrice,
  getPromoMinQty,
  parseManualMeta,
} from "@/components/product/customization/Productcustomizationpage";
import { calculateVariantTotal, formatMoney } from "@/components/product/customization/pricing";

/* ── GET customization-option/product/:id/customizations ── */
interface CustomizationTier {
  id: number;
  min_quantity: number;
  max_quantity: number | null;
  price: string;
  is_active: boolean;
}
interface CustomizationOptionValue {
  id: number;
  customization_option_id: number;
  name: string;
  pricing_type: "FIXED" | "TIERED";
  fixed_price: string | null;
  is_active: boolean;
  pricing?: CustomizationTier[];
}
interface CustomizationOption {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  allow_text_input: boolean;
  allow_image_upload: boolean;
  is_active: boolean;
  /** Every value the option defines, with its pricing tiers. */
  values: CustomizationOptionValue[];
}
interface ProductCustomization {
  id: number;
  product_id: number;
  customization_option_id: number;
  is_active: boolean;
  option: CustomizationOption;
  /** The subset of option values enabled for this product. */
  values: {
    id: number;
    customization_option_value_id: number;
    is_active: boolean;
    value: CustomizationOptionValue;
  }[];
}

interface Selection {
  valueId: number | null;
  text: string;
  file: File | null;
}

export interface ManualCustomizationVariant {
  id: number;
  price: string | number;
  size?: string | null;
  size_id?: number | null;
  stock?: number | null;
  min_order_quantity?: number | null;
  meta?: string | null;
  images?: unknown[];
}

const TEXT_MAX = 100;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Per-unit price of a value at the given quantity. */
const getValueUnitPrice = (value: CustomizationOptionValue, qty: number): number => {
  if (value.pricing_type === "TIERED") {
    const tiers = (value.pricing ?? [])
      .filter((t) => t.is_active !== false)
      .map((t) => ({ min_qty: Number(t.min_quantity), max_qty: t.max_quantity, price: Number(t.price) }))
      .sort((a, b) => a.min_qty - b.min_qty);
    return findManualTier(tiers, qty)?.price ?? 0;
  }
  return Number(value.fixed_price ?? 0) || 0;
};

/** Customization for MANUAL-supplier products, rendered inline on the product
 * page: pick a value per option (+ optional text / logo), pick a quantity,
 * then add to cart with the selections in the cart customization payload. */
export default function ManualCustomizationPage({
  productId,
  variant,
  variantLabel,
  inCart,
  onBeforeAdd,
  onAdded,
}: {
  productId: string | number;
  variant: ManualCustomizationVariant;
  /** Human label for the selected variant, e.g. "10 / A4 / Pink". */
  variantLabel: string;
  inCart?: boolean;
  /** Return true to block the add (e.g. login required). */
  onBeforeAdd?: () => boolean;
  onAdded?: () => void;
}) {
  const [customizations, setCustomizations] = useState<ProductCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selections, setSelections] = useState<Record<number, Selection>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const res = await ProductCustomizationsApi(productId);
        const data: ProductCustomization[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (!cancelled) {
          setCustomizations(data);
          setSelections({});
          setShowErrors(false);
        }
      } catch {
        // The API client already toasts the failure.
        if (!cancelled) {
          setCustomizations([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey]);

  // Active options with their enabled values, priced from option.values
  // (only that copy carries the tier table).
  const groups = useMemo(
    () =>
      customizations
        .filter((c) => c.is_active !== false && c.option?.is_active !== false)
        .map((c) => {
          const full = new Map((c.option.values ?? []).map((v) => [v.id, v]));
          const values = (c.values ?? [])
            .filter((pv) => pv.is_active !== false && pv.value?.is_active !== false)
            .map((pv) => ({ ...pv.value, ...full.get(pv.customization_option_value_id) }))
            .filter((v): v is CustomizationOptionValue => !!v?.id);
          return { customization: c, option: c.option, values };
        })
        .filter((g) => g.values.length > 0),
    [customizations]
  );

  /* ── quantity (same rules as the full customizer's MANUAL flow) ── */
  const manualMeta = useMemo(() => parseManualMeta(variant.meta), [variant.meta]);
  const minQty = getPromoMinQty(variant.meta, variant.min_order_quantity);
  // Tiered: capped at the last range's max_qty (unless open-ended) and stock.
  const tiers = manualMeta?.pricing_mode === "tiered" ? manualMeta.bulk_pricing : [];
  const tierMax = tiers.length > 0 ? tiers[tiers.length - 1].max_qty : null;
  const stockMax = variant.stock && variant.stock > 0 ? variant.stock : null;
  const maxQty =
    tierMax != null && stockMax != null ? Math.min(tierMax, stockMax) : (tierMax ?? stockMax);
  const inTierRange = (n: number) =>
    tiers.some((t) => n >= t.min_qty && (t.max_qty === null || n <= t.max_qty));
  const [qty, setQty] = useState(minQty);
  // Reset to the new minimum when the variant changes.
  const [qtyKey, setQtyKey] = useState(`${variant.id}:${minQty}`);
  if (qtyKey !== `${variant.id}:${minQty}`) {
    setQtyKey(`${variant.id}:${minQty}`);
    setQty(minQty);
  }
  const clampQty = (n: number) => {
    const safe = Math.max(minQty, Math.floor(Number.isFinite(n) ? n : minQty));
    return maxQty != null ? Math.min(safe, maxQty) : safe;
  };

  /* ── pricing ── */
  const basePrice = Number(variant.price) || 0;
  const productUnitPrice = getManualUnitPrice(manualMeta, qty, basePrice) ?? basePrice;
  const activeTier = tiers.length > 0 ? findManualTier(tiers, qty) : null;
  // quantity_fixed: the pack price is the price for the whole pack.
  const packPrice =
    manualMeta?.pricing_mode === "quantity_fixed"
      ? manualMeta.quantity_pricing.find((p) => p.quantity === qty)?.price ?? null
      : null;
  const selectedLines = groups
    .map((g) => {
      const sel = selections[g.customization.id];
      const value = g.values.find((v) => v.id === sel?.valueId);
      return value ? { group: g, value, sel: sel!, unitPrice: getValueUnitPrice(value, qty) } : null;
    })
    .filter((l): l is NonNullable<typeof l> => !!l);
  const decorationUnitPrice = selectedLines.reduce((sum, l) => sum + l.unitPrice, 0);
  const totals = calculateVariantTotal({
    productPrice: productUnitPrice,
    decorationPrice: decorationUnitPrice,
    quantity: qty,
  });

  const updateSelection = (id: number, patch: Partial<Selection>) =>
    setSelections((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { valueId: null, text: "", file: null }), ...patch },
    }));

  const handleFile = (id: number, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG…).");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    updateSelection(id, { file });
  };

  const missingGroups = groups.filter((g) => !selections[g.customization.id]?.valueId);

  const validate = (): boolean => {
    if (missingGroups.length > 0) {
      setShowErrors(true);
      toast.error(`Please select ${missingGroups.map((g) => g.option.name).join(", ")}.`);
      return false;
    }
    if (manualMeta?.pricing_mode === "quantity_fixed" && !manualMeta.quantity_pricing.some((p) => p.quantity === qty)) {
      toast.error("Please choose one of the available quantity packs.");
      return false;
    }
    if (tiers.length > 0 && !inTierRange(qty)) {
      toast.error(`No price is set for ${qty} pcs. Choose a quantity within one of the price ranges.`);
      return false;
    }
    if (qty < minQty) {
      toast.error(`Minimum order quantity is ${minQty}.`);
      return false;
    }
    if (maxQty != null && qty > maxQty) {
      toast.error(stockMax != null && qty > stockMax ? `Only ${stockMax} in stock.` : `Maximum order quantity is ${maxQty}.`);
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (onBeforeAdd?.()) return;
    if (!validate()) return;

    const configured: ConfiguredVariant = {
      variantId: variant.id,
      variantName: variantLabel,
      color: variantLabel,
      colorCode: "",
      images: variant.images ?? [],
      sizes: [
        {
          variant_id: variant.id,
          size_id: variant.size_id ?? null,
          size: variant.size || "—",
          quantity: qty,
          unit_price: productUnitPrice,
          decoration_unit_price: decorationUnitPrice,
        },
      ],
      totalQty: qty,
      totalPrice: totals.total,
      productTotal: totals.productTotal,
      decorationTotal: totals.decorationTotal,
    };

    const customization_options = selectedLines.map((l) => ({
      product_customization_id: l.group.customization.id,
      customization_option_id: l.group.option.id,
      option_name: l.group.option.name,
      option_value_id: l.value.id,
      value_name: l.value.name,
      pricing_type: l.value.pricing_type,
      unit_price: l.unitPrice,
      text: l.group.option.allow_text_input && l.sel.text.trim() ? l.sel.text.trim() : null,
      image: l.group.option.allow_image_upload && l.sel.file ? l.sel.file.name : null,
    }));

    const formData = new FormData();
    formData.append("product_id", String(productId));
    formData.append(
      "customization",
      JSON.stringify(buildConfiguredCustomizationPayload(Number(productId), [configured], { customization_options }))
    );
    selectedLines.forEach((l) => {
      if (l.group.option.allow_image_upload && l.sel.file) formData.append("images", l.sel.file, l.sel.file.name);
    });

    try {
      setSubmitting(true);
      await AddToCartApi(formData);
      toast.success("Added to cart!", { duration: 3000, closeButton: true });
      setSelections({});
      setShowErrors(false);
      onAdded?.();
    } catch {
      // The API client already toasts the failure.
    } finally {
      setSubmitting(false);
    }
  };

  const sectionLabel = "text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Customization options ── */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading customization options">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="h-3 w-1/4 rounded bg-[#E5E5E5]" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-10 w-24 rounded-lg bg-[#EFEFEF]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#F5C6C6] bg-[#FFF5F5] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#C0392B]">
            <AlertCircle size={16} className="flex-shrink-0" />
            Couldn&apos;t load customization options.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-sm font-semibold text-[#111111] underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : (
        groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map((g) => {
              const sel = selections[g.customization.id];
              const selectedValue = g.values.find((v) => v.id === sel?.valueId);
              const missing = showErrors && !selectedValue;
              return (
                <div key={g.customization.id}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className={sectionLabel}>
                      {g.option.name} <span className="text-[#C0392B]">*</span>
                    </p>
                    <p className="text-sm font-semibold text-[#111111] text-right">
                      {selectedValue?.name || `Select ${g.option.name.toLowerCase()}`}
                    </p>
                  </div>
                  {g.option.description && (
                    <p className="text-xs text-[#6B7280] mb-3">{g.option.description}</p>
                  )}
                  <div className={cn("flex flex-wrap gap-2", !g.option.description && "mt-2")}>
                    {g.values.map((v) => {
                      const isActive = sel?.valueId === v.id;
                      const unit = getValueUnitPrice(v, qty);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => updateSelection(g.customization.id, { valueId: v.id })}
                          className={cn(
                            "min-w-[52px] px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 text-left",
                            isActive
                              ? "bg-[#111111] text-[#E8D03A] border-[#111111]"
                              : missing
                                ? "bg-white text-[#111111] border-[#E3A1A1] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                                : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                          )}
                        >
                          {v.name}
                          <span className={cn("ml-1.5 text-xs font-medium", isActive ? "text-[#E8D03A]/80" : "text-[#6B7280]")}>
                            {unit > 0 ? `+$${formatMoney(unit)}/pc` : "Free"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {missing && (
                    <p className="text-xs text-[#C0392B] font-medium mt-2">Please select {g.option.name.toLowerCase()}.</p>
                  )}

                  {/* Optional text / logo for options that allow them */}
                  {selectedValue && (g.option.allow_text_input || g.option.allow_image_upload) && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {g.option.allow_text_input && (
                        <label className="block">
                          <span className="block text-xs font-medium text-[#6B7280] mb-1.5">
                            Text <span className="font-normal">(optional)</span>
                          </span>
                          <input
                            type="text"
                            value={sel?.text ?? ""}
                            maxLength={TEXT_MAX}
                            onChange={(e) => updateSelection(g.customization.id, { text: e.target.value })}
                            placeholder={`Text for ${g.option.name.toLowerCase()}`}
                            className="w-full h-11 rounded-lg border border-[#E5E5E5] px-3 text-sm text-[#111111] outline-none focus:border-[#111111]"
                          />
                        </label>
                      )}
                      {g.option.allow_image_upload && (
                        <FilePicker
                          file={sel?.file ?? null}
                          onPick={(f) => handleFile(g.customization.id, f)}
                          onClear={() => updateSelection(g.customization.id, { file: null })}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Quantity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={sectionLabel}>
            {manualMeta?.pricing_mode === "quantity_fixed" ? "Select Quantity" : "Quantity"}
          </p>
          {manualMeta?.pricing_mode !== "quantity_fixed" && (
            <p className="text-xs text-[#6B7280]">
              Min. {minQty}
              {maxQty != null ? ` · Max. ${maxQty}` : ""} pcs
            </p>
          )}
        </div>
        {manualMeta?.pricing_mode === "quantity_fixed" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {manualMeta.quantity_pricing.map((pkg) => {
              const isActive = qty === pkg.quantity;
              const soldOut = maxQty != null && pkg.quantity > maxQty;
              return (
                <button
                  key={pkg.quantity}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setQty(pkg.quantity)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                    isActive
                      ? "bg-[#111111] border-[#111111]"
                      : soldOut
                        ? "bg-[#F5F5F5] border-[#E5E5E5] opacity-60 cursor-not-allowed"
                        : "bg-white border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                  )}
                >
                  <p className={cn("text-sm font-semibold", isActive ? "text-[#E8D03A]" : "text-[#111111]")}>
                    {pkg.quantity} pcs
                  </p>
                  <p className={cn("text-xs mt-0.5", isActive ? "text-white/70" : "text-[#6B7280]")}>
                    ${formatMoney(pkg.price)} · ${formatMoney(pkg.price / pkg.quantity)}/pc
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <>
          {/* Tiered: price ranges, active one highlighted; click jumps to its min */}
          {tiers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {tiers.map((t) => {
                const isActive = activeTier?.min_qty === t.min_qty && inTierRange(qty);
                return (
                  <button
                    key={t.min_qty}
                    type="button"
                    onClick={() => setQty(clampQty(t.min_qty))}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                      isActive
                        ? "bg-[#111111] border-[#111111]"
                        : "bg-white border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                    )}
                  >
                    <p className={cn("text-sm font-semibold", isActive ? "text-[#E8D03A]" : "text-[#111111]")}>
                      {t.max_qty === null ? `${t.min_qty}+` : `${t.min_qty} – ${t.max_qty}`} pcs
                    </p>
                    <p className={cn("text-xs mt-0.5", isActive ? "text-white/70" : "text-[#6B7280]")}>
                      ${formatMoney(t.price)}/pc
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => clampQty(q - 1))}
              disabled={qty <= minQty}
              className="w-11 h-11 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Quantity"
              value={qty}
              min={minQty}
              max={maxQty ?? undefined}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              onBlur={() => setQty((q) => clampQty(q))}
              className="w-24 h-11 rounded-lg border border-[#E5E5E5] text-center text-sm font-semibold text-[#111111] outline-none focus:border-[#111111]"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => clampQty(q + 1))}
              disabled={maxQty != null && qty >= maxQty}
              className="w-11 h-11 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
          </>
        )}

        {/* Live price for the chosen quantity */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {manualMeta?.pricing_mode === "quantity_fixed" ? (
            <>
              <p className="text-[#6B7280]">
                Selected: <span className="font-semibold text-[#111111]">{packPrice != null ? `${qty} pcs` : "—"}</span>
              </p>
              <p className="text-right text-[#6B7280]">
                Price: <span className="font-semibold text-[#111111]">{packPrice != null ? `$${formatMoney(packPrice)}` : "—"}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-[#6B7280]">
                {tiers.length > 0 ? "Unit Price" : "Price"}:{" "}
                <span className="font-semibold text-[#111111]">${formatMoney(productUnitPrice)}</span>
              </p>
              <p className="text-right text-[#6B7280]">
                Total: <span className="font-semibold text-[#111111]">${formatMoney(totals.productTotal)}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm">
        <div className="flex justify-between py-1 text-[#444]">
          <span>
            {packPrice != null ? `Product · ${qty} pcs pack` : `Product · ${qty} × $${formatMoney(productUnitPrice)}`}
          </span>
          <span className="font-medium text-[#111111]">${formatMoney(totals.productTotal)}</span>
        </div>
        {selectedLines.map((l) => (
          <div key={l.group.customization.id} className="flex justify-between gap-3 py-1 text-[#444]">
            <span className="min-w-0 truncate">
              {l.group.option.name}: {l.value.name}
            </span>
            <span className="font-medium text-[#111111] flex-shrink-0">
              {l.unitPrice > 0 ? `$${formatMoney(l.unitPrice * qty)}` : "Free"}
            </span>
          </div>
        ))}
        <div className="h-px bg-[#E5E5E5] my-2" />
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-[#111111]">Total</span>
          <span className="text-lg font-bold text-[#111111]">${formatMoney(totals.total)}</span>
        </div>
      </div>

      {/* ── Add to Cart ── */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={submitting || loading || inCart}
        className="w-full h-[52px] flex items-center justify-center gap-2.5 text-sm font-bold tracking-widest uppercase transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-heading)",
          background: inCart ? "#666" : "#111",
          color: inCart ? "#999" : "#fff",
          border: "none",
          opacity: submitting || loading ? 0.8 : 1,
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Adding…
          </>
        ) : inCart ? (
          <>
            <CheckCircle2 size={16} />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart size={16} />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}

function FilePicker({
  file,
  onPick,
  onClear,
}: {
  file: File | null;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="block text-xs font-medium text-[#6B7280] mb-1.5">
        Logo <span className="font-normal">(optional)</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="h-11 flex items-center gap-2 rounded-lg border border-[#E5E5E5] px-3">
          <ImagePlus size={16} className="text-[#6B7280] flex-shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm text-[#111111]">{file.name}</span>
          <button type="button" onClick={onClear} aria-label="Remove image" className="text-[#6B7280] hover:text-[#111111]">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#C9C9C9] text-sm font-medium text-[#444] hover:border-[#111111] hover:text-[#111111]"
        >
          <ImagePlus size={16} />
          Upload image
        </button>
      )}
    </div>
  );
}
