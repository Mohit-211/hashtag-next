"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
  Package,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToCartApi } from "@/api/operations/cart.api";

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
}

const PRESETS = [1, 12, 24, 36, 72, 144];

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
}: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity(initialQuantity);
      setError(null);
      setSuccess(false);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open, initialQuantity]);

  const garmentTotal = price * quantity;
  const decorationTotal = printPricePerPiece * quantity;
  const grandTotal = garmentTotal + decorationTotal + digitizingFee;
  const perPiece = grandTotal / quantity;

  const parsedCustomization = (() => {
    if (!customization) return null;
    try {
      return JSON.parse(customization);
    } catch {
      return null;
    }
  })();

  const methodLabel = parsedCustomization?.print_method
    ? parsedCustomization.print_method.charAt(0).toUpperCase() +
      parsedCustomization.print_method.slice(1).toLowerCase()
    : null;

  const locationLabel = parsedCustomization?.locations?.[0]?.id
    ? parsedCustomization.locations[0].id
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;

  const customizationDetail =
    [methodLabel, locationLabel].filter(Boolean).join(" · ") ||
    "Customized product";

  const handleQuantityInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value) || 1;
      setQuantity(Math.max(1, val));
    },
    []
  );

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      setError(null);
      await AddToCartApi({
        product_id: productId,
        variant_id: variantId,
        quantity,
        customization: customization || undefined,
        images: canvasBlob || undefined,
      });
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
          "relative w-full sm:max-w-[400px] bg-white overflow-hidden",
          "rounded-t-[20px] sm:rounded-[20px]",
          "shadow-[0_-4px_32px_rgba(0,0,0,0.12)] sm:shadow-[0_8px_48px_rgba(0,0,0,0.18)]",
          "transition-all duration-300 ease-out",
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-6 opacity-0 sm:scale-95"
        )}
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
            {quantity} × {name}
          </p>
        </div>

        {/* ── HEADER ── */}
        <div className="bg-[#F5D800] px-5 pt-5 pb-4">
          {/* Title row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#111111] flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={16} className="text-[#F5D800]" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.16em] mb-0.5">
                  Confirm order
                </p>
                <p className="text-[15px] font-medium text-[#111111] leading-tight">
                  {name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-[8px] bg-[#111111]/10 border border-[#111111]/15 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#111111]/18 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Price breakdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#111111]/50">
                Garment ({quantity} × ${price.toFixed(2)})
              </span>
              <span className="text-[11px] font-medium text-[#111111]/80">
                ${garmentTotal.toFixed(2)}
              </span>
            </div>

            {decorationTotal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#111111]/50">
                  Decoration ({quantity} × ${printPricePerPiece.toFixed(2)})
                </span>
                <span className="text-[11px] font-medium text-[#111111]/80">
                  ${decorationTotal.toFixed(2)}
                </span>
              </div>
            )}

            {digitizingFee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#111111]/50">
                  Digitizing fee (one-time)
                </span>
                <span className="text-[11px] font-medium text-[#111111]/80">
                  ${digitizingFee.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-end justify-between border-t border-[#111111]/15 pt-3 mt-2">
              <div>
                <p className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.1em] mb-1">
                  Order total
                </p>
                <p className="text-[32px] font-medium text-[#111111] leading-none">
                  ${grandTotal.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#111111]/10 border border-[#111111]/15 rounded-[10px] px-2.5 py-1.5">
                <Package size={12} className="text-[#111111]" />
                <span className="text-[11px] font-medium text-[#111111]">
                  ${perPiece.toFixed(2)}/pc
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1.5px] bg-[#111111]" />

        {/* ── BODY ── */}
        <div className="px-5 pt-4 pb-2 space-y-4 bg-white">

          {/* Customization pill */}
          {parsedCustomization && (
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

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#111111]/40">
                Quantity
              </p>
              {quantity !== initialQuantity && (
                <button
                  onClick={() => setQuantity(initialQuantity)}
                  className="flex items-center gap-1 text-[10px] font-medium text-[#111111] hover:underline"
                >
                  <RotateCcw size={10} />
                  Reset to {initialQuantity}
                </button>
              )}
            </div>

            {/* Stepper */}
            <div className="flex items-center border border-black/10 rounded-[12px] overflow-hidden bg-black/[0.025]">
              <button
                onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className={cn(
                  "w-12 h-[52px] flex items-center justify-center flex-shrink-0 transition-all",
                  quantity <= 1
                    ? "text-black/15 cursor-not-allowed"
                    : "text-[#111111] hover:bg-black/6 active:scale-90"
                )}
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>

              <div className="flex-1 flex flex-col items-center justify-center border-x border-black/10 py-1">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={handleQuantityInput}
                  aria-label="Quantity"
                  className="w-full text-center text-[26px] font-medium text-[#111111] bg-transparent border-0 outline-none leading-none"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-[10px] text-black/30 mt-0.5">
                  {quantity === initialQuantity ? "from your selection" : "adjusted"}
                </p>
              </div>

              <button
                onClick={() => setQuantity((p) => p + 1)}
                aria-label="Increase quantity"
                className="w-12 h-[52px] flex items-center justify-center flex-shrink-0 text-[#111111] hover:bg-black/6 active:scale-90 transition-all"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {PRESETS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={cn(
                    "h-7 px-3 rounded-[8px] text-[11px] font-medium transition-all",
                    quantity === q
                      ? "bg-[#111111] text-[#F5D800]"
                      : "bg-black/5 text-black/40 border border-black/8 hover:text-[#111111] hover:bg-black/8"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-red-300/50 bg-red-50 px-3.5 py-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 pb-5 pt-3 flex flex-col gap-2 bg-white">
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