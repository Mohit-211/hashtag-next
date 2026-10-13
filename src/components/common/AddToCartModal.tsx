"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddToCartApi } from "@/api/operations/cart.api";
import { getSageUnitPriceWithMarkup } from "../product/customization/Sagequantitypricing";
import { calculateVariantTotal, sumVariantTotals, formatMoney } from "../product/customization/pricing";

import { errorMessage } from "@/lib/errors";
/* ── Mirrors ConfiguredVariant from the customization page ── */
export interface ConfiguredSize {
  variant_id: number;
  size_id: number | null;
  size: string;
  quantity: number;
  unit_price: number;
  /** Decoration price per unit, captured on the size line itself — NEVER
   *  includes the flat digitizing fee. 0 when none was selected or the
   *  config step was skipped. */
  decoration_unit_price?: number;
  /** ★ Flat, one-time fee (e.g. embroidery digitizing at qty<=11). Never
   *  multiplied by quantity, never folded into decoration_unit_price. */
  digitizing_fee?: number;
}
export interface ConfiguredVariant {
  variantId: number;
  variantName: string;
  color: string;
  colorCode: string;
  images?: { file_uri?: string; file_name?: string }[];
  sizes: ConfiguredSize[];
  totalQty: number;
  totalPrice: number;
  productTotal?: number;
  decorationTotal?: number;
  /** ★ Σ(digitizing_fee) across this variant's sizes — flat, not qty-scaled. */
  digitizingFeeTotal?: number;
}

/** Cart `customization` payload for configured variants — one line per
 * variant/size, priced through calculateVariantTotal. `extras` carries
 * flow-specific fields (print_method, locations, customization_options). */
export const buildConfiguredCustomizationPayload = (
  productId: number,
  configuredVariants: ConfiguredVariant[],
  extras: Record<string, unknown> = {}
) => [
  {
    product_id: productId,
    ...extras,
    customizations: configuredVariants.flatMap((cv) =>
      cv.sizes.map((s) => {
        const linePricing = calculateVariantTotal({
          productPrice: s.unit_price,
          decorationPrice: s.decoration_unit_price ?? 0,
          quantity: s.quantity,
        });
        const fee = s.digitizing_fee ?? 0;
        return {
          variant_id: s.variant_id,
          color: cv.color,
          size: s.size,
          quantity: s.quantity,
          product_price: s.unit_price,
          decoration_price: s.decoration_unit_price ?? 0,
          digitizing_fee: fee,
          total_price: linePricing.total + fee,
        };
      })
    ),
    sizes: configuredVariants.flatMap((cv) =>
      cv.sizes.map((s) => ({
        variant_id: s.variant_id,
        size_id: s.size_id,
        quantity: s.quantity,
      }))
    ),
  },
];

interface AddToCartModalProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  variantId: number;
  price: number;
  name: string;
  initialQuantity?: number;
  printPricePerPiece?: number;
  digitizingFee?: number;
  onSuccess?: () => void;
  customization?: string;
  canvasBlob?: Blob | null;
  sageMetaStr?: string | Record<string, unknown> | null;
  configuredVariants?: ConfiguredVariant[];
  isApparel?: boolean;
}

export default function AddToCartModal({
  open,
  onClose,
  productId,
  variantId,
  price,
  name,
  initialQuantity = 1,
  printPricePerPiece = 0,
  digitizingFee = 0,
  onSuccess,
  customization,
  canvasBlob,
  sageMetaStr,
  configuredVariants,
  isApparel,
}: AddToCartModalProps) {
  const quantity = initialQuantity;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Each opening starts clean.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setError(null);
      setSuccess(false);
    }
  }
  // Fade in on the next frame after opening; hide again when closed.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(frame);
      setVisible(false);
    };
  }, [open]);

  const hasConfigured = !!configuredVariants && configuredVariants.length > 0;

  /* ── Fallback single-variant pricing (legacy path / no configuredVariants) ── */
  const effectiveUnitPrice = useMemo(() => {
    if (!sageMetaStr) return price;
    return getSageUnitPriceWithMarkup(sageMetaStr, quantity) ?? price;
  }, [sageMetaStr, quantity, price]);

  const legacyPricing = calculateVariantTotal({
    productPrice: effectiveUnitPrice,
    decorationPrice: printPricePerPiece,
    quantity,
  });
  const garmentTotal = legacyPricing.productTotal;
  const decorationTotal = legacyPricing.decorationTotal;

  /* ── Grand totals — SINGLE SOURCE OF TRUTH for the configured-variants
     path. Every size line's own productPrice/decorationPrice/quantity is
     fed through sumVariantTotals, and digitizing fees are summed
     separately as FLAT amounts (never multiplied by quantity, never run
     through sumVariantTotals). This is what closes the gap with the
     customization page's own displayTotal, which does the same split. ── */
  const configuredPricing = useMemo(() => {
    if (!hasConfigured) return null;
    const lines = configuredVariants!.flatMap((cv) =>
      cv.sizes.map((s) => ({
        productPrice: s.unit_price,
        decorationPrice: s.decoration_unit_price ?? 0,
        quantity: s.quantity,
      }))
    );
    const base = sumVariantTotals(lines);
    const digitizingFeeTotal = configuredVariants!.reduce(
      (sum, cv) =>
        sum +
        cv.sizes.reduce((s2, s) => s2 + (s.digitizing_fee ?? 0), 0),
      0
    );
    return { ...base, digitizingFeeTotal };
  }, [hasConfigured, configuredVariants]);

  const grandQty = hasConfigured
    ? configuredVariants!.reduce((s, cv) => s + cv.totalQty, 0)
    : quantity;

  const garmentConfiguredTotal = hasConfigured ? configuredPricing!.productTotal : garmentTotal;
  const configuredDecorationTotal = hasConfigured ? configuredPricing!.decorationTotal : decorationTotal;
  const configuredDigitizingFeeTotal = hasConfigured ? configuredPricing!.digitizingFeeTotal : digitizingFee;

  // ★ FIX — digitizing fee is now sourced from the actual configured
  // lines (summed flat) when configuredVariants exist, instead of always
  // trusting whatever flat `digitizingFee` prop the parent passed in
  // (which was previously hardcoded to 0 on the configured-variants path,
  // silently dropping the fee from the modal's total).
  const grandTotal = garmentConfiguredTotal + configuredDecorationTotal + configuredDigitizingFeeTotal;

  /* ✅ Parse customization JSON safely (legacy single-payload shape) */
  const parsedCustomization = useMemo(() => {
    if (!customization) return null;
    try {
      return JSON.parse(customization);
    } catch {
      return null;
    }
  }, [customization]);

  const customizationObj = Array.isArray(parsedCustomization)
    ? parsedCustomization[0]
    : parsedCustomization;

  // e.g. [{ location: "RIGHT_CHEST" }, { location: "FULL_BACK_STANDARD" }] → "Right Chest, Full Back Standard"
  const locationLabel =
    (Array.isArray(customizationObj?.locations) ? customizationObj.locations : [])
      .map((l: { location?: string }) =>
        (l?.location ?? "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      )
      .filter(Boolean)
      .join(", ") || null;

  // "SCREEN_PRINT" → "Screen print", "DTF" stays an acronym.
  const rawMethod: string = customizationObj?.print_method ?? "";
  const methodLabel = !rawMethod
    ? null
    : ["DTF", "DTG"].includes(rawMethod.toUpperCase())
      ? rawMethod.toUpperCase()
      : rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1).toLowerCase().replace(/_/g, " ");

  const customizationDetail =
    [methodLabel, locationLabel].filter(Boolean).join(" · ") ||
    "Customized product";

  /* ── Submit ── */
  const handleAddToCart = async () => {
    if (!hasConfigured && !variantId) {
      setError(
        "No matching product variant found. Please reselect your options and try again."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Only ever serialised into the form body, so its exact shape is irrelevant here.
      let customizationPayload: unknown;

      if (hasConfigured) {
        // Every selected variant/size line becomes one customization
        // object carrying its own product_price / decoration_price /
        // digitizing_fee / total_price, with the flat fee added once.
        customizationPayload = buildConfiguredCustomizationPayload(productId, configuredVariants!, {
          ...(customizationObj?.print_method !== undefined
            ? { print_method: customizationObj.print_method }
            : {}),
          ...(customizationObj?.locations !== undefined
            ? { locations: customizationObj.locations }
            : {}),
        });
      } else if (customizationObj?.customizations || customizationObj?.variants) {
        customizationPayload = customizationObj;
      } else {
        customizationPayload = {
          product_id: productId,
          variants: [
            {
              variant_id: variantId,
              sizes: [
                {
                  size_id: null,
                  variant_id: variantId,
                  quantity,
                },
              ],
            },
          ],
        };
      }
      const formData = new FormData();
      formData.append("product_id", String(productId));
      formData.append("customization", JSON.stringify(customizationPayload));

      if (canvasBlob) {
        formData.append("images", canvasBlob, "customization.png");
      }

      await AddToCartApi(formData);

      toast.success("Added to cart!", { duration: 3000, closeButton: true });
      setSuccess(true);
      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      setError(
        errorMessage(err, "Something went wrong. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const pcs = (n: number) => `${n} ${n === 1 ? "pc" : "pcs"}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-2xl",
          "transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:scale-95"
        )}
      >
        {/* Success state — hidden from assistive tech until it's shown */}
        <div
          aria-hidden={!success}
          role={success ? "status" : undefined}
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card transition-opacity duration-200",
            success ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle size={30} className="text-success" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-foreground">Added to cart</p>
          <p className="text-sm text-muted-foreground">
            {pcs(grandQty)} · {name}
          </p>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Review before adding</p>
            <h2 id="cart-modal-title" className="mt-0.5 truncate text-lg font-bold text-foreground">
              {name}
            </h2>
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
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
          {customizationObj && (methodLabel || locationLabel) && (
            <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
              <Sparkles size={16} className="shrink-0 text-primary-ink" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">Your custom design</p>
                <p className="truncate text-xs text-muted-foreground">
                  {customizationDetail}
                  {canvasBlob ? " · artwork attached" : ""}
                </p>
              </div>
            </div>
          )}

          {hasConfigured ? (
            <div className="space-y-4">
              {configuredVariants!.map((cv) => {
                const cvDigitizingFeeTotal = cv.sizes.reduce((sum, s) => sum + (s.digitizing_fee ?? 0), 0);
                return (
                  <div key={`${cv.variantId}-${cv.variantName}`} className="space-y-1.5">
                    <p className="font-semibold text-foreground">
                      {cv.variantName || cv.color || `Variant #${cv.variantId}`}
                    </p>
                    {cv.sizes.map((s) => {
                      const linePricing = calculateVariantTotal({
                        productPrice: s.unit_price,
                        decorationPrice: s.decoration_unit_price ?? 0,
                        quantity: s.quantity,
                      });
                      return (
                        <div
                          key={`${s.variant_id}-${s.size_id}`}
                          className="flex items-center justify-between gap-3 text-muted-foreground"
                        >
                          <span>
                            {s.size && s.size !== "—" ? `Size ${s.size}` : "Quantity"} × {s.quantity}
                          </span>
                          <span className="tabular-nums">${formatMoney(linePricing.total)}</span>
                        </div>
                      );
                    })}
                    {cvDigitizingFeeTotal > 0 && (
                      <div className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span>Digitizing fee (one-time)</span>
                        <span className="tabular-nums">${formatMoney(cvDigitizingFeeTotal)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single-quantity path (quantity chosen on the product page) */
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span>
                  Product · {quantity} × ${formatMoney(effectiveUnitPrice)}
                </span>
                <span className="tabular-nums">${formatMoney(garmentTotal)}</span>
              </div>
              {isApparel && decorationTotal > 0 && (
                <div className="flex items-center justify-between gap-3 text-muted-foreground">
                  <span>
                    Decoration · {quantity} × ${formatMoney(printPricePerPiece)}
                  </span>
                  <span className="tabular-nums">${formatMoney(decorationTotal)}</span>
                </div>
              )}
              {digitizingFee > 0 && (
                <div className="flex items-center justify-between gap-3 text-muted-foreground">
                  <span>Digitizing fee (one-time)</span>
                  <span className="tabular-nums">${formatMoney(digitizingFee)}</span>
                </div>
              )}
              {sageMetaStr && (
                <p className="pt-1 text-xs text-muted-foreground">Unit price depends on the quantity ordered.</p>
              )}
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
            <span className="font-semibold text-foreground">Total · {pcs(grandQty)}</span>
            <span className="text-2xl font-bold tabular-nums text-foreground">${formatMoney(grandTotal)}</span>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-input text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            disabled={loading || success}
            className={cn(
              "flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-lg text-sm font-semibold transition",
              loading || success
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98]"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Adding…
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Add to cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
