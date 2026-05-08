// components/orders/OrderPriceSummary.tsx

interface Order {
  subtotal?: number | string;
  customizationTotal?: number | string;
  shippingCost?: number | string;
  tax?: number | string;
  total?: number | string;
  [key: string]: any;
}

interface OrderPriceSummaryProps {
  order: Order;
}

export default function OrderPriceSummary({
  order,
}: OrderPriceSummaryProps) {
  const subtotal = Number(order?.subtotal || 0);
  const customizationTotal = Number(
    order?.customizationTotal || 0
  );
  const shippingCost = Number(order?.shippingCost || 0);
  const tax = Number(order?.tax || 0);
  const total = Number(order?.total || 0);

  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {customizationTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span>Customization</span>
          <span>
            ${customizationTotal.toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span>Shipping</span>

        <span>
          {shippingCost === 0
            ? "Free"
            : `$${shippingCost.toFixed(2)}`}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span>Tax</span>
        <span>${tax.toFixed(2)}</span>
      </div>

      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}