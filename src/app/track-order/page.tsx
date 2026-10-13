"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, MapPin, Package, Search } from "lucide-react";

import { GetAllOrderApi, GetOrderDetailApi } from "@/api/operations/order.api";
import type { OrderData, OrderDetail } from "@/components/orders/OrderCard";
import ShipmentTracking, { formatOrderDate, orderStageLabel } from "@/components/orders/ShipmentTracking";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { loginUrl } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

const orderKey = (o: OrderData) => String(o.id);
const orderLabel = (o: OrderData) => o.order_number || o.orderId || `#${o.id}`;
const orderTime = (o: OrderData) => new Date(o.created_at || o.date || 0).getTime();

export default function TrackOrder() {
  const isClient = useIsClient();
  const isLoggedIn = useIsLoggedIn();

  // null until the list arrives.
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, OrderDetail | "error">>({});

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    GetAllOrderApi()
      .then((res) => {
        if (cancelled) return;
        const list: OrderData[] = res?.data?.data?.data || res?.data?.data || [];
        setOrders([...list].sort((a, b) => orderTime(b) - orderTime(a)));
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const visibleOrders = useMemo(() => {
    const q = query.trim().replace(/^#/, "").toLowerCase();
    if (!orders) return [];
    return q ? orders.filter((o) => orderLabel(o).toLowerCase().includes(q)) : orders;
  }, [orders, query]);

  // Newest order is shown until the shopper picks another.
  const selected =
    visibleOrders.find((o) => orderKey(o) === selectedKey) ?? visibleOrders[0] ?? null;
  const selectedId = selected?.id;
  const detail = selected ? details[orderKey(selected)] : undefined;

  useEffect(() => {
    if (selectedId == null || details[String(selectedId)]) return;
    let cancelled = false;
    GetOrderDetailApi(selectedId)
      .then((res) => {
        if (!cancelled) setDetails((prev) => ({ ...prev, [String(selectedId)]: res?.data?.data ?? "error" }));
      })
      .catch(() => {
        if (!cancelled) setDetails((prev) => ({ ...prev, [String(selectedId)]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, details]);

  const loading = !isClient || (isLoggedIn && orders === null);

  return (
    <section className="container max-w-5xl py-10 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Track your order</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          See where each order is and follow your package with the carrier.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : !isLoggedIn ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold">Log in to track your orders</h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Order tracking is linked to your account. Log in with the email you ordered with.
            </p>
          </div>
          <Button asChild variant="hero">
            <Link href={loginUrl("/track-order")}>
              Log in <ArrowRight />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Ordered without an account?{" "}
            <Link href="/contact-us" className="font-medium text-foreground underline underline-offset-4">
              Contact us
            </Link>{" "}
            with your order number.
          </p>
        </div>
      ) : orders && orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Once you place an order, you can follow it here from payment to delivery.
            </p>
          </div>
          <Button asChild variant="hero">
            <Link href="/categories?view=all">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Order list */}
          <div className="space-y-3">
            <label className="relative block">
              <span className="sr-only">Find an order by number</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Order number"
                className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>
            {visibleOrders.length === 0 ? (
              <p className="px-1 py-4 text-sm text-muted-foreground">No order matches “{query}”.</p>
            ) : (
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {visibleOrders.map((o) => {
                  const active = selected && orderKey(o) === orderKey(selected);
                  return (
                    <li key={orderKey(o)}>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(orderKey(o))}
                        aria-pressed={!!active}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition",
                          active ? "border-foreground bg-card shadow-sm" : "border-border bg-card hover:border-input"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-sm font-semibold">{orderLabel(o)}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatOrderDate(o.created_at || o.date)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{orderStageLabel(o)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Selected order */}
          {selected && (
            <article className="space-y-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order</p>
                  <h2 className="font-mono text-xl font-bold">{orderLabel(selected)}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Placed {formatOrderDate(selected.created_at || selected.date)}
                    {selected.total_amount != null && ` · $${Number(selected.total_amount).toFixed(2)}`}
                  </p>
                </div>
                <Link href="/orders" className="text-sm font-medium underline underline-offset-4 hover:text-primary-ink">
                  View full order
                </Link>
              </div>

              {detail === undefined ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading tracking details…
                </div>
              ) : (
                <ShipmentTracking order={detail === "error" ? selected : { ...selected, ...detail }} />
              )}

              {detail && detail !== "error" && detail.address && (
                <div className="flex gap-3 border-t border-border pt-5 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{detail.address.name}</p>
                    <p className="text-muted-foreground">
                      {detail.address.address_line1}, {detail.address.city}, {detail.address.state}{" "}
                      {detail.address.postal_code}
                    </p>
                  </div>
                </div>
              )}

              <p className="border-t border-border pt-5 text-sm text-muted-foreground">
                Questions about a delivery?{" "}
                <Link href="/contact-us" className="font-medium text-foreground underline underline-offset-4">
                  Contact us
                </Link>
                .
              </p>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
