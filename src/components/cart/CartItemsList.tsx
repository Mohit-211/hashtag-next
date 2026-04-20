import CartItem from "./CartItem";

export type CartItemType = {
  id?: string | number;
  cart_id?: string | number;
  name: string;
  image?: string;
  basePrice: number;
  price: number;
  quantity: number;
  customization?: any;
};

interface Props {
  items: CartItemType[];
  onRefresh: () => void;
}

export default function CartItemsList({ items, onRefresh }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="lg:col-span-2 text-center py-10">
        No items in cart
      </div>
    );
  }

  const normalizedItems = items.map((item, index) => {
    const cartId = item.cart_id ?? item.id ?? index;
console.log(item,"=====>>>>>>>")
    return {
      id: String(cartId),
      name: item.name,
      image: item.image || "/placeholder.png",
      basePrice: item.basePrice,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || {
        placements: [],
        uploadFee: 0,
      },
    };
  });

  return (
    <div className="lg:col-span-2 space-y-4">
      {normalizedItems.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}