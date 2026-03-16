import OrderItemRow from "./OrderItemRow";

const OrderItems = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <OrderItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};

export default OrderItems;
