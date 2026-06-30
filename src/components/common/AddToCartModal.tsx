"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Sparkles,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToCartApi } from "@/api/operations/cart.api";
import { getSageUnitPriceWithMarkup } from "../product/customization/Sagequantitypricing";

/* ── Mirrors ConfiguredVariant from the customization page ── */
export interface ConfiguredSize {
  variant_id: number;
  size_id: number | null;
  size: string;
  quantity: number;
  unit_price: number;
}
export interface ConfiguredVariant {
  variantId: number;
  variantName: string;
  color: string;
  colorCode: string;
  images?: any[];
  sizes: ConfiguredSize[];
  totalQty: number;
  totalPrice: number;
}

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
  customization?: string; // JSON string (single payload object, may already contain `variants`)
  canvasBlob?: Blob | null;
  sageMetaStr?: string | Record<string, unknown> | null;
  /** NEW: every variant the user explicitly configured on the customization
   * page. When provided, the modal renders each one separately and the
   * grand total/qty are summed across all of them — instead of a single
   * flat quantity × price line. */
  configuredVariants?: ConfiguredVariant[];
}

/* Treat missing/blank/transparent/white-on-white color codes as "no swatch"
   rather than rendering an empty-looking circle. */
const isRenderableSwatch = (code?: string) => {
  if (!code) return false;
  const c = code.trim().toLowerCase();
  if (c === "" || c === "transparent" || c === "none") return false;
  if (c === "#fff" || c === "#ffffff" || c === "white") return false;
  return true;
};

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
}: AddToCartModalProps) {
  const quantity = initialQuantity;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open, initialQuantity]);

  const hasConfigured = !!configuredVariants && configuredVariants.length > 0;

  /* ── Fallback single-variant pricing (legacy path / no configuredVariants) ── */
  const effectiveUnitPrice = useMemo(() => {
    if (!sageMetaStr) return price;
    return getSageUnitPriceWithMarkup(sageMetaStr, quantity) ?? price;
  }, [sageMetaStr, quantity, price]);

  const garmentTotal = effectiveUnitPrice * quantity;
  const decorationTotal = printPricePerPiece * quantity;

  /* ── Grand totals — sum across configuredVariants when present ── */
  const grandQty = hasConfigured
    ? configuredVariants!.reduce((s, cv) => s + cv.totalQty, 0)
    : quantity;

 const garmentConfiguredTotal = hasConfigured
  ? configuredVariants!.reduce(
      (sum, cv) =>
        sum +
        cv.sizes.reduce(
          (t, s) => t + s.unit_price * s.quantity,
          0
        ),
      0
    )
  : garmentTotal;

const configuredDecorationTotal = hasConfigured
  ? printPricePerPiece * grandQty
  : decorationTotal;

const grandTotal =
  garmentConfiguredTotal +
  configuredDecorationTotal +
  digitizingFee;
  const perPiece = grandQty > 0 ? grandTotal / grandQty : 0;

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

  const locationLabel = customizationObj?.locations?.[0]?.location
    ? customizationObj.locations[0].location
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;

  const methodLabel = customizationObj?.print_method
    ? customizationObj.print_method.charAt(0).toUpperCase() +
      customizationObj.print_method.slice(1).toLowerCase()
    : null;

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

      // Build the final payload. If configuredVariants were supplied, ALWAYS
      // send the full multi-variant array — never just the active selection.
      let customizationPayload: any;

      if (hasConfigured) {
        customizationPayload = [
          {
            product_id: productId,
            ...(customizationObj?.print_method !== undefined
              ? { print_method: customizationObj.print_method }
              : {}),
            ...(customizationObj?.locations !== undefined
              ? { locations: customizationObj.locations }
              : {}),
           sizes: configuredVariants!.flatMap((cv) =>
  cv.sizes.map((s) => ({
    variant_id: s.variant_id,
    size_id: s.size_id,
    quantity: s.quantity,
  }))
),
          },
        ];
      } else if (customizationObj?.variants) {
        // Already in the new multi-variant shape from buildPayload()
        customizationPayload = customizationObj;
      } else {
        // Legacy single-variant fallback shape
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

      console.log("Sending payload:");
      console.log("product_id:", productId);
      console.log("customization:", JSON.stringify(customizationPayload));
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await AddToCartApi(formData);

      setSuccess(true);
      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to cart"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={cn(
          "relative w-full sm:w-[440px] sm:max-w-[92vw] bg-white overflow-hidden",
          "rounded-t-[20px] sm:rounded-[20px]",
          "shadow-[0_-4px_32px_rgba(0,0,0,0.12)] sm:shadow-[0_8px_48px_rgba(0,0,0,0.18)]",
          "transition-all duration-300 ease-out",
          "max-h-[90vh] sm:max-h-[85vh] flex flex-col",
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-6 opacity-0 sm:scale-95"
        )}
        style={{width:"50%"}}
      >
        {/* ── SUCCESS OVERLAY ── */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3",
            "bg-white rounded-[20px] transition-opacity duration-250",
            success ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-[#F5D800] flex items-center justify-center">
            <CheckCircle size={30} className="text-[#111111]" strokeWidth={2} />
          </div>
          <p className="text-lg font-medium text-[#111111]">Added to cart!</p>
          <p className="text-sm text-[#111111]/50">
            {grandQty} × {name}
          </p>
        </div>

        {/* ── HEADER (fixed, never scrolls) ── */}
        <div className="bg-[#F5D800] px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#111111] flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={16} className="text-[#F5D800]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.16em] mb-0.5">
                  Confirm order
                </p>
                <p className="text-[15px] font-medium text-[#111111] leading-tight truncate">
                  {name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-[8px] bg-[#111111]/10 border border-[#111111]/15 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#111111]/18 transition-all flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* Grand total summary in header (always single source of truth) */}
          <div className="flex items-end justify-between border-t border-[#111111]/15 pt-3 mt-1">
            <div>
              <p className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.1em] mb-1">
                Order total ({grandQty} {grandQty === 1 ? "pc" : "pcs"})
              </p>
              <p className="text-[32px] font-medium text-[#111111] leading-none">
                ${grandTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#111111]/10 border border-[#111111]/15 rounded-[10px] px-2.5 py-1.5 flex-shrink-0">
              <Package size={12} className="text-[#111111]" />
              <span className="text-[11px] font-medium text-[#111111]">
                ${perPiece.toFixed(2)}/pc
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1.5px] bg-[#111111] flex-shrink-0" />

        {/* ── BODY (the ONLY scrollable region) ── */}
        <div className="px-5 pt-4 pb-2 space-y-4 bg-white overflow-y-auto flex-1 min-h-0">
          {/* Customization pill */}
          {customizationObj && (methodLabel || locationLabel) && (
            <div className="flex items-center gap-3 rounded-[12px] border border-black/10 bg-black/[0.03] px-3.5 py-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-[#111111] flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-[#F5D800]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-[#111111] uppercase tracking-[0.08em]">
                  Custom design
                </p>
                <p className="text-[11px] text-[#111111]/50 truncate mt-0.5">
                  {customizationDetail}
                </p>
              </div>
              {canvasBlob && (
                <span className="flex-shrink-0 text-[10px] font-medium text-[#F5D800] bg-[#111111] px-2 py-1 rounded-full">
                  PNG ✓
                </span>
              )}
            </div>
          )}

          {/* ── Itemized list — every configured variant shown separately ── */}
          {hasConfigured ? (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#111111]/40">
                {configuredVariants!.length} variant{configuredVariants!.length > 1 ? "s" : ""} in this order
              </p>
              {configuredVariants!.map((cv) => (
                <div
                  key={cv.variantName}
                  className="rounded-[14px] border border-black/10 bg-black/[0.02] p-3.5"
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* {isRenderableSwatch(cv.colorCode) && (
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 flex-shrink-0"
                          style={{ background: cv.colorCode }}
                        />
                      )} */}
                      <p className="text-[13px] font-semibold text-[#111111] truncate">
                        {cv.variantName}
                      </p>
                    </div>
                    <span className="text-[12px] font-bold text-[#111111] flex-shrink-0">
                      ${cv.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cv.sizes.map((s) => (
                      <div
                      key={`${s.variant_id}-${s.size_id}`}
                        className="flex items-center justify-between text-[11px] text-[#111111]/55"
                      >
                        <span>
                          {s.size && s.size !== "—" ? s.size : "Standard"} · ×{s.quantity}
                        </span>
                        <span className="font-medium text-[#111111]/70">
                          ${(s.unit_price * s.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#111111]/80 pt-1.5 mt-1.5 border-t border-black/5">
                    <span>{cv.totalQty} pcs</span>
                    <span>${cv.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-[12px] bg-[#111111] px-4 py-3">
                <span className="text-[12px] font-medium text-white/70">
                  Total Qty: {grandQty}
                </span>
                <span className="text-[14px] font-bold text-[#F5D800]">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            /* ── Legacy single-quantity summary (no configuredVariants) ── */
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quantity</span>
                <span className="text-lg font-bold">{quantity}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">
                  Garment ({quantity} × ${effectiveUnitPrice.toFixed(2)})
                </span>
                <span className="text-xs font-medium text-gray-600">
                  ${garmentTotal.toFixed(2)}
                </span>
              </div>
              {decorationTotal > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    Decoration ({quantity} × ${printPricePerPiece.toFixed(2)})
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    ${decorationTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Quantity selected on the product page.
              </p>
              {sageMetaStr && (
                <p className="text-[10px] text-black/30 mt-2">
                  Price updates automatically based on quantity.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-red-300/50 bg-red-50 px-3.5 py-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* ── FOOTER (fixed, never scrolls) ── */}
        <div className="px-5 pb-5 pt-3 flex flex-col gap-2 bg-white flex-shrink-0 border-t border-black/5">
          <button
            onClick={handleAddToCart}
            disabled={loading || success}
            className={cn(
              "relative w-full h-[52px] rounded-[14px] text-[14px] font-medium",
              "flex items-center justify-between px-4 gap-2 transition-all duration-200",
              loading || success
                ? "bg-black/10 text-black/30 cursor-not-allowed"
                : "bg-[#111111] text-[#F5D800] hover:bg-[#222222] hover:-translate-y-px active:scale-[0.98]"
            )}
          >
            {success ? (
              <>
                <CheckCircle size={16} strokeWidth={2} />
                Added to cart!
              </>
            ) : loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 flex-1 justify-start">
                  <ShoppingCart size={15} strokeWidth={2.2} />
                  Add to cart
                </span>
                <span className="text-[#F5D800]/50 text-[13px]">
                  ${grandTotal.toFixed(2)}
                </span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full h-9 text-[13px] text-black/30 hover:text-black/60 transition-colors rounded-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}