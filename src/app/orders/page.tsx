"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Package } from "lucide-react";

import OrdersEmpty from "@/components/orders/OrdersEmpty";
import OrdersList from "@/components/orders/OrdersList";
import { GetAllOrderApi } from "@/api/operations/order.api";
import { OrderData } from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────
// Skeleton loader for order cards
// ─────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="bg-card border border-border/70 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
      <div className="h-[52px] w-[52px] rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-muted rounded-full w-32" />
        <div className="h-2.5 bg-muted rounded-full w-20" />
        <div className="h-2.5 bg-muted rounded-full w-48" />
      </div>
      <div className="h-4 bg-muted rounded-full w-14 shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("hastagBillionaire");

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await GetAllOrderApi();
      const orderData = response?.data?.data?.data || [];
      setOrders(orderData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Not logged in ──
  if (!isLoggedIn) {
    return (
      <section className="py-8 lg:py-16">
        <div className="container max-w-3xl">
          <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">Sign in to view orders</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Log in to view your order history and track your purchases.
              </p>
            </div>
            <Link href="/login">
              <Button className="cursor-pointer gap-2 mt-1">
                Continue to Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <section className="py-8 lg:py-16">
        <div className="container max-w-3xl">
          {/* Skeleton header */}
          <div className="mb-8 space-y-2 animate-pulse">
            <div className="h-7 bg-muted rounded-full w-40" />
            <div className="h-4 bg-muted rounded-full w-72" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Empty ──
  if (orders.length === 0) {
    return <OrdersEmpty />;
  }

  // ── Orders list ──
  return (
    <section className="py-8 lg:py-16">
      <div className="container max-w-3xl">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Your Orders</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {orders.length} order{orders.length !== 1 ? "s" : ""} — review purchases and track deliveries.
            </p>
          </div>
          {/* Subtle icon accent */}
          <div className="hidden sm:flex h-10 w-10 rounded-xl bg-muted items-center justify-center shrink-0 mt-0.5">
            <Package className="h-4.5 w-4.5 text-muted-foreground/60" />
          </div>
        </div>

        <OrdersList orders={orders} />
      </div>
    </section>
  );
}