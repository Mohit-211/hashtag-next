"use client";

import { X, ShoppingCart, Package, Loader2 } from "lucide-react";
import AddOnSuggestions, { type ProductAddon } from "./AddOnSuggestions";

interface AddOnModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | number;
  name: string;
  /** Already-fetched add-ons; when omitted the picker fetches them itself. */
  addons?: ProductAddon[];
  selected: ProductAddon[];
  onSelectionChange: (next: ProductAddon[]) => void;
  /** Adds the product to the cart with the given add-ons. */
  onConfirm: (addons: ProductAddon[]) => void;
  submitting?: boolean;
}

/** Add-on picker for MANUAL-supplier products, opened by the Add to Cart
 * button before the item is added; the chosen add-ons go in the same request. */
export default function AddOnModal({
  open,
  onClose,
  productId,
  name,
  addons,
  selected,
  onSelectionChange,
  onConfirm,
  submitting = false,
}: AddOnModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add more products"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
    >
      <div className="relative w-full sm:w-[600px] max-w-[92vw] bg-white overflow-hidden rounded-[20px] shadow-[0_8px_48px_rgba(0,0,0,0.18)] max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        <div className="bg-[#F5D800] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#111111] flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-[#F5D800]" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-[#111111] leading-tight">Add more products</p>
            <p className="text-[12px] text-[#111111]/55 truncate">{name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="w-8 h-8 rounded-[8px] bg-[#111111]/10 border border-[#111111]/15 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] transition-all flex-shrink-0 disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="h-[1.5px] bg-[#111111] flex-shrink-0" />

        <div className="px-5 pt-5 pb-2 overflow-y-auto flex-1 min-h-0">
          <AddOnSuggestions
            productId={productId}
            addons={addons}
            selected={selected}
            onSelectionChange={onSelectionChange}
          />
        </div>

        <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-2 bg-white flex-shrink-0 border-t border-black/5">
          <button
            onClick={() => onConfirm([])}
            disabled={submitting}
            className="h-[48px] rounded-[14px] text-[13px] font-medium border border-[#111111] text-[#111111] hover:bg-black/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Skip add-ons
          </button>
          <button
            disabled={submitting || selected.length === 0}
            onClick={() => onConfirm(selected)}
            className="h-[48px] rounded-[14px] text-[13px] font-medium bg-[#111111] text-[#F5D800] hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ShoppingCart size={15} strokeWidth={2.2} />
            )}
            {submitting ? "Adding…" : `Add to Cart (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
