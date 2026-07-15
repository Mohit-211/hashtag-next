// components/cart/CartItemsList.tsx
import CartItem from "./CartItem";

export type CustomizationLocation = {
  location: string;
};

export type CustomizationBreakdownItem = {
  variant_id: number;
  size?: string;
  color?: string;
  quantity: number;
  product_price: number;
  decoration_price?: number;
  total_price: number;
};

export type CartItemType = {
  id: string;
  cart_id: string;
  product_id?: number;
  variant_id?: number;

  name: string;
  image: string;
  logo_image?: string;

  size: string;
  color?: string;
  colorCode?: string | null;

  basePrice: number;
  totalPrice?: number;
  quantity: number;

  canIncrease?: boolean;
  canDecrease?: boolean;

  customization?: {
    printMethod: string | null;
    locations: CustomizationLocation[];
    breakdown: CustomizationBreakdownItem[];
    uploadedImage: string | null;
    uploadedImageName: string | null;
  };
};

interface Props {
  items: CartItemType[];
  onRefresh: () => void;
}

export default function CartItemsList({ items, onRefresh }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10 text-muted-foreground">
        No items in cart
      </div>
    );
  }

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Your Cart
        </h1>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {String(totalItems).padStart(2, "0")} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItem key={item.cart_id || item.id} item={item} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}