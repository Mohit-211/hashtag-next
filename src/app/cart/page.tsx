// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";

import CartEmpty from "@/components/cart/CartEmpty";
import CartItemsList, {
  CartItemType,
} from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";
import { useCart } from "@/contexts/CartContext";

function CartSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 flex gap-4 animate-pulse"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-md" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="flex gap-2 mt-2">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-10 h-8 bg-gray-200 rounded" />
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded self-center" />
            </div>
          ))}
        </div>

        {/* RIGHT: Order Summary */}
        <div className="bg-white rounded-xl p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { items = [], summary, refreshCart } = useCart();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await refreshCart();
      } catch (error) {
        console.error("Failed to load cart:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshCart]);

  if (loading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <section className="py-8">
      <div className="container grid lg:grid-cols-3 gap-8">
        {/* 🛒 Items */}
        <CartItemsList items={items as CartItemType[]} onRefresh={refreshCart} />

        {/* 💰 Summary */}
        <CartSummary
          itemsTotal={summary?.items_total ?? 0}
          shippingCost={summary?.shipping_cost ?? 0}
          grandTotal={summary?.grand_total ?? 0}
        />
      </div>
    </section>
  );
}