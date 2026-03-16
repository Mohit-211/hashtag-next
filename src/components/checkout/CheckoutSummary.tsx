import { Button } from "@/components/ui/button";

const CheckoutSummary = ({
  items,
  subtotal,
  customizationTotal,
  grandTotal,
  clearCart,
  addOrder,
  navigate,
}) => {
  const shipping = grandTotal >= 999 ? 0 : 99;
  const tax = Math.round(grandTotal * 0.05);
  const total = grandTotal + shipping + tax;

  const placeOrder = () => {
    const orderId = `HB${Date.now()}`;

    const orderData = {
      orderId,
      items,
      subtotal,
      customizationTotal,
      shipping,
      tax,
      total,
      date: new Date().toISOString(),
    };

    addOrder(orderData);
    clearCart();

    navigate("/confirmation", { state: orderData });
  };

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-card border rounded-xl p-6 space-y-5">
        <h2 className="font-heading font-bold text-lg">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal}</span>
          </div>

          {customizationTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Customization</span>
              <span>${customizationTotal}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax}</span>
          </div>
        </div>

        <div className="border-t pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary text-xl">${total}</span>
        </div>

        <Button className="w-full" onClick={placeOrder}>
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default CheckoutSummary;
