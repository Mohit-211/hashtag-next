import OrderedItemCard from "./OrderedItemCard";
import type { CartItem } from "@/contexts/CartContext";

interface Props {
  items: CartItem[];
}

export default function OrderedItems({ items }: Props) {
  if (!items.length) return null;

  return (
    <div className="mb-8">
      <p className="text-xs font-bold uppercase text-muted-foreground mb-4">
        Items Ordered
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <OrderedItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
