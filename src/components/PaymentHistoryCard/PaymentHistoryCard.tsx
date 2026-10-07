"use client";

import React, { useState } from "react";
import { isSafeHttpUrl } from "@/lib/validation";

// Summary of the order's first item. Kept on the type because the API
// sends it, but the card doesn't render it — one order can hold several
// products, so order.items is the source of truth.
export interface PaymentPreview {
  product_name: string;
  original_image: string | null;
  customized_image: string | null;
  total_items: number;
  print_method: string | null;
  type: string | null;
  custom_text: string | null;
}

export interface PaymentPricingBreakdown {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// Supplier products (SanMar / S&S) carry print_method + locations;
// manual products send type: "MANUAL" and keep their options in
// pricing_snapshot instead.
export interface PaymentItemCustomizationConfig {
  print_method?: string;
  locations?: { location: string }[];
  customizations?: { color?: string; size?: string; quantity?: number }[];
  type?: string;
}

export interface PaymentItemPricingSnapshot {
  supplier?: string;
  customization_price?: { total_customization_price: number; setup_fee: number };
  customization?: {
    items: { option_name: string; value_name: string; total: number }[];
    total: number;
  };
  addons?: { name: string; quantity: number; total: number }[];
  final_price_per_item?: number;
  total_price?: number;
}

export interface PaymentOrderItem {
  product_id: number;
  product_name: string;
  variant_id: number;
  sku: string;
  original_image: string | null;
  customized_image: string | null;
  price: number;
  quantity: number;
  total: number;
  customization_config?: PaymentItemCustomizationConfig | null;
  pricing_snapshot?: PaymentItemPricingSnapshot | null;
}

// ★ FIXED — subtotal_amount, tax_amount, and tax_rate were missing here
// even though the API sends them (see cost breakdown below). Without
// them, the card was faking a "subtotal" by subtracting shipping off
// total_amount — which still includes tax, so it wasn't a real subtotal.
export interface PaymentOrder {
  order_id: number;
  order_number: string;
  subtotal_amount: number;
  tax_amount: number;
  tax_rate: number;
  shipping_amount: number;
  total_amount: number;
  pricing_breakdown?: PaymentPricingBreakdown | null;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  shipment_status: "SUCCESS" | "FAILED" | "PENDING" | "IN_TRANSIT";
  tracking_number: string | null;
  tracking_url: string | null;
  preview?: PaymentPreview | null;
  items?: PaymentOrderItem[];
}

export interface Payment {
  payment_id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  created_at: string;
  order: PaymentOrder;
}

interface PaymentHistoryCardProps {
  payment: Payment;
}

// Status dot colors stay semantic (green/red/amber/blue) for at-a-glance
// scanning, while the badge chrome itself follows the neutral theme.
const statusConfig: Record<string, { label: string; dot: string }> = {
  SUCCESS: { label: "Success", dot: "bg-emerald-500" },
  FAILED: { label: "Failed", dot: "bg-destructive" },
  PENDING: { label: "Pending", dot: "bg-amber-500" },
  REFUNDED: { label: "Refunded", dot: "bg-muted-foreground" },
  IN_TRANSIT: { label: "In Transit", dot: "bg-blue-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, dot: "bg-muted-foreground" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-secondary text-secondary-foreground border border-border">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// toLocaleString() alone drops trailing zeros (307.2 → "307.2"), so pin
// money to two decimals.
function formatMoney(value: number | null | undefined) {
  return `$${(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Order-level badge: the distinct print methods across all items
// (e.g. "EMBROIDERY"), or "CUSTOM" for orders made only of manual products.
function getOrderMethodLabel(items: PaymentOrderItem[]) {
  const methods = Array.from(
    new Set(items.map((i) => i.customization_config?.print_method).filter(Boolean))
  ) as string[];
  if (methods.length) return methods.join(" · ");
  if (items.length && items.every((i) => i.customization_config?.type === "MANUAL")) {
    return "CUSTOM";
  }
  return null;
}

// Labeled customization rows for one item, covering both shapes: supplier
// items (print method, color, size, locations) and manual items (chosen
// options + add-ons from pricing_snapshot).
function getItemDetails(item: PaymentOrderItem) {
  const config = item.customization_config;
  const snapshot = item.pricing_snapshot;
  const variant = config?.customizations?.[0];
  const locations = (config?.locations ?? []).map((l) => l.location);
  const details: { label: string; value: string }[] = [];

  if (config?.print_method) details.push({ label: "Print Method", value: config.print_method });
  if (variant?.color) details.push({ label: "Color", value: variant.color });
  if (variant?.size) details.push({ label: "Size", value: variant.size });
  if (locations.length) {
    details.push({ label: locations.length > 1 ? "Locations" : "Location", value: locations.join(", ") });
  }
  for (const c of snapshot?.customization?.items ?? []) {
    details.push({ label: c.option_name, value: c.value_name });
  }
  for (const a of snapshot?.addons ?? []) {
    details.push({ label: "Add-on", value: `${a.name} (${formatMoney(a.total)})` });
  }

  return details;
}

// Prefers the customized mockup; drops back to the plain product image if
// there's none or it fails to load.
function ItemImage({ item }: { item: PaymentOrderItem }) {
  const [src, setSrc] = useState(item.customized_image || item.original_image);

  if (!src) {
    return <div className="w-16 h-16 shrink-0 rounded-md border border-border bg-muted" />;
  }
  return (
    <img
      src={src}
      alt={item.product_name}
      className="w-16 h-16 shrink-0 rounded-md object-contain border border-border bg-background"
      onError={() => setSrc(src !== item.original_image ? item.original_image : null)}
    />
  );
}

function OrderItemDetail({ item, index }: { item: PaymentOrderItem; index: number }) {
  const details = getItemDetails(item);

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
        Item {index + 1}
      </p>
      <div className="flex gap-3">
        <ItemImage item={item} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{item.product_name}</p>
          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5" title={item.sku}>
            SKU: {item.sku}
          </p>
        </div>
      </div>

      <dl className="mt-2.5 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="font-medium text-foreground">{item.quantity}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-medium text-foreground">{formatMoney(item.price)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-bold text-foreground">{formatMoney(item.total)}</dd>
        </div>
      </dl>

      {details.length > 0 && (
        <div className="mt-2.5 bg-background border border-border rounded-md px-3 py-2">
          <p className="text-[11px] font-semibold text-foreground mb-1">Customization</p>
          <dl className="space-y-0.5 text-[11px]">
            {details.map((d, i) => (
              <div key={`${d.label}-${i}`} className="flex gap-1.5">
                <dt className="text-muted-foreground shrink-0">{d.label}:</dt>
                <dd className="text-foreground font-medium min-w-0 break-words">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  );
}

export default function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const { order } = payment;
  const [itemsOpen, setItemsOpen] = useState(false);

  if (!order) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 text-sm text-muted-foreground">
        Order details unavailable for transaction{" "}
        <span className="font-mono">{payment?.transaction_id ?? "—"}</span>
      </div>
    );
  }

  // Product info comes from order.items only, and only inside the
  // accordion — order.preview is never rendered.
  const items = order.items ?? [];
  const methodLabel = getOrderMethodLabel(items);
  const itemsPanelId = `order-items-${order.order_id}`;

  // pricing_breakdown mirrors the flat *_amount fields; prefer it when sent.
  const breakdown = order.pricing_breakdown;
  const subtotal = breakdown?.subtotal ?? order.subtotal_amount;
  const tax = breakdown?.tax ?? order.tax_amount;
  const shipping = breakdown?.shipping ?? order.shipping_amount;
  const total = breakdown?.total ?? order.total_amount;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/30 hover:shadow-lg transition-all duration-300">
      {/* Top strip */}
      <div className="h-1 w-full bg-primary" />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
              Order Number
            </p>
            <p className="text-sm font-bold text-foreground font-mono break-all">{order.order_number}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-heading text-2xl font-extrabold text-foreground leading-tight">
              {formatMoney(payment.amount)}
              <span className="text-sm font-semibold text-muted-foreground ml-1">
                {payment.currency}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(payment.created_at)} · {formatTime(payment.created_at)}
            </p>
          </div>
        </div>

        {/* Items accordion — collapsed it shows only the count (from
            order.items.length) and the order-level print method; product
            details appear only once it's opened. */}
        <div className="bg-secondary rounded-md mb-5">
          <button
            type="button"
            onClick={() => setItemsOpen((o) => !o)}
            aria-expanded={itemsOpen}
            aria-controls={itemsPanelId}
            disabled={items.length === 0}
            className="flex w-full items-center gap-3 p-3 text-left disabled:cursor-default"
          >
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{items.length}</span>{" "}
              {items.length === 1 ? "Item" : "Items"}
            </span>
            {methodLabel && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs bg-primary/20 text-foreground font-semibold px-2 py-0.5 rounded-full">
                  {methodLabel}
                </span>
              </>
            )}
            {items.length > 0 && (
              <svg
                className={`ml-auto w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  itemsOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {itemsOpen && items.length > 0 && (
            <ul id={itemsPanelId} className="border-t border-border px-3 py-3 divide-y divide-border">
              {items.map((item, idx) => (
                // The same product/variant can appear more than once with
                // different customizations, so the index is part of the key.
                <OrderItemDetail key={`${item.variant_id}-${idx}`} item={item} index={idx} />
              ))}
            </ul>
          )}
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Payment:</span>
            <StatusBadge status={order.payment_status} />
          </div>
          <span className="text-border text-xs">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Shipment:</span>
            <StatusBadge status={order.shipment_status} />
          </div>
        </div>

        {/* Cost breakdown — uses the real subtotal / tax fields from the
            API rather than deriving subtotal as total - shipping (which
            would still include tax). */}
        <div className="bg-secondary rounded-md px-4 py-3 mb-5 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-foreground">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tax{order.tax_rate ? ` (${order.tax_rate}%)` : ""}</span>
            <span className="font-medium text-foreground">{formatMoney(tax)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Shipping</span>
            <span className="font-medium text-foreground">{formatMoney(shipping)}</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold text-foreground">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        {/* Transaction ID + Tracking */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-muted-foreground">Transaction ID:</span>
            <span className="text-xs font-mono text-foreground truncate max-w-[180px]">
              {payment.transaction_id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs text-muted-foreground">Tracking:</span>
            <span className="text-xs font-mono text-foreground truncate">
              {order.tracking_number ?? "Not available yet"}
            </span>
          </div>
        </div>

        {/* CTA — tracking_url comes from the order/carrier API, so it's
            validated as an actual http(s) link before ever reaching an
            href; a javascript:/data: scheme there would otherwise execute
            in this origin when clicked. */}
        {isSafeHttpUrl(order.tracking_url) && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Track Shipment
          </a>
        )}
      </div>
    </div>
  );
}
