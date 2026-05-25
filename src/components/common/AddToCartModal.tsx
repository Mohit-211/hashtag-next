// components/common/AddToCartModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Loader2, CheckCircle2, Plus, Minus, Sparkles, Package, RotateCcw } from "lucide-react";
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
  onSuccess?: () => void;
  customization?: string;
  canvasBlob?: Blob | null;
}

export default function AddToCartModal({
  open,
  onClose,
  productId,
  variantId,
  price,
  name,
  initialQuantity = 1,
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
      // slight delay so CSS transition fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open, initialQuantity]);

  if (!open) return null;

  const parsedCustomization = (() => {
    if (!customization) return null;
    try {
      return JSON.parse(customization);
    } catch {
      return null;
    }
  })();

  const methodLabel = parsedCustomization?.print_method
    ? parsedCustomization.print_method.charAt(0) + parsedCustomization.print_method.slice(1).toLowerCase()
    : null;
  const locationLabel = parsedCustomization?.locations?.[0]?.id
    ? parsedCustomization.locations[0].id.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null;

  const total = price * quantity;

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
      setError(err?.response?.data?.message || err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(10,20,13,0.65)", backdropFilter: "blur(8px)" }}
    >
      {/* Sheet slides up on mobile, scales in on desktop */}
      <div
        className={cn(
          "w-full sm:max-w-[420px] bg-white overflow-hidden transition-all duration-300 ease-out",
          "rounded-t-[2rem] sm:rounded-[2rem]",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:shadow-[0_20px_80px_rgba(0,0,0,0.28)]",
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 sm:scale-95"
        )}
      >
        {/* ═══ SUCCESS OVERLAY ═══ */}
        {success && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-[2rem]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#e8f5ec] flex items-center justify-center mb-4">
                <CheckCircle2 size={40} className="text-[#2d6a45]" strokeWidth={1.8} />
              </div>
              {/* Ripple rings */}
              <div className="absolute inset-0 rounded-full border-2 border-[#2d6a45]/20 animate-ping" />
            </div>
            <p className="text-xl font-bold text-[#1a2e1e] tracking-tight">Added to cart!</p>
            <p className="text-sm text-[#8fa989] mt-1">{quantity} × {name}</p>
          </div>
        )}

        {/* ═══ DARK HERO HEADER ═══ */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a2e1e 0%, #2d4a35 55%, #1e3828 100%)",
          }}
        >
          {/* Subtle texture dots */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Glow blob */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#4a7a58]/30 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart size={18} className="text-white" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-0.5">Confirm Order</p>
                <p className="text-base font-bold text-white leading-tight tracking-tight">{name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Price display inside header */}
          <div className="relative mt-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-white/40 font-medium mb-0.5">Order total</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white tracking-tight">${total.toFixed(2)}</span>
                {quantity > 1 && (
                  <span className="text-[12px] text-white/40 font-medium pb-0.5">${price.toFixed(2)} × {quantity}</span>
                )}
              </div>
            </div>
            {/* Per-piece pill */}
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5">
              <Package size={12} className="text-white/50" />
              <span className="text-[11px] text-white/70 font-semibold">${price.toFixed(2)}/pc</span>
            </div>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="px-6 pt-5 pb-2 space-y-4">

          {/* Customization pill — only if present */}
          {parsedCustomization && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#d5e8da] bg-gradient-to-r from-[#f0f8f2] to-[#eaf5ed] px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-[#2d4a35] flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1a3020] tracking-wide">Custom Design</p>
                <p className="text-[11px] text-[#4a7a58] truncate mt-0.5">
                  {[methodLabel, locationLabel].filter(Boolean).join("  ·  ") || "Customized product"}
                </p>
              </div>
              {canvasBlob && (
                <span className="flex-shrink-0 text-[10px] font-bold text-[#2d4a35] bg-white border border-[#b8d9c0] px-2.5 py-1 rounded-full">
                  PNG ✓
                </span>
              )}
            </div>
          )}

          {/* ── Quantity control ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9aafA0]">Quantity</p>
              {quantity !== initialQuantity && (
                <button
                  onClick={() => setQuantity(initialQuantity)}
                  className="flex items-center gap-1 text-[10px] text-[#2d4a35] font-semibold hover:underline"
                >
                  <RotateCcw size={10} />
                  Reset to {initialQuantity}
                </button>
              )}
            </div>

            <div className="flex items-center bg-[#f4f8f5] rounded-2xl border border-[#ddeae0] overflow-hidden">
              <button
                onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                disabled={quantity <= 1}
                className={cn(
                  "w-12 h-14 flex items-center justify-center flex-shrink-0 transition-all",
                  quantity <= 1
                    ? "text-[#c5d9ca] cursor-not-allowed"
                    : "text-[#2d4a35] hover:bg-[#e8f0ea] active:scale-90"
                )}
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>

              <div className="flex-1 flex flex-col items-center justify-center py-1">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center text-[28px] font-black text-[#1a2e1e] border-0 outline-none bg-transparent leading-none"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-[10px] text-[#a0b8a6] font-medium mt-0.5">
                  {quantity === initialQuantity ? "from your selection" : "adjusted"}
                </p>
              </div>

              <button
                onClick={() => setQuantity((p) => p + 1)}
                className="w-12 h-14 flex items-center justify-center flex-shrink-0 text-[#2d4a35] hover:bg-[#e8f0ea] active:scale-90 transition-all"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Quick-select row */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {[1, 6, 12, 24, 48].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={cn(
                    "h-7 px-3 rounded-lg text-[11px] font-bold transition-all",
                    quantity === q
                      ? "bg-[#2d4a35] text-white"
                      : "bg-[#f0f5f1] text-[#4a7a58] hover:bg-[#e3ede5] border border-[#ddeae0]"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="w-4 h-4 rounded-full bg-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-6 pb-6 pt-3 flex flex-col gap-2.5">
          {/* Main CTA */}
          <button
            onClick={handleAddToCart}
            disabled={loading || success}
            className={cn(
              "relative w-full h-[54px] rounded-2xl text-white font-bold text-[15px] tracking-tight",
              "flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-200",
              success
                ? "bg-emerald-500"
                : loading
                ? "bg-[#2d4a35]/60 cursor-not-allowed"
                : "bg-[#1a2e1e] hover:bg-[#243d28] active:scale-[0.98] shadow-lg shadow-[#1a2e1e]/30"
            )}
          >
            {/* Shine effect on hover */}
            {!loading && !success && (
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)",
                }}
              />
            )}
            {success ? (
              <><CheckCircle2 size={18} strokeWidth={2} /> Added to cart!</>
            ) : loading ? (
              <><Loader2 size={17} className="animate-spin" /> Processing...</>
            ) : (
              <>
                <ShoppingCart size={17} strokeWidth={1.8} />
                Add to Cart
                <span className="ml-auto text-white/60 text-sm font-semibold">${total.toFixed(2)}</span>
              </>
            )}
          </button>

          {/* Cancel — text only, understated */}
          <button
            onClick={onClose}
            className="w-full h-10 text-[13px] font-semibold text-[#8fa989] hover:text-[#2d4a35] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}