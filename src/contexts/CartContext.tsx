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
  clearCart: () => void;
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

  // Runs once when CartProvider mounts — this is what re-syncs the cart
  // from the server every time the provider is freshly mounted, e.g. after
  // a full page reload triggered by window.location.href.
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Resets local cart state immediately, without waiting on a server
  // round trip — used right after a successful payment so the header
  // badge clears at once instead of lagging behind refreshCart().
  const clearCart = useCallback(() => {
    setItems([]);
    setSummary(null);
    setPendingOrder(null);
    setCartData(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        summary,
        pending_order: pendingOrder,
        cartData,
        refreshCart: fetchCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};