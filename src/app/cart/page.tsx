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
              {/* Image */}
              <div className="w-24 h-24 bg-gray-200 rounded-md" />

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />

                {/* Quantity */}
                <div className="flex gap-2 mt-2">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-10 h-8 bg-gray-200 rounded" />
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                </div>
              </div>

              {/* Price */}
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
  const {
    items = [],
    subtotal,
    customizationTotal,
    grandTotal,
    refreshCart,
  } = useCart();

  const [loading, setLoading] = useState(true);
  console.log(items, "items for page")
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

  // ✅ Loading
  if (loading) {
    return <CartSkeleton />;
  }

  // ✅ Empty cart
  if (items.length === 0) {
    return <CartEmpty />;
  }
  console.log(items, "yhaaa====")
  // ✅ Safe typed items
  const formattedItems: CartItemType[] = items.map((item: any) => ({
    id: item.id || item._id || "",
    cart_id: item.cart_id || item.id || "",
    size: item.size || "",
    name: item.name || "",
    logo_image: item.logo_image || "/placeholder.png",
    image: item.image || "/placeholder.png",
    basePrice: Number(item.basePrice || item.price || 0),
    quantity: Number(item.quantity || 1),

    customization: item.customization || {
      placements: [],
      uploadFee: 0,
    },
  }));

  return (
    <section className="py-8">
      <div className="container grid lg:grid-cols-3 gap-8">

        {/* 🛒 Items */}
        <CartItemsList
          items={formattedItems}
          onRefresh={refreshCart}
        />

        {/* 💰 Summary */}
        <CartSummary
          subtotal={subtotal}
          customizationTotal={customizationTotal}
          grandTotal={grandTotal}
        />
      </div>
    </section>
  );
}