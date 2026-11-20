"use client";

import { Check, Copy, ExternalLink, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
const PREPARING = "Preparing to ship";

const upper = (v?: string) => (v ?? "").toUpperCase();

/** A status in the shopper's words; `tone` picks its colour. */
export interface StatusText {
  label: string;
  tone: "waiting" | "progress" | "success" | "danger";
}

/** "SOME_VALUE" → "Some value", for a status this file doesn't know. */
const humanize = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");

/**
 * Paid, with no carrier scan yet: the label exists (SUCCESS on orders from before
 * labels moved after payment), or it needs the team's attention (FAILED, which
 * the customer never needs to hear about).
 */
export const isPreparingShipment = (o: TrackableOrder) =>
  ["SUCCESS", "LABEL_CREATED", "FAILED"].includes(upper(o.shipment_status));

const isCancelled = (o: TrackableOrder) =>
  upper(o.status) === "CANCELLED" || upper(o.shipment_status) === "CANCELLED";

/** Index into STAGES, or -1 when the order was cancelled or its last payment failed. */
export function orderStage(o: TrackableOrder): number {
  const status = upper(o.status);
  const payment = upper(o.payment_status);
  const shipment = upper(o.shipment_status);
  if (isCancelled(o)) return -1;
  if (status === "DELIVERED" || shipment === "DELIVERED") return 3;
  // A tracking number proves nothing: every paid order gets one before it
  // leaves. The carrier having the package does.
  if (status === "SHIPPED" || ["IN_TRANSIT", "OUT_FOR_DELIVERY", "EXCEPTION", "RETURNED"].includes(shipment)) {
    return 2;
  }
  if (status === "CONFIRMED" || payment === "SUCCESS") return 1;
  if (status === "FAILED" || payment === "REJECTED") return -1;
  return 0;
}

const AFTER_SHIPPING: Record<string, StatusText> = {
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "progress" },
  EXCEPTION: { label: "Delivery problem", tone: "danger" },
  RETURNED: { label: "Returned", tone: "danger" },
};

/** The order's status in one phrase, for order cards and the tracking list. */
export function orderStatus(o: TrackableOrder): StatusText {
  const stage = orderStage(o);
  if (stage < 0) return { label: isCancelled(o) ? "Cancelled" : "Payment failed", tone: "danger" };
  if (stage === 3) return { label: "Delivered", tone: "success" };
  if (stage === 2) return AFTER_SHIPPING[upper(o.shipment_status)] ?? { label: "Shipped", tone: "progress" };
  if (stage === 1) {
    return isPreparingShipment(o) ? { label: PREPARING, tone: "progress" } : { label: "Confirmed", tone: "success" };
  }
  return { label: "Awaiting payment", tone: "waiting" };
}

export const orderStageLabel = (o: TrackableOrder) => orderStatus(o).label;

const PAYMENT_STATUSES: Record<string, StatusText> = {
  SUCCESS: { label: "Paid", tone: "success" },
  PENDING: { label: "Awaiting payment", tone: "waiting" },
  REJECTED: { label: "Payment failed", tone: "danger" },
};

/** An order's payment_status in the shopper's words. */
export const paymentStatus = (status?: string): StatusText =>
  PAYMENT_STATUSES[upper(status) || "PENDING"] ?? { label: humanize(upper(status)), tone: "waiting" };

const SHIPMENT_STATUSES: Record<string, StatusText> = {
  PENDING: { label: "Not shipped yet", tone: "waiting" },
  LABEL_CREATED: { label: PREPARING, tone: "progress" },
  SUCCESS: { label: PREPARING, tone: "progress" },
  // The label couldn't be bought: the team's problem, not the shopper's.
  FAILED: { label: PREPARING, tone: "progress" },
  IN_TRANSIT: { label: "In transit", tone: "progress" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "progress" },
  DELIVERED: { label: "Delivered", tone: "success" },
  EXCEPTION: { label: "Delivery problem", tone: "danger" },
  RETURNED: { label: "Returned", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

/** An order's shipment_status in the shopper's words. */
export const shipmentStatus = (status?: string): StatusText =>
  SHIPMENT_STATUSES[upper(status) || "PENDING"] ?? { label: humanize(upper(status)), tone: "progress" };

export const formatOrderDate = (raw?: string) =>
  raw
    ? new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

/** Progress steps plus carrier / tracking number / "Track package" link. */
export default function ShipmentTracking({ order }: { order: TrackableOrder }) {
  const stage = orderStage(order);
  const [copied, setCopied] = useState(false);
  // Turns the "copied" tick off again: one timer at a time, cancelled when
  // this component goes away.
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  if (stage < 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
        <XCircle className="h-4 w-4 shrink-0" />
        {isCancelled(order) ? "This order was cancelled." : "The payment for this order didn't go through."}
      </div>
    );
  }

  const copyTracking = async () => {
    if (!order.tracking_number) return;
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      // The component may have gone away while the clipboard was written.
      if (unmountedRef.current) return;
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        copyTimerRef.current = null;
        setCopied(false);
      }, 1500);
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

      {stage === 1 && order.tracking_number && isPreparingShipment(order) && (
        <p className="text-sm text-muted-foreground">{PREPARING}.</p>
      )}

      {order.tracking_number ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="text-xs text-muted-foreground">
              {order.carrier ? `${order.carrier.toUpperCase()} tracking number` : "Tracking number"}
              {stage >= 2 && order.shipped_at ? ` · shipped ${formatOrderDate(order.shipped_at)}` : ""}
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
            : isPreparingShipment(order)
              ? `${PREPARING}. Tracking details will appear here shortly.`
              : "You'll get a tracking number here as soon as your order ships."}
        </p>
      )}
    </div>
  );
}
