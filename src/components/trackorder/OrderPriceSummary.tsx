// components/trackorder/OrderPriceSummary.tsx

import { type Order } from "@/contexts/OrdersContext";

interface OrderPriceSummaryProps {
  order: Order;
}

export default function OrderPriceSummary({ order }: OrderPriceSummaryProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-2">
      <p className="text-xs font-bold uppercase text-muted-foreground mb-3">
        Price Summary
      </p>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span>${order.subtotal}</span>
      </div>

      {order.customizationTotal > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Customization</span>
          <span>+${order.customizationTotal}</span>
        </div>
      )}

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Shipping</span>
        <span>
          {order.shippingCost === 0 ? "Free" : `$${order.shippingCost}`}
        </span>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Tax</span>
        <span>${order.tax}</span>
      </div>

      <div className="border-t pt-3 flex justify-between font-bold">
        <span>Total</span>
        <span className="text-primary">${order.total}</span>
      </div>
    </div>
  );
}
