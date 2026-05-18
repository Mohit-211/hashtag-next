// components/orders/OrderActions.tsx

"use client";

import Link from "next/link";
import { RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

interface CartItem {
  id: string | number;
  [key: string]: any;
}

interface Order {
  orderId: string;
  items?: CartItem[];
  [key: string]: any;
}

interface OrderActionsProps {
  order: Order;
}

export default function OrderActions({
  order,
}: OrderActionsProps) {
  const { addItem } = useCart();

  const reorder = () => {
    if (!order?.items?.length) {
      toast.error("No items available to reorder");
      return;
    }

   order?.items?.forEach((item: any, index: number) => {
  addItem({
    ...item,
    id: `reorder-${item?.id || index}-${Date.now()}`,
  });
});

    toast.success(
      `Items from order #${order.orderId} added to cart`
    );
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
     

      <Button
        variant="outline"
        size="sm"
        onClick={reorder}
        className="gap-1.5"
      >
        <RotateCcw className="h-4 w-4" />
        Reorder
      </Button>
    </div>
  );
}