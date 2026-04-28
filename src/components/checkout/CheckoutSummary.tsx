"use client";

import { Button } from "@/components/ui/button";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { CartItem } from "@/contexts/CartContext";
import { Order } from "@/contexts/OrdersContext";

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  customizationTotal: number;
  grandTotal: number;
  addOrder: (order: Omit<Order, "status">) => void;
  router: AppRouterInstance;
};

export default function CheckoutSummary({
  items,
  subtotal,
  customizationTotal,
  grandTotal,
  addOrder,
  router,
}: CheckoutSummaryProps) {
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
      shippingCost: shipping,
      paymentMethod: "cod",
      shippingMethod: "standard",
      tax,
      total,
      date: new Date().toISOString(),
    };

    addOrder(orderData);
        
    // Navigate to confirmation page
    router.push(`/confirmation?orderId=${orderId}`);
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
}
