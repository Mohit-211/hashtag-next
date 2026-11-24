"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Minus, Plus, Trash2, UploadCloud, Stamp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  IncrementCartItemApi,
  DecrementCartItemApi,
  RemoveFromCartApi,
  UpdateCartQuantityApi,
} from "@/api/operations/cart.api";

import ProxyImage from "../ProxyImage";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { parseCustomizationConfig, type CartItemType } from "./CartItemsList";

interface Props {
  item: CartItemType;
  /** Fetches the cart again; quantity changes wait for it (see below). */
  onRefresh: () => void | Promise<void>;
}

export default function CartItem({ item, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  // Set while a request for this line runs. A ref, not `loading`: state only
  // changes on the next render, so two events in a row would both see false.
  const inFlightRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  /* ── Typeable quantity ──
     `qtyDraft` is a local string buffer the user can freely type/clear into
     (null when not editing — the box then shows `item.quantity`). On
     blur/Enter the value goes to the API in one call. */
  const [qtyDraft, setQtyDraft] = useState<string | null>(null);
  const qtyInput = qtyDraft ?? String(item.quantity);

  /* ── Keyboard focus through a save (A11Y-045) ──
     The box and the +/- buttons are disabled while a save runs, and the browser
     drops focus from a disabled control. `refocusRef` holds where keyboard focus
     should be once the save is done: the box after Enter, a +/- button pressed
     from the keyboard, or wherever Tab was going when the box was left. */
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const refocusRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (loading) return;
    const target = refocusRef.current;
    refocusRef.current = null;
    // Only when the save dropped focus, never when the shopper moved it on.
    const active = document.activeElement;
    if (!(target instanceof HTMLElement) || !target.isConnected || (active && active !== document.body)) return;
    // A button can stay disabled after the save (- at the minimum): the box takes focus then.
    (target.matches(":disabled") ? qtyInputRef.current : target)?.focus();
  }, [loading]);

  // The API refuses less than this rather than removing the line (Q36).
  const minQuantity = item.min_quantity ?? 1;

  // ★ FIXED — the API nests print method / locations under
  // `customization_config`, not `customization`, and does not include a
  // `breakdown` array on the item at all (each size/color variant now
  // arrives as its own separate cart item, e.g. cart_id 18 vs 19 — see
  // response shape). The old `.customization?.breakdown` lookup always
  // resolved to undefined, so that section is removed rather than fixed.
  const config = parseCustomizationConfig(item.customization_config);
  const locations = config?.locations ?? [];
  const printMethod = config?.print_method ?? null;
  const pricingRows = item.pricing_snapshot?.pricing_table ?? [];
  const productUnitPrice = item.pricing_snapshot?.product_price?.final_product_price;
  const unitPrice = item.pricing_snapshot?.final_price_per_item ?? item.price;
  const money = (n: unknown) => (Number(n) || 0).toFixed(2);
  // Rows can arrive without a type or location; never crash the cart on that.
  const label = (s?: string | null) =>
    String(s ?? "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const uploadedImage = item.logo_image ?? null;
  const colorCode = item.color_code ?? null;

  const itemTotal =
    item.total_price && item.total_price > 0
      ? item.total_price
      : (item.price ?? 0) * item.quantity;

  // The handling fee is charged once per order and shown in the cart summary.
  // Older lines still carry a per-line `handling_charge` in their snapshot,
  // but it's no longer part of the line total, so it isn't shown here.
  const designFee = item.pricing_snapshot?.customization_price?.setup_fee;
  const showDesignFee = !!designFee && designFee > 0;

  /* ── +/- (BUG-024) ──
     A typed value that hasn't been sent yet goes first, then the step applies
     to it: 5, type 10, + → quantity 10, then increment → 11. The buttons don't
     take focus when pressed (onMouseDown below), so pressing one no longer
     blurs the box, sends the typed value on its own and disables the button
     before its click arrives. One request at a time, in order. */
  const changeQuantity = async (step: 1 | -1, focusAfter: EventTarget | null) => {
    if (inFlightRef.current) return;
    const draft = qtyDraft;
    setQtyDraft(null);

    const typed = Math.floor(Number(draft));
    const hasTyped = draft !== null && draft.trim() !== "" && Number.isFinite(typed);
    const target = hasTyped ? Math.max(minQuantity, typed) : null;
    const base = target ?? item.quantity;
    const update = target !== null && target !== item.quantity;
    // ★ FIXED — was item.canIncrease/canDecrease, API sends can_increase/can_decrease.
    // Those describe the line's current quantity, not a typed one.
    const stepAllowed =
      step === 1
        ? target !== null || item.can_increase !== false
        : base > minQuantity && (target !== null || item.can_decrease !== false);
    if ((hasTyped && typed < minQuantity) || (step === -1 && base <= minQuantity)) {
      toast.error(`The minimum for this item is ${minQuantity}.`);
    }
    if (!update && !stepAllowed) return;

    // The box stays on the page during the save, holding the typed quantity
    // rather than the old one (A11Y-045).
    if (update) setQtyDraft(String(target));
    inFlightRef.current = true;
    refocusRef.current = focusAfter;
    setLoading(true);
    let changed = false;
    try {
      if (update) {
        await UpdateCartQuantityApi({ cart_id: item.cart_id, quantity: target });
        changed = true;
        toast.success("Quantity updated");
      }
      if (stepAllowed) {
        if (step === 1) await IncrementCartItemApi({ cart_id: item.cart_id });
        else await DecrementCartItemApi({ cart_id: item.cart_id });
        changed = true;
        toast.success(step === 1 ? "Quantity increased" : "Quantity decreased");
      }
    } catch (err) {
      // The axios response interceptor already toasts the failure. A failed
      // update skips the step, which was meant for the typed quantity.
      console.error(err);
    }
    try {
      // One refresh for the whole sequence, also when only its first part
      // worked. The spinner stays until it's done: without it the box shows
      // the old cart's quantity until the refreshed cart arrives.
      if (changed) await onRefresh();
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setQtyDraft(null);
    }
  };

  // A keyboard press arrives as a click with detail 0 and gets focus back on
  // its button after the save. A click or tap never focuses the button
  // (onMouseDown below), so it leaves focus as it was.
  type StepClick = { detail: number; currentTarget: HTMLButtonElement };
  const handleDecrease = (e: StepClick) => changeQuantity(-1, e.detail === 0 ? e.currentTarget : null);
  const handleIncrease = (e: StepClick) => changeQuantity(1, e.detail === 0 ? e.currentTarget : null);

  /* ── Commit a manually-typed quantity ──
     Does nothing if the box was left empty or unchanged, and never goes below
     the line's minimum: removing a line stays on the Remove button.
     `focusAfter`: where keyboard focus goes once the save is done (see refocusRef). */
  const commitTypedQty = async (raw: string, focusAfter: EventTarget | null) => {
    // Also covers the blur the box fires when it's disabled for a save.
    if (inFlightRef.current) return;
    setQtyDraft(null);

    const typed = Math.floor(Number(raw));
    if (raw.trim() === "" || !Number.isFinite(typed)) return;
    if (typed < minQuantity) toast.error(`The minimum for this item is ${minQuantity}.`);

    const target = Math.max(minQuantity, typed);
    if (target === item.quantity) return;

    // The box stays on the page during the save, holding the quantity being
    // saved rather than the old one (A11Y-045).
    setQtyDraft(String(target));
    inFlightRef.current = true;
    refocusRef.current = focusAfter;
    setLoading(true);
    try {
      await UpdateCartQuantityApi({ cart_id: item.cart_id, quantity: target });
      toast.success("Quantity updated");
      // Keep the spinner until the cart has the new quantity; otherwise the box
      // falls back to the old one while the refresh runs.
      await onRefresh();
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setQtyDraft(null);
    }
  };

  const handleRemove = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setLoading(true);
      await RemoveFromCartApi(item.cart_id);
      toast.success("Item removed");
      onRefresh();
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  // ★ FIXED — breakdown removed from the check, see note above.
  const graphics = item.graphics ?? [];
  const hasSpecs = printMethod || locations.length > 0 || uploadedImage || graphics.length > 0;

  return (
    <div className="relative overflow-visible rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Top: garment block */}
      <div className="flex gap-4">
        <Link
          href={item.product_id ? `/product/${item.product_id}` : "#"}
          className="relative w-24 h-24 shrink-0"
        >
          <div className="w-full h-full rounded-lg overflow-hidden bg-muted ring-1 ring-border">
            <ProxyImage
              src={item?.image}
              alt={item?.name}
              width={96}
              height={96}
              className="w-full h-full"
            />
          </div>

          {item?.logo_image && (
            <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-md overflow-hidden border-2 border-background shadow-md bg-card">
              <ProxyImage
                src={item.logo_image}
                alt="Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <Link
                href={item.product_id ? `/product/${item.product_id}` : "#"}
                className="font-semibold leading-tight whitespace-normal sm:truncate hover:text-primary-ink transition-colors block"
              >
                {item.name}
              </Link>

             

              <div className="flex items-center gap-3 pt-0.5">
                {item.size && (
                  <span className="font-mono text-[11px] uppercase tracking-wide border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                    {item.size}
                  </span>
                )}
                {item.color && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="w-3 h-3 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: colorCode ?? "var(--color-muted)" }}
                    />
                    {item.color}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleRemove}
              disabled={loading}
              aria-label="Remove item"
              className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Shoppers see whether the line can be filled, never a stock number (Q49) */}
      {item.stock_status && item.stock_status !== "AVAILABLE" && item.stock_message && (
        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {item.stock_message}
        </p>
      )}

      {/* Production ticket: print method, locations, artwork proof */}
      {hasSpecs && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {printMethod && (
              <span
                className="inline-flex items-center gap-1 rounded-md border-2 border-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground"
              >
                <Stamp className="h-3 w-3" />
                {printMethod}
              </span>
            )}

            {locations.length > 0 && (
              <span
                className="inline-flex items-center rounded border border-secondary-ink px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-secondary-ink"
              >
                {locations.length} {locations.length === 1 ? "Location" : "Locations"}
              </span>
            )}

            {locations.map((l, i) => (
              <span
                key={`${l.location}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground"
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-[9px] text-background"
                >
                  {i + 1}
                </span>
                {l.location.replaceAll("_", " ")}
              </span>
            ))}
          </div>

          {/* Artwork proof swatch. Opens the preview as a Radix dialog, which
              moves focus in, traps it, closes on Escape and, because the
              swatch is its DialogTrigger, puts focus back on the swatch. */}
          <div className="flex items-center gap-3">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  disabled={!uploadedImage}
                  className="w-12 h-12 shrink-0 rounded-md border border-dashed border-border bg-background/60 overflow-hidden disabled:cursor-default enabled:cursor-zoom-in enabled:hover:opacity-80 transition"
                >
                  {uploadedImage ? (
                    <ProxyImage
                      src={uploadedImage}
                      alt={"Uploaded artwork"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UploadCloud className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </button>
              </DialogTrigger>

              {/* Same full-screen lightbox as before: the content box fills
                  the viewport and is the dark backdrop, so a click on it
                  (not on the image) closes, as the old overlay did.
                  Radix hides the rest of the page with aria-hidden but
                  doesn't set aria-modal itself, so it's set here. */}
              <DialogContent
                showCloseButton={false}
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setPreviewOpen(false);
                }}
                className="inset-0 flex max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none bg-foreground/70 p-4 ring-0 sm:max-w-none"
              >
                <DialogTitle className="sr-only">Artwork preview</DialogTitle>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="absolute top-4 right-4 text-background/80 hover:text-background text-2xl leading-none"
                    aria-label="Close preview"
                  >
                    ×
                  </button>
                </DialogClose>
                {uploadedImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- lightbox sized by the image itself
                  <img
                    src={uploadedImage}
                    alt="Artwork preview"
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                  />
                )}
              </DialogContent>
            </Dialog>

            <div className="min-w-0 leading-tight">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Artwork
              </p>
              {graphics.map((graphic) => (
                <p key={graphic.id} className="mt-0.5 truncate text-xs text-foreground" title={graphic.original_name}>
                  {graphic.original_name}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price breakdown: garment + each decoration (type · position) per item */}
      {(pricingRows.length > 0 || productUnitPrice != null) && (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 divide-y divide-border/60 text-xs">
          {productUnitPrice != null && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground">Product</span>
              <span className="font-mono font-semibold tabular-nums">${money(productUnitPrice)}</span>
            </div>
          )}
          {pricingRows.map((row, i) => (
            <div key={`${row.type}-${row.location}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 text-muted-foreground">
                <span className="font-semibold text-foreground">{label(row.type) || "Decoration"}</span>
                {row.location && <>{" · "}{label(row.location)}</>}
              </span>
              <span className="font-mono font-semibold tabular-nums shrink-0">+${money(row.price_per_item)}</span>
            </div>
          ))}
          {unitPrice != null && (
            <div className="flex items-center justify-between px-3 py-2 font-semibold">
              <span>Price per item</span>
              <span className="font-mono tabular-nums">${money(unitPrice)}</span>
            </div>
          )}
        </div>
      )}

      {/* Graphic setup fee, if applicable: on the first line with a new graphic */}
      {showDesignFee && (
        <div className="flex items-center justify-between px-0.5 pt-3 mt-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            One-time graphic setup fee
          </span>
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            +${designFee!.toFixed(2)}
          </span>
        </div>
      )}

      {/* Bottom: quantity + total */}
      <div className="flex items-center justify-between pt-4 mt-1 border-t border-border/60">
        <div className="flex items-center rounded-full border border-border overflow-hidden bg-background">
          {/* While a value is typed, the step applies to it (see changeQuantity),
              so the line's own limits don't disable the buttons then. Pressing
              them keeps focus in the box (BUG-024). */}
          <button
            onClick={handleDecrease}
            onMouseDown={(e) => e.preventDefault()}
            disabled={
              loading ||
              (qtyDraft === null && (item.quantity <= minQuantity || item.can_decrease === false))
            }
            className="p-2 hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* ★ CHANGED — was a static <span>{item.quantity}</span>, only
              changeable via the +/- buttons. Now a typeable <input>.
              `qtyInput` is a local string buffer so typing/clearing digits
              doesn't fight the server-driven `item.quantity` on every
              keystroke; the value only goes to the backend (commitTypedQty)
              on blur or Enter. While that request is in flight, `loading`
              disables the field and the +/- buttons, avoiding overlapping
              requests. The field stays mounted, so it keeps its name and its
              place for keyboard focus; it's invisible then and a small spinner
              sits on top of it, as before (A11Y-045). */}
          <div className="relative w-12 flex items-center justify-center">
            <input
              ref={qtyInputRef}
              type="number"
              inputMode="numeric"
              aria-label={`Quantity for ${item.name}`}
              value={qtyInput}
              min={minQuantity}
              disabled={loading}
              onChange={(e) => setQtyDraft(e.target.value)}
              onBlur={(e) => commitTypedQty(e.target.value, e.relatedTarget)}
              onKeyDown={(e) => {
                // Saves in place: focus stays in the box (A11Y-045).
                if (e.key === "Enter") commitTypedQty(e.currentTarget.value, e.currentTarget);
              }}
              className="w-full bg-transparent text-center font-mono text-sm font-semibold outline-none disabled:opacity-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {loading && (
              <Loader2 className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          <button
            onClick={handleIncrease}
            onMouseDown={(e) => e.preventDefault()}
            disabled={loading || (qtyDraft === null && item.can_increase === false)}
            className="p-2 hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="font-bold text-lg tabular-nums">${itemTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}