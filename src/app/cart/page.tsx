"use client";

import { useEffect, useState } from "react";

import CartEmpty from "@/components/cart/CartEmpty";
import CartItemsList from "@/components/cart/CartItemsList";
import CartSummary from "@/components/cart/CartSummary";
import { GetAllCartItemsApi } from "@/api/operations/cart.api";

// ✅ API response type
interface ApiCartItem {
  id: number; // cart_id
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  customization_price?: number;
  image?: string;
}

// ✅ UI type (used in CartItem component)
type CartItemType = {
  id: number;
  cart_id: number;
  name: string;
  image?: string;
  basePrice: number;
  price: number;
  quantity: number;
  customization?: {
    placements?: any[];
    uploadFee?: number;
    uploadedImage?: string;
  };
};

export default function Cart() {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch cart items from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await GetAllCartItemsApi();
        const data = res?.data?.data || res?.data;

        // 🔥 Transform API → UI format
        const formattedItems: CartItemType[] = (data || []).map(
          (item: ApiCartItem) => ({
            id: item.product_id,       // UI usage
            cart_id: item.id,          // API usage
            name: item.name,
            image: item.image,
            basePrice: item.price,     // ✅ FIXED
            price: item.price,
            quantity: item.quantity,
            customization: {
              placements: [],
              uploadFee: item.customization_price || 0,
              uploadedImage: undefined,
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

    fetchCart();
  }, []);

  // ✅ Calculations
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
          {/* ✅ Items List */}
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