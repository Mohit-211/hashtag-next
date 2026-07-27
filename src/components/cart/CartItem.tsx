"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, UploadCloud, Stamp, Loader2 } from "lucide-react";
import { message } from "antd";

import {
  IncrementCartItemApi,
  DecrementCartItemApi,
  RemoveFromCartApi,
} from "@/api/operations/cart.api";

import ProxyImage from "../ProxyImage";
import type { CartItemType } from "./CartItemsList";

// ---- design tokens for the "production ticket" treatment ----
const STAMP = "#C1440E"; // rubber-stamp ink, print method badge
const THREAD = "#0E7C7B"; // thread teal, location pins

interface Props {
  item: CartItemType;
  onRefresh: () => void;
}

export default function CartItem({ item, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  /* ── Typeable quantity ──
     There's no "set quantity to X" endpoint — only +1 / -1 (Increment /
     DecrementCartItemApi). So `qtyInput` is a local string buffer the user
     can freely type/clear into, and on blur/Enter we reconcile it against
     the server's current `item.quantity` by firing however many
     increment/decrement calls are needed to land on the typed value —
     functionally identical to clicking +/- that many times. */
  const [qtyInput, setQtyInput] = useState<string>(String(item.quantity));
  useEffect(() => {
    setQtyInput(String(item.quantity));
  }, [item.quantity]);

  const locations = item.customization?.locations ?? [];
  const breakdown = item.customization?.breakdown ?? [];
  const printMethod = item.customization?.printMethod ?? null;
  // const uploadedImageName = item.customization?.uploadedImageName ?? null;
  const uploadedImage = item.logo_image?? null;
  const colorCode = item.colorCode ?? null;

  const itemTotal =
    item.totalPrice && item.totalPrice > 0
      ? item.totalPrice
      : item.basePrice * item.quantity;

  const handleDecrease = async () => {
    if (item.quantity <= 1 || loading || item.canDecrease === false) return;
    try {
      setLoading(true);
      await DecrementCartItemApi({ cart_id: item.cart_id });
      message.success("Quantity decreased");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      message.error("Failed to decrease quantity");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (loading || item.canIncrease === false) return;
    try {
      setLoading(true);
      await IncrementCartItemApi({ cart_id: item.cart_id });
      message.success("Quantity increased");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      message.error("Failed to increase quantity");
    } finally {
      setLoading(false);
    }
  };

  /* ── Reconcile a manually-typed quantity ──
     Clamps to a 1-piece floor, does nothing if the value is unchanged or
     invalid, then walks the gap one call at a time (respecting
     canIncrease/canDecrease the same way the +/- buttons do) so any
     stock-ceiling or floor enforced by those flags is still honored. */
  const commitTypedQty = async (raw: string) => {
    const parsed = Number(raw);
    const target = Number.isFinite(parsed) ? Math.floor(parsed) : item.quantity;
    const safeTarget = Math.max(1, target);

    if (loading) return;
    if (safeTarget === item.quantity) {
      setQtyInput(String(item.quantity));
      return;
    }

    setLoading(true);
    try {
      let current = item.quantity;
      if (safeTarget > current) {
        while (current < safeTarget) {
          if (item.canIncrease === false) break;
          await IncrementCartItemApi({ cart_id: item.cart_id });
          current += 1;
        }
      } else {
        while (current > safeTarget) {
          if (current <= 1 || item.canDecrease === false) break;
          await DecrementCartItemApi({ cart_id: item.cart_id });
          current -= 1;
        }
      }
      message.success("Quantity updated");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      message.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await RemoveFromCartApi(item.cart_id);
      message.success("Item removed");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      message.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const hasSpecs =
    printMethod || locations.length > 0 || uploadedImage || breakdown.length > 0;

  return (
    <div className="relative overflow-visible rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Top: garment block */}
      <div className="flex gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <div className="w-full h-full rounded-lg overflow-hidden bg-secondary ring-1 ring-border">
            <ProxyImage
              src={item?.image}
              alt={item?.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
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
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="font-semibold leading-tight truncate">{item.name}</h3>

              <p className="text-sm text-muted-foreground">
                ${item.basePrice}
                <span className="font-mono text-xs">/pcs</span>
              </p>

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
                      style={{ backgroundColor: colorCode ?? "#d4d4d4" }}
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

   

      {/* Production ticket: print method, locations, artwork proof */}
      {hasSpecs && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {printMethod && (
              <span
                className="inline-flex items-center gap-1 rounded-md border-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: STAMP, color: STAMP }}
              >
                <Stamp className="h-3 w-3" />
                {printMethod}
              </span>
            )}

            {locations.length > 0 && (
              <span
                className="inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide border"
                style={{ borderColor: THREAD, color: THREAD }}
              >
                {locations.length} {locations.length === 1 ? "Location" : "Locations"}
              </span>
            )}

            {locations.map((l, i) => (
              <span
                key={`${l.location}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${THREAD}1A`, color: THREAD }}
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] text-white"
                  style={{ backgroundColor: THREAD }}
                >
                  {i + 1}
                </span>
                {l.location.replaceAll("_", " ")}
              </span>
            ))}
          </div>

          {/* Artwork proof swatch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => uploadedImage && setPreviewSrc(uploadedImage)}
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

            <div className="min-w-0 leading-tight">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Artwork 
              </p>
              {/* {uploadedImageName ? (
                <p className="text-xs font-medium truncate max-w-[180px]" title={uploadedImageName}>
                  {uploadedImageName}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">None uploaded</p>
              )} */}
            </div>
          </div>

          {/* Mixed size/color breakdown */}
          {breakdown.length > 1 && (
            <div className="rounded-md bg-muted/50 divide-y divide-border/60 overflow-hidden">
              {breakdown.map((b, idx) => (
                <div
                  key={`${b.variant_id}-${idx}`}
                  className="flex justify-between px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground"
                >
                  <span>
                    {b.size ?? ""} {b.color ? `· ${b.color}` : ""} × {b.quantity}
                  </span>
                  <span className="text-foreground/80">${b.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom: quantity + total */}
      <div className="flex items-center justify-between pt-4 mt-1 border-t border-border/60">
        <div className="flex items-center rounded-full border border-border overflow-hidden bg-background">
          <button
            onClick={handleDecrease}
            disabled={loading || item.quantity <= 1 || item.canDecrease === false}
            className="p-2 hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* ★ CHANGED — was a static <span>{item.quantity}</span>, only
              changeable via the +/- buttons. Now a typeable <input>.
              `qtyInput` is a local string buffer so typing/clearing digits
              doesn't fight the server-driven `item.quantity` on every
              keystroke; the value is only reconciled against the backend
              (via commitTypedQty, walking Increment/DecrementCartItemApi
              the needed number of times) on blur or Enter. While that
              reconciliation is in flight, `loading` disables the field
              and shows a small spinner instead of the +/- buttons area
              being separately clickable, avoiding overlapping requests. */}
          <div className="relative w-9 flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <input
                type="number"
                inputMode="numeric"
                value={qtyInput}
                min={1}
                disabled={loading}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={(e) => commitTypedQty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="w-full bg-transparent text-center font-mono text-sm font-semibold outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
          </div>

          <button
            onClick={handleIncrease}
            disabled={loading || item.canIncrease === false}
            className="p-2 hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="font-bold text-lg tabular-nums">${itemTotal.toFixed(2)}</p>
      </div>

      {/* Artwork preview lightbox */}
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewSrc(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewSrc(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
            aria-label="Close preview"
          >
            ×
          </button>
          <img
            src={previewSrc}
            alt="Artwork preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}