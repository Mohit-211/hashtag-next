// components/trackorder/OrderStatusCard.tsx

import { Package } from "lucide-react";
import { type Order } from "@/contexts/OrdersContext";

interface OrderStatusCardProps {
  order: Order;
}

export default function OrderStatusCard({ order }: OrderStatusCardProps) {
  const orderDate = new Date(order.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
        Order Status
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-heading font-bold">#{order.orderId}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Order Date</p>
          <p className="font-medium">{orderDate}</p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">Current Status</p>

          <span className="inline-flex items-center gap-2 bg-primary/15 px-3 py-1.5 rounded-lg font-semibold">
            <Package className="h-4 w-4" />
            {order.status}
          </span>
        </div>
      </div>
    </div>
  );
}
