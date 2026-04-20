"use client";

import { useEffect, useState } from "react";

import CartEmpty from "@/components/cart/CartEmpty";
import CartItemsList from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";
import { GetAllCartItemsApi } from "@/api/operations/cart.api";

interface ApiCartItem {
  cart_id: any;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  customization_price?: number;
  image?: string;
}

export default function Cart() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Cart
  const fetchCart = async () => {
    try {
      setLoading(true);

      const res = await GetAllCartItemsApi();
      const data = res?.data?.data || res?.data;
      console.log(data, "data by cart")
      const formattedItems = (data || []).map(
        (item: ApiCartItem) => ({
          id: item.product_id,
          cart_id: item.cart_id,
          name: item.name,
          image: item.image,
          basePrice: item.price,
          price: item.price,
          quantity: item.quantity,
          customization: {
            placements: [],
            uploadFee: item.customization_price || 0,
          },
        })
      );

      setItems(formattedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = items.reduce(
    (acc, item) => acc + item.basePrice * item.quantity,
    0
  );

  const customizationTotal = items.reduce(
    (acc, item) =>
      acc + (item.customization?.uploadFee || 0) * item.quantity,
    0
  );

  const grandTotal = subtotal + customizationTotal;

  if (loading) {
    return <div className="text-center py-10">Loading cart...</div>;
  }

  if (items.length === 0) {
    return <CartEmpty />;
  }
  console.log(items, "items")
  return (
    <section className="py-8">
      <div className="container grid lg:grid-cols-3 gap-8">
        <CartItemsList
          items={items}
          onRefresh={fetchCart}
        />

        <CartSummary
          subtotal={subtotal}
          customizationTotal={customizationTotal}
          grandTotal={grandTotal}
        />
      </div>
    </section>
  );
}