import { CheckCircle, Circle } from "lucide-react";
import { type OrderStatus } from "@/contexts/OrdersContext";

const STAGES = [
  "Order Placed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const getIndex = (status: OrderStatus) => {
  const map = {
    Processing: 1,
    Shipped: 2,
    "Out for Delivery": 3,
    Delivered: 4,
    Cancelled: -1,
  };

  return map[status] ?? 0;
};

const OrderProgress = ({ status }: { status: OrderStatus }) => {
  const current = getIndex(status);

  return (
    <div className="bg-card border rounded-xl p-6">
      <p className="text-xs uppercase text-muted-foreground mb-6">
        Order Progress
      </p>

      <div className="flex justify-between">
        {STAGES.map((stage, i) => {
          const done = i <= current;

          return (
            <div key={stage} className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  done ? "bg-primary text-white" : "bg-secondary"
                }`}
              >
                {done ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>

              <p className="text-xs mt-2">{stage}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderProgress;
