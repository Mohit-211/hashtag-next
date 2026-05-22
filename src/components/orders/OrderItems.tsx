// components/orders/OrderItems.tsx

import { ShoppingBag } from "lucide-react";
import OrderItemRow from "./OrderItemRow";

interface CartItem {
  id: string | number;
  [key: string]: any;
}

interface OrderItemsProps {
  items?: CartItem[];
}

export default function OrderItems({ items = [] }: OrderItemsProps) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
        <ShoppingBag className="h-8 w-8 opacity-30" />
        <p className="text-sm">No items found in this order</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
        Items ({items.length})
      </p>
      <div className="space-y-1">
        {items.map((item, index) => (
          <OrderItemRow
            key={item?.id || index}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
