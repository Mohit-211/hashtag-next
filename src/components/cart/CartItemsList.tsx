import CartItem from "./CartItem";

type Placement = {
  id: string;
  label: string;
  cost: number;
};

type Customization = {
  placements: Placement[];
  uploadedImage?: string;
  uploadedFileName?: string;
  uploadFee?: number;
};

export type CartItemType = {
  id: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  customization: Customization;
};

interface Props {
  items: CartItemType[];
}

export default function CartItemsList({ items }: Props) {
  return (
    <div className="lg:col-span-2 space-y-4">
      {items.map((item) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}
