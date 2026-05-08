"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        // Must use the SAME key logic as inside OrderCard
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