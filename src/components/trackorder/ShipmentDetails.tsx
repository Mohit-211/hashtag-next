// components/trackorder/ShipmentDetails.tsx

import { type Order } from "@/contexts/OrdersContext";

interface ShipmentDetailsProps {
  order: Order;
}

export default function ShipmentDetails({ order }: ShipmentDetailsProps) {
  return (
    <div className="bg-card border rounded-xl p-6">
      <p className="text-xs uppercase text-muted-foreground mb-4">
        Shipment Details
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Courier</p>
          <p className="text-sm font-medium">BlueDart Express</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Tracking Number</p>
          <p className="text-sm font-mono">BD{order.orderId.slice(-8)}IN</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Estimated Delivery</p>
          <p className="text-sm font-medium">
            {order.shippingMethod === "express" ? "2–3 days" : "5–7 days"}
          </p>
        </div>
      </div>
    </div>
  );
}
