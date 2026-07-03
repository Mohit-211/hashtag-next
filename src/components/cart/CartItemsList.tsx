// components/cart/CartItemsList.tsx
import CartItem from "./CartItem";

export type CartItemType = {
  size: string;
  logo_image: string;
  id: string;
  cart_id?: string;
  name: string;
  image: string;
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

export default function CartItemsList({ items, onRefresh }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10 text-muted-foreground">
        No items in cart
      </div>
    );
  }

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  console.log(items, "itemsitemsitemsitemsitems in 2")
  return (
    <div className="lg:col-span-2 space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Your Cart{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </h1>

      <div className="space-y-3">
        {items.map((item) => (
          <CartItem
            key={item.cart_id || item.id}
            item={{
              id: item.id,
              cart_id: item.cart_id || item.id,
              name: item.name,
              image: item.image || "/placeholder.png",
              logo_image: item.logo_image || "/placeholder.png",
              basePrice: item.basePrice,
              size: item.size || "",
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
    </div>
  );
}