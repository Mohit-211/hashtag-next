"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { GetAllCartItemsApi } from "@/api/operations/cart.api";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  customization: {
    uploadedImage: any;
    placements: any[];
    uploadFee: number;
  };
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  customizationTotal: number;
  grandTotal: number;
  refreshCart: () => void;
  addItem: (item: CartItem) => void;
}

const CartContext = createContext<CartContextType | null>(
  null
);

export const useCart = () => {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error(
      "useCart must be used within CartProvider"
    );
  }

  return ctx;
};

export const CartProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ SINGLE TOKEN CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  // ✅ Fetch cart only when logged in
  const fetchCart = useCallback(async () => {
    // 🚫 No token = no API call
    if (!isLoggedIn) {
      setItems([]);
      return;
    }

    try {
      const res = await GetAllCartItemsApi();

      const data = res?.data?.data || res?.data;
console.log(data,"data==>>")
      const formatted = (data?.items || []).map(
        (item: any) => ({
          id: String(item.product_id),
          name: item.name,
          image: item.image,
          basePrice: item.price,
          quantity: item.quantity,
cart_id: item.cart_id,
          customization: {
            uploadedImage: null,
            placements: [],
            uploadFee:
              item.customization_price || 0,
          },
        })
      );

      setItems(formatted);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setItems([]);
    }
  }, [isLoggedIn]);

  // ✅ Initial fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ Add Item
  const addItem = (item: CartItem) => {
    // 🚫 Prevent guest cart
    if (!isLoggedIn) return;

    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id
      );

      // ✅ Increase quantity
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity:
                  i.quantity + item.quantity,
              }
            : i
        );
      }

      // ✅ New item
      return [...prev, item];
    });
  };

  // ✅ Derived Values
  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.basePrice * item.quantity,
    0
  );

  const customizationTotal = items.reduce(
    (sum, item) =>
      sum +
      (item.customization.uploadFee || 0) *
        item.quantity,
    0
  );

  const grandTotal =
    subtotal + customizationTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        customizationTotal,
        grandTotal,
        refreshCart: fetchCart,
        addItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};