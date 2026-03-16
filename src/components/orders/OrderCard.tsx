// components/orders/OrderCard.tsx

"use client";

import { Package, ChevronDown, ChevronUp } from "lucide-react";

import OrderItems from "./OrderItems";
import OrderPriceSummary from "./OrderPriceSummary";
import OrderActions from "./OrderActions";
import type { Order } from "@/contexts/OrdersContext";

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  toggleExpand: (orderId: string) => void;
}

const statusStyles: Record<string, string> = {
  Processing: "bg-secondary text-muted-foreground",
  Shipped: "bg-secondary text-foreground",
  "Out for Delivery": "bg-primary/20 text-primary-foreground",
  Delivered: "bg-primary/10 text-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export default function OrderCard({
  order,
  expanded,
  toggleExpand,
}: OrderCardProps) {
  const orderDate = new Date(order.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <button
        onClick={() => toggleExpand(order.orderId)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
          <Package className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">#{order.orderId}</p>

            <span
              className={`text-[10px] px-2 py-0.5 rounded ${
                statusStyles[order.status]
              }`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{orderDate}</p>
        </div>

        <span className="font-bold">${order.total}</span>

        {expanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>

      {expanded && (
        <div className="border-t p-5 space-y-5">
          <OrderItems items={order.items} />
          <OrderPriceSummary order={order} />
          <OrderActions order={order} />
        </div>
      )}
    </div>
  );
}
