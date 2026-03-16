// components/orders/OrderItems.tsx

import OrderItemRow from "./OrderItemRow";
import type { CartItem } from "@/contexts/CartContext";

interface OrderItemsProps {
  items: CartItem[];
}

export default function OrderItems({ items }: OrderItemsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <OrderItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
