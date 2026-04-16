import CartItem from "./CartItem";

type Placement = {
  id: string;
  label: string;
  cost: number;
};

type Customization = {
  placements?: Placement[];
  uploadedImage?: string;
  uploadedFileName?: string;
  uploadFee?: number;
};

export type CartItemType = {
  id: string | number;
  name: string;
  image?: string;
  basePrice: number;
  quantity: number;
  customization?: Customization;
};

interface Props {
  items: CartItemType[];
}

export default function CartItemsList({ items }: Props) {
  // ✅ Safety check
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10 text-muted-foreground">
        No items in cart
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-4">
      {items.map((item, index) => (
        <CartItem
          key={item.id ?? index}
          item={{
            ...item,
            image: item.image || "/placeholder.png",
            customization: item.customization || {
              placements: [],
              uploadFee: 0,
            },
          }}
        />
      ))}
    </div>
  );
}