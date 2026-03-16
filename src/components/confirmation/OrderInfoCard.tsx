import { Package } from "lucide-react";

const paymentLabels: Record<string, string> = {
  card: "Credit / Debit Card",
  upi: "UPI",
  cod: "Cash on Delivery",
};

const OrderInfoCard = ({ orderId, orderDate, paymentMethod }) => {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3 mb-8">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Order Details
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Order ID</span>
          <p className="font-bold">#{orderId}</p>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Order Date</span>
          <p>{orderDate}</p>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Payment Method</span>
          <p>{paymentLabels[paymentMethod]}</p>
        </div>

        <div className="text-sm flex items-center gap-1">
          <Package className="h-4 w-4" />
          Processing
        </div>
      </div>
    </div>
  );
};

export default OrderInfoCard;
