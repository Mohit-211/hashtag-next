// components/trackorder/OrderedItems.tsx

import Image from "next/image";
import { type CartItem } from "@/contexts/CartContext";

interface OrderedItemsProps {
  items: CartItem[];
}

export default function OrderedItems({ items }: OrderedItemsProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-muted-foreground mb-4">
        Items in This Order
      </p>

      <div className="space-y-3">
        {items.map((item) => {
          const placementCost = item.customization.placements.reduce(
            (s, p) => s + p.cost,
            0
          );

          const uploadCost = item.customization.uploadedImage
            ? item.customization.uploadFee
            : 0;

          const itemTotal =
            (item.basePrice + placementCost + uploadCost) * item.quantity;

          return (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl p-4 flex gap-4"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />

              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{item.name}</h3>

                  <p className="font-bold">${itemTotal}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  ${item.basePrice} × {item.quantity}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
