"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { AlertCircle, ArrowRight, MapPin, Package, RefreshCw } from "lucide-react";

import { GetAllOrderApi, GetOrderDetailApi } from "@/api/operations/order.api";
import type { OrderData, OrderDetail } from "@/components/orders/OrderCard";
import OrderPriceSummary from "@/components/orders/OrderPriceSummary";
import { formatOrderDate } from "@/components/orders/ShipmentTracking";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { loginUrl } from "@/lib/authRedirect";
import { confirmationPath } from "@/lib/orderLinks";

import ConfirmationActions from "./ConfirmationActions";
import ConfirmationHeader, { type ConfirmationState } from "./ConfirmationHeader";
import ConfirmationItems from "./ConfirmationItems";
import NextSteps from "./NextSteps";
import OrderInfoCard from "./OrderInfoCard";

type LoadState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | { kind: "loaded"; detail: OrderDetail; summary: OrderData | null };

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function confirmationState(detail: OrderDetail): ConfirmationState {
  const payment = (detail.payment_status ?? "").toUpperCase();
  if ((detail.status ?? "").toUpperCase() === "CANCELLED" || payment === "REFUNDED") return "cancelled";
  if (payment === "SUCCESS" || payment === "PAID") return "paid";
  if (payment === "FAILED") return "failed";
  return "pending";
}

const PAYMENT_LABELS: Record<ConfirmationState, string> = {
  paid: "Paid",
  pending: "Awaiting confirmation",
  failed: "Not completed",
  cancelled: "Cancelled",
};

const CARRIER_NAMES: Record<string, string> = { ups: "UPS", usps: "USPS", stamps_com: "USPS", fedex: "FedEx" };

/** "stamps_com" + "usps_priority_mail" → "USPS Priority Mail". */
function shippingMethod(detail: OrderDetail): string | null {
  const carrierCode = (detail.carrier ?? "").toLowerCase();
  if (!carrierCode) return null;
  const carrier = CARRIER_NAMES[carrierCode] ?? carrierCode.replace(/_/g, " ").toUpperCase();
  const service = (detail.service_code ?? "")
    .toLowerCase()
    .replace(/^(stamps_com|usps|ups|fedex)_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  return service ? `${carrier} ${service}` : carrier;
}

export function ConfirmationSkeleton() {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-3xl space-y-6">
        <div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-muted" />
        <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </section>
  );
}

function Notice({ icon, title, body, children }: { icon: ReactNode; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-3xl">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">{icon}</div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function ShippingAddress({ address }: { address: NonNullable<OrderDetail["address"]> }) {
  const cityLine = [address.city, [address.state, address.postal_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Shipping To
      </p>
      <address className="text-sm not-italic leading-relaxed">
        <span className="font-medium">{address.name}</span>
        <br />
        {address.address_line1}
        <br />
        {cityLine}
        {address.phone && (
          <>
            <br />
            <span className="text-muted-foreground">{address.phone}</span>
          </>
        )}
      </address>
    </div>
  );
}

/** /confirmation?order=<id>: the order just paid for, as the API has it. */
export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const isLoggedIn = useIsLoggedIn();
  const rawId = searchParams.get("order") ?? "";
  const orderId = /^\d+$/.test(rawId) ? rawId : null;

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !orderId) return;
    let cancelled = false;
    Promise.allSettled([
      GetOrderDetailApi(orderId, { skipErrorToast: true }),
      // The order date and tax only come with the order list.
      GetAllOrderApi({ skipErrorToast: true }),
    ]).then(([detailRes, listRes]) => {
      if (cancelled) return;
      if (detailRes.status === "rejected") {
        const status = isAxiosError(detailRes.reason) ? detailRes.reason.response?.status : undefined;
        setLoad({ kind: status === 404 ? "not-found" : "error" });
        return;
      }
      const detail: OrderDetail | undefined = detailRes.value?.data?.data;
      if (!detail?.id) {
        setLoad({ kind: "error" });
        return;
      }
      const raw = listRes.status === "fulfilled" ? listRes.value?.data?.data?.data ?? listRes.value?.data?.data : null;
      const list: OrderData[] = Array.isArray(raw) ? raw : [];
      setLoad({
        kind: "loaded",
        detail,
        summary: list.find((o) => String(o.id) === String(detail.id)) ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, orderId, attempt]);

  const reload = () => {
    setLoad({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  if (!isClient) return <ConfirmationSkeleton />;

  if (!orderId) {
    return (
      <Notice
        icon={<Package className="h-6 w-6 text-muted-foreground" />}
        title="No order to show"
        body="This page opens after checkout. All your orders are under My Orders."
      >
        <Button asChild variant="hero">
          <Link href="/orders">
            View My Orders <ArrowRight />
          </Link>
        </Button>
      </Notice>
    );
  }

  if (!isLoggedIn) {
    return (
      <Notice
        icon={<Package className="h-6 w-6 text-muted-foreground" />}
        title="Log in to see your order"
        body="Order details are linked to your account."
      >
        <Button asChild variant="hero">
          <Link href={loginUrl(confirmationPath(orderId))}>
            Log in <ArrowRight />
          </Link>
        </Button>
      </Notice>
    );
  }

  if (load.kind === "loading") return <ConfirmationSkeleton />;

  if (load.kind === "not-found") {
    return (
      <Notice
        icon={<AlertCircle className="h-6 w-6 text-muted-foreground" />}
        title="We couldn't find this order"
        body="It may belong to another account. Your own orders are under My Orders."
      >
        <Button asChild variant="hero">
          <Link href="/orders">
            View My Orders <ArrowRight />
          </Link>
        </Button>
      </Notice>
    );
  }

  if (load.kind === "error") {
    return (
      <Notice
        icon={<AlertCircle className="h-6 w-6 text-muted-foreground" />}
        title="We couldn't load this order"
        body="Please check your connection and try again."
      >
        <Button variant="outline" onClick={reload}>
          <RefreshCw /> Try again
        </Button>
      </Notice>
    );
  }

  const { detail, summary } = load;
  const state = confirmationState(detail);
  const subtotal = toNumber(detail.subtotal_amount);
  const shipping = toNumber(detail.shipping_amount);
  const total = toNumber(detail.total_amount);
  // The API builds the total as subtotal + tax + shipping; the list carries the tax itself.
  const tax = summary ? toNumber(summary.tax_amount) : Math.max(0, +(total - subtotal - shipping).toFixed(2));
  const items = detail.items ?? [];

  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-3xl">
        <ConfirmationHeader state={state} />

        <OrderInfoCard
          orderNumber={detail.order_number || String(detail.id)}
          orderDate={formatOrderDate(summary?.created_at) || null}
          paymentLabel={PAYMENT_LABELS[state]}
          shippingMethod={shippingMethod(detail)}
        />

        {items.length > 0 && <ConfirmationItems items={items} />}

        <div className="grid gap-4 sm:grid-cols-2 items-start mb-8">
          {detail.address && <ShippingAddress address={detail.address} />}
          <OrderPriceSummary order={{ subtotal, shippingCost: shipping, tax, total }} />
        </div>

        <NextSteps state={state} />

        {state === "pending" && (
          <div className="mb-6 flex justify-center">
            <Button variant="outline" onClick={reload}>
              <RefreshCw /> Check again
            </Button>
          </div>
        )}

        <ConfirmationActions />
      </div>
    </section>
  );
}
