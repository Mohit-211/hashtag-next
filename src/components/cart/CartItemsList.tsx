import CartItem from "./CartItem";

const CartItemsList = ({ items }: any) => {
  return (
    <div className="lg:col-span-2 space-y-4">
      {items.map((item: any) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
};

export default CartItemsList;
