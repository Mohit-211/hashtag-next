// components/orders/OrderItemRow.tsx

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProxyImage from "../Proxyimage";

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

export default function OrderItemRow({ item }: OrderItemRowProps) {
  const placements = item?.customization?.placements || [];

  const placementCost = placements.reduce(
    (sum, placement) => sum + Number(placement?.cost || 0),
    0
  );

  const uploadCost = item?.customization?.uploadedImage
    ? Number(item?.customization?.uploadFee || 0)
    : 0;

  const basePrice = Number(item?.basePrice || 0);
  const quantity = Number(item?.quantity || 1);
  const itemTotal = (basePrice + placementCost + uploadCost) * quantity;
console.log(item,"item")
  const inner = (
    <div className="group flex gap-3 items-start rounded-xl p-3 transition-all duration-200 hover:bg-muted/60 hover:shadow-sm border border-transparent hover:border-border">
      {/* Product image */}
      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
        <ProxyImage
          src={item?.image }
          alt={item?.name || "Product"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {item?.name || "Unnamed Product"}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <p className="text-sm font-bold text-foreground">${itemTotal.toFixed(2)}</p>
            {item?.id && (
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">
            ${basePrice.toFixed(2)} × {quantity}
          </span>
          {placements.length > 0 && (
            <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
              {placements.length} customization{placements.length > 1 ? "s" : ""}
            </span>
          )}
          {item?.customization?.uploadedImage && (
            <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
              Custom image
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!item?.id) return inner;

  return (
    <Link href={`/product/${item.id}`} className="block">
      {inner}
    </Link>
  );
}
