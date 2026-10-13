"use client";

import { Check, Copy, ExternalLink, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** The order/shipment fields tracking needs — present on both the order list and order detail. */
export interface TrackableOrder {
  status?: string;
  payment_status?: string;
  shipment_status?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
}

const STAGES = ["Order placed", "Payment confirmed", "Shipped", "Delivered"] as const;

const upper = (v?: string) => (v ?? "").toUpperCase();

/** Index into STAGES, or -1 when the order was cancelled / payment failed. */
export function orderStage(o: TrackableOrder): number {
  const status = upper(o.status);
  const payment = upper(o.payment_status);
  const shipment = upper(o.shipment_status);
  if (status === "CANCELLED" || payment === "FAILED") return -1;
  if (shipment === "DELIVERED" || status === "DELIVERED") return 3;
  if (
    ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(shipment) ||
    ["SHIPPED", "OUT_FOR_DELIVERY"].includes(status) ||
    !!o.tracking_number
  ) {
    return 2;
  }
  if (payment === "SUCCESS" || payment === "PAID") return 1;
  return 0;
}

export const orderStageLabel = (o: TrackableOrder) => {
  const stage = orderStage(o);
  return stage < 0 ? "Cancelled" : STAGES[stage];
};

export const formatOrderDate = (raw?: string) =>
  raw
    ? new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

/** Progress steps plus carrier / tracking number / "Track package" link. */
export default function ShipmentTracking({ order }: { order: TrackableOrder }) {
  const stage = orderStage(order);
  const [copied, setCopied] = useState(false);

  if (stage < 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
        <XCircle className="h-4 w-4 shrink-0" />
        This order was cancelled or its payment didn&apos;t go through.
      </div>
    );
  }

  const copyTracking = async () => {
    if (!order.tracking_number) return;
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the number is still visible to copy by hand.
    }
  };

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
        {STAGES.map((label, i) => {
          const done = i <= stage;
          return (
            <li key={label} className="flex flex-col gap-2" aria-current={i === stage ? "step" : undefined}>
              <span className={cn("h-1.5 rounded-full", done ? "bg-primary" : "bg-muted")} />
              <span
                className={cn(
                  "text-xs leading-tight",
                  i === stage ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {order.tracking_number ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="text-xs text-muted-foreground">
              {order.carrier ? `${order.carrier.toUpperCase()} tracking number` : "Tracking number"}
              {order.shipped_at ? ` · shipped ${formatOrderDate(order.shipped_at)}` : ""}
            </p>
            <button
              type="button"
              onClick={copyTracking}
              className="mt-0.5 inline-flex max-w-full items-center gap-1.5 font-mono font-semibold text-foreground hover:text-primary-ink"
              aria-label="Copy tracking number"
            >
              <span className="truncate">{order.tracking_number}</span>
              {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-success" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
            </button>
          </div>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Track package <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {stage >= 2
            ? "Your order has shipped. Tracking details will appear here shortly."
            : "You'll get a tracking number here as soon as your order ships."}
        </p>
      )}
    </div>
  );
}
