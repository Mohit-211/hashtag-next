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
  addItem: (item: CartItem) => void; // ✅ ADD THIS
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ Fetch cart from API
  const fetchCart = useCallback(async () => {
    try {
      const res = await GetAllCartItemsApi();
      const data = res?.data?.data || res?.data;

      const formatted = (data?.items || []).map((item: any) => ({
        id: String(item.product_id),
        name: item.name,
        image: item.image,
        basePrice: item.price,
        quantity: item.quantity,
        customization: {
          placements: [],
          uploadFee: item.customization_price || 0,
        },
      }));

      setItems(formatted);
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ ADD ITEM (🔥 FIX)
  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      // नया item add करो
      return [...prev, item];
    });
  };

  // ✅ Derived values
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const subtotal = items.reduce(
    (s, i) => s + i.basePrice * i.quantity,
    0
  );

  const customizationTotal = items.reduce(
    (s, i) => s + (i.customization.uploadFee || 0) * i.quantity,
    0
  );

  const grandTotal = subtotal + customizationTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        customizationTotal,
        grandTotal,
        refreshCart: fetchCart,
        addItem, // ✅ FIXED
      }}
    >
      {children}
    </CartContext.Provider>
  );
};