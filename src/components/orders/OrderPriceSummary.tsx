const OrderPriceSummary = ({ order }) => {
  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
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

      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>${order.total}</span>
      </div>
    </div>
  );
};

export default OrderPriceSummary;
