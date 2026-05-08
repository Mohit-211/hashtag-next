// components/orders/OrderItems.tsx

import OrderItemRow from "./OrderItemRow";

interface CartItem {
  id: string | number;
  [key: string]: any;
}

interface OrderItemsProps {
  items?: CartItem[];
}

export default function OrderItems({
  items = [],
}: OrderItemsProps) {
  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <OrderItemRow
          key={item?.id || index}
          item={item}
        />
      ))}
    </div>
  );
}