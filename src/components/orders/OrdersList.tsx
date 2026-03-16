import { useState } from "react";
import OrderCard from "./OrderCard";

const OrdersList = ({ orders }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          expanded={expandedId === order.orderId}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
};

export default OrdersList;
