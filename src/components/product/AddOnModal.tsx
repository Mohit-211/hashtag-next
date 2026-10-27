"use client";

import { useState } from "react";
import { X, ShoppingCart, Package, Loader2 } from "lucide-react";
import AddOnSuggestions, { addonUnitPrice, type ProductAddon } from "./AddOnSuggestions";
import { formatMoney } from "./customization/pricing";

/** A picked add-on and how many of it the customer wants (client decision Q25). */
export interface SelectedAddon extends ProductAddon {
  /** One for every item ordered: follows the product quantity. */
  forAll: boolean;
  /** The customer's own number, used when forAll is off. */
  quantity: number;
}

export const addonQuantity = (a: SelectedAddon, productQty: number) =>
  a.forAll ? productQty : a.quantity;

/** New picks, and selections saved before quantities existed, start at one per item. */
export const toSelectedAddon = (a: ProductAddon & Partial<SelectedAddon>): SelectedAddon => ({
  ...a,
  forAll: a.forAll ?? true,
  quantity: a.quantity && a.quantity > 0 ? Math.floor(a.quantity) : 1,
});

/** Commits on blur or Enter, so the field can be cleared while typing. */
function QuantityInput({ value, label, onCommit }: { value: number; label: string; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = Math.floor(Number(draft));
    onCommit(Number.isFinite(n) && n >= 1 ? n : value);
    setDraft(null);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      step={1}
      aria-label={label}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-9 w-24 rounded-[10px] border border-input bg-background px-2 text-center text-[13px] font-semibold tabular-nums text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

interface AddOnModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | number;
  name: string;
  /** The product quantity, used for "one for every item". */
  productQty: number;
  /** Already-fetched add-ons; when omitted the picker fetches them itself. */
  addons?: ProductAddon[];
  selected: SelectedAddon[];
  onSelectionChange: (next: SelectedAddon[]) => void;
  /** Adds the product to the cart with the given add-ons. */
  onConfirm: (addons: SelectedAddon[]) => void;
  submitting?: boolean;
}

/** Add-on picker for MANUAL-supplier products, opened by the Add to Cart
 * button before the item is added; the chosen add-ons go in the same request. */
export default function AddOnModal({
  open,
  onClose,
  productId,
  name,
  productQty,
  addons,
  selected,
  onSelectionChange,
  onConfirm,
  submitting = false,
}: AddOnModalProps) {
  if (!open) return null;

  // Keep the quantity already set for an add-on that stays picked.
  const changeSelection = (next: ProductAddon[]) =>
    onSelectionChange(next.map((a) => selected.find((s) => s.id === a.id) ?? toSelectedAddon(a)));

  const update = (id: number, patch: Partial<Pick<SelectedAddon, "forAll" | "quantity">>) =>
    onSelectionChange(selected.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add more products"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm"
    >
      <div className="relative w-full sm:w-[600px] max-w-[92vw] bg-card overflow-hidden rounded-[20px] shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        <div className="bg-primary px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-primary" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-foreground leading-tight">Add more products</p>
            <p className="text-[12px] text-foreground/55 truncate">{name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="w-8 h-8 rounded-[8px] bg-foreground/10 border border-foreground/15 flex items-center justify-center text-foreground/50 hover:text-foreground transition-all flex-shrink-0 disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="h-[1.5px] bg-foreground flex-shrink-0" />

        <div className="px-5 pt-5 pb-2 overflow-y-auto flex-1 min-h-0">
          <AddOnSuggestions
            productId={productId}
            addons={addons}
            selected={selected}
            onSelectionChange={changeSelection}
          />

          {selected.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-bold tracking-widest uppercase text-foreground font-heading">
                How Many
              </p>
              {selected.map((a) => {
                const count = addonQuantity(a, productQty);
                const unit = addonUnitPrice(a);
                return (
                  <div key={a.id} className="rounded-[14px] border border-border p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-[13px] font-semibold text-foreground">{a.name}</p>
                      <p className="flex-shrink-0 text-[13px] tabular-nums text-muted-foreground">
                        {count} × ${formatMoney(unit)} ={" "}
                        <span className="font-bold text-foreground">${formatMoney(unit * count)}</span>
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <label className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.forAll}
                          onChange={(e) => update(a.id, { forAll: e.target.checked })}
                          className="h-4 w-4 accent-foreground"
                        />
                        One for every item ({productQty})
                      </label>
                      {!a.forAll && (
                        <QuantityInput
                          value={a.quantity}
                          label={`How many ${a.name}`}
                          onCommit={(n) => update(a.id, { quantity: n })}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-2 bg-card flex-shrink-0 border-t border-foreground/5">
          <button
            onClick={() => onConfirm([])}
            disabled={submitting}
            className="h-[48px] rounded-[14px] text-[13px] font-medium border border-foreground text-foreground hover:bg-foreground/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Skip add-ons
          </button>
          <button
            disabled={submitting || selected.length === 0}
            onClick={() => onConfirm(selected)}
            className="h-[48px] rounded-[14px] text-[13px] font-medium bg-foreground text-primary hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
