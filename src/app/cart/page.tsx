"use client";

import { useCart } from "@/contexts/CartContext";

import CartEmpty from "@/components/cart/CartEmpty";
import CartItemsList from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";

export default function Cart() {
  const { items, subtotal, customizationTotal, grandTotal } = useCart();

  if (items.length === 0) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container">
          <CartEmpty />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Your Cart
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mt-2 max-w-2xl">
            Review your selections below. Adjust quantities, edit customization,
            or remove items before checkout.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* <CartItemsList items={items} /> */}

          <CartSummary
            subtotal={subtotal}
            customizationTotal={customizationTotal}
            grandTotal={grandTotal}
          />
        </div>
      </div>
    </section>
  );
}
