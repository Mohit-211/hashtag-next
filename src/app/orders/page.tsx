"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import OrdersEmpty from "@/components/orders/OrdersEmpty";
import OrdersList from "@/components/orders/OrdersList";

import { GetAllOrderApi } from "@/api/operations/order.api";

import { OrderData } from "@/components/orders/OrderCard";

import { Button } from "@/components/ui/button";

export default function Orders() {
  const [orders, setOrders] = useState<
    OrderData[]
  >([]);

  const [loading, setLoading] = useState(true);

  // ✅ TOKEN CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  useEffect(() => {
    // 🚫 No login
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

      // adjust according to your API response
      const orderData =
        response?.data?.data?.data || [];

      setOrders(orderData);
    } catch (error) {
      console.error(
        "Failed to fetch orders:",
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN REQUIRED UI
  if (!isLoggedIn) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-bold">
              Please Login
            </h2>

            <p className="text-muted-foreground mt-2 max-w-md">
              You need to login to view your
              orders and track your purchases.
            </p>

            <Link href="/login" className="mt-6">
              <Button className="cursor-pointer">
                Login to Continue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Loading
  if (loading) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">
              Loading orders...
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Empty Orders
  if (orders.length === 0) {
    return <OrdersEmpty />;
  }

  return (
    <section className="py-8 lg:py-14">
      <div className="container max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold">
            Your Orders
          </h1>

          <p className="text-muted-foreground mt-2">
            Review your past purchases and
            track deliveries.
          </p>
        </div>

        <OrdersList orders={orders} />
      </div>
    </section>
  );
}