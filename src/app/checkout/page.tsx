"use client";

import { useRouter } from "next/navigation";

import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";

import CheckoutEmpty from "@/components/checkout/CheckoutEmpty";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

export default function Checkout() {
  const router = useRouter();

  const { items, subtotal, customizationTotal, grandTotal } =
    useCart();

  const { addOrder } = useOrders();

  if (items.length === 0) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container">
          <CheckoutEmpty />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Checkout
          </h1>

          <p className="text-muted-foreground mt-2 max-w-2xl">
            You're almost there. Confirm your details and place the order.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <CheckoutForm />

          <CheckoutSummary
            items={items}
            subtotal={subtotal}
            customizationTotal={customizationTotal}
            grandTotal={grandTotal}
            addOrder={addOrder}
            router={router}
          />
        </div>
      </div>
    </section>
  );
}
