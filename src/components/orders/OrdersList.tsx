"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import OrderCard, { OrderData } from "@/components/orders/OrderCard";

interface OrdersListProps {
  orders: OrderData[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <ShoppingBag className="h-6 w-6 opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No orders yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your orders will appear here once placed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const cardKey = String(order?.orderId || order?.id);

        return (
          <OrderCard
            key={cardKey}
            order={order}
            expanded={expandedOrders[cardKey] ?? false}
            toggleExpand={toggleExpand}
          />
        );
      })}
    </div>
  );
}
