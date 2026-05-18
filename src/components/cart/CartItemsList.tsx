// components/cart/CartItemsList.tsx

import CartItem from "./CartItem";

export type CartItemType = {
  id: string;
  cart_id?: string;

  name: string;
  image?: string;

  basePrice: number;
  quantity: number;

  customization?: {
    placements: any[];
    uploadFee: number;
  };
};

interface Props {
  items: CartItemType[];
  onRefresh: () => void;
}

export default function CartItemsList({
  items,
  onRefresh,
}: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10">
        No items in cart
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-4">
      {items.map((item) => (
        <CartItem
          key={item.cart_id || item.id}
          item={{
            id: item.id,
            cart_id: item.cart_id || item.id,

            name: item.name,
            image: item.image || "/placeholder.png",

            basePrice: item.basePrice,
            quantity: item.quantity,

            customization: item.customization || {
              placements: [],
              uploadFee: 0,
            },
          }}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}