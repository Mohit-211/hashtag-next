// app/orders/page.tsx

"use client";

import { useEffect, useState } from "react";

import OrdersEmpty from "@/components/orders/OrdersEmpty";
import OrdersList from "@/components/orders/OrdersList";

import { GetAllOrderApi } from "@/api/operations/order.api";
import { OrderData } from "@/components/orders/OrderCard";



export default function Orders() {
 const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await GetAllOrderApi();

      // adjust according to your API response structure
      const orderData =
        response?.data?.data?.data

      setOrders(orderData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </section>
    );
  }

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
            Review your past purchases and track deliveries.
          </p>
        </div>

        <OrdersList orders={orders} />
      </div>
    </section>
  );
}