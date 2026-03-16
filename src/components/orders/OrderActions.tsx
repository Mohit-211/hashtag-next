// components/orders/OrderActions.tsx

"use client";

import Link from "next/link";
import { RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Order } from "@/contexts/OrdersContext";

interface OrderActionsProps {
  order: Order;
}

export default function OrderActions({ order }: OrderActionsProps) {
  const { addItem } = useCart();

  const reorder = () => {
    order.items.forEach((item) => {
      addItem({
        ...item,
        id: `reorder-${item.id}-${Date.now()}`,
      });
    });

    toast.success(`Items from order #${order.orderId} added to cart`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Link href="/track-order">
        <Button variant="hero" size="sm" className="gap-1.5">
          <Package className="h-4 w-4" />
          Track Order
        </Button>
      </Link>

      <Button variant="outline" size="sm" onClick={reorder} className="gap-1.5">
        <RotateCcw className="h-4 w-4" />
        Reorder
      </Button>
    </div>
  );
}
