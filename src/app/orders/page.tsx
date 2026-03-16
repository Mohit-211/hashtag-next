"use client";

import { useOrders } from "@/contexts/OrdersContext";

import OrdersEmpty from "@/components/orders/OrdersEmpty";
import OrdersList from "@/components/orders/OrdersList";

export default function Orders() {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return <OrdersEmpty />;
  }

  return (
    <section className="py-8 lg:py-14">
      <div className="container max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold">Your Orders</h1>

          <p className="text-muted-foreground mt-2">
            Review your past purchases and track deliveries.
          </p>
        </div>

        <OrdersList orders={orders} />
      </div>
    </section>
  );
}
