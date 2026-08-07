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

// Raw cart item, as sent by the API — no remapping. Extra fields
// (stock, pricing_snapshot, is_purchasable, etc.) pass through via the
// index signature so nothing downstream has to guess what exists.
export interface CartItem {
  cart_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;

  name: string;
  image?: string;
  logo_image?: string;
  size?: string;
  color?: string;
  color_code?: string;

  base_price: number;
  price?: number;
  total_price?: number;

  can_increase?: boolean;
  can_decrease?: boolean;

  customization_config?: {
    print_method?: string | null;
    locations?: { location: string }[];
    [key: string]: any;
  };

  [key: string]: any;
}

// The API's own computed totals — no need to recompute these client-side.
export interface CartSummary {
  items_total: number;
  shipping_cost: number;
  grand_total: number;
}

export interface PendingOrder {
  order_id: number;
  order_number: string;
  total_amount: number;
  shipping_amount: number;
  payment_status: string;
  shipment_status: string;
  tracking_number?: string;
  label_url?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  summary: CartSummary | null;
  pending_order: PendingOrder | null;
  cartData: any;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }

  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [cartData, setCartData] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("hastagBillionaire");

    if (!token) {
      setItems([]);
      setSummary(null);
      setPendingOrder(null);
      setCartData(null);
      return;
    }

    try {
      const res = await GetAllCartItemsApi();
      const data = res?.data?.data || res?.data;

      setCartData(data);
      setItems(data?.items ?? []);
      setSummary(data?.summary ?? null);
      setPendingOrder(data?.pending_order ?? null);
    } catch (err) {
      console.error("Fetch Cart Error:", err);

      setItems([]);
      setSummary(null);
      setPendingOrder(null);
      setCartData(null);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        summary,
        pending_order: pendingOrder,
        cartData,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};