interface Order {
  subtotal: number;
  customizationTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

interface Props {
  order: Order;
}

export default function PriceSummary({ order }: Props) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-2 mb-8">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Price Summary
      </p>

      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${order.subtotal}</span>
      </div>

      {order.customizationTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span>Customization</span>
          <span>${order.customizationTotal}</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        <span>
          {order.shippingCost === 0 ? "Free" : `$${order.shippingCost}`}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span>Tax</span>
        <span>${order.tax}</span>
      </div>

      <div className="border-t pt-3 flex justify-between font-bold">
        <span>Total Paid</span>
        <span className="text-primary text-xl">${order.total}</span>
      </div>
    </div>
  );
}
