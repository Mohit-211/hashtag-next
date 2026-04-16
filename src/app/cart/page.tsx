"use client";

import { useEffect, useState } from "react";

import CartEmpty from "@/components/cart/CartEmpty";
import CartItemsList from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";
import { GetAllCartItemsApi } from "@/api/operations/cart.api";


interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  customization_price?: number;
  image?: string;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch cart items from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await GetAllCartItemsApi();
        const data = res?.data?.data || res?.data;

        setItems(data || []);
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // ✅ Calculations
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const customizationTotal = items.reduce(
    (acc, item) =>
      acc + (item.customization_price || 0) * item.quantity,
    0
  );

  const grandTotal = subtotal + customizationTotal;

  // ✅ Loading state
  if (loading) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container text-center py-10">
          Loading cart...
        </div>
      </section>
    );
  }

  // ✅ Empty cart
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
          {/* ✅ Show items */}
          <CartItemsList items={items} />

          {/* ✅ Summary */}
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