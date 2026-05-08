// components/orders/OrderItemRow.tsx

import Image from "next/image";

interface Placement {
  cost?: number;
  [key: string]: any;
}

interface Customization {
  placements?: Placement[];
  uploadedImage?: string;
  uploadFee?: number;
  [key: string]: any;
}

interface CartItem {
  id?: string | number;
  name?: string;
  image?: string;
  quantity?: number;
  basePrice?: number;
  customization?: Customization;
  [key: string]: any;
}

interface OrderItemRowProps {
  item: CartItem;
}

export default function OrderItemRow({
  item,
}: OrderItemRowProps) {
  const placements =
    item?.customization?.placements || [];

  const placementCost = placements.reduce(
    (sum, placement) =>
      sum + Number(placement?.cost || 0),
    0
  );

  const uploadCost = item?.customization?.uploadedImage
    ? Number(item?.customization?.uploadFee || 0)
    : 0;

  const basePrice = Number(item?.basePrice || 0);

  const quantity = Number(item?.quantity || 1);

  const itemTotal =
    (basePrice + placementCost + uploadCost) *
    quantity;

  return (
    <div className="flex gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <Image
          src={item?.image || "/placeholder.png"}
          alt={item?.name || "Product"}
          fill
          className="rounded-lg object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3">
          <h3 className="text-sm font-medium line-clamp-2">
            {item?.name || "Unnamed Product"}
          </h3>

          <p className="font-bold whitespace-nowrap">
            ${itemTotal.toFixed(2)}
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          ${basePrice.toFixed(2)} × {quantity}
        </p>

        {placements.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Customizations: {placements.length}
          </p>
        )}
      </div>
    </div>
  );
}