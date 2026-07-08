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
  image?: string;
  logo_image?: string;
  basePrice: number;
  quantity: number;
  cart_id?: number;

  customization: {
    uploadedImage: any;
    placements: any[];
    uploadFee: number;
  };
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
  subtotal: number;
  customizationTotal: number;
  grandTotal: number;

  pending_order: PendingOrder | null;

  cartData: any;

  refreshCart: () => Promise<void>;

  addItem: (item: CartItem) => void;
}
const CartContext =
  createContext<CartContextType | null>(
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
  const [items, setItems] = useState<
    CartItem[]
  >([]);
  const [cartData, setCartData] = useState<any>(null);

  const [pendingOrder, setPendingOrder] =
    useState<PendingOrder | null>(null);

  // ✅ LOGIN CHECK
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem(
      "hastagBillionaire"
    );

  // ✅ FETCH CART
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("hastagBillionaire");

    if (!token) {
      setItems([]);
      setPendingOrder(null);
      setCartData(null);
      return;
    }

    try {
      const res = await GetAllCartItemsApi();

      console.log("Cart API Response:", res);

      const data = res?.data?.data || res?.data;

      console.log("Cart Data:", data);

      // Store complete response
      setCartData(data);

      // Store pending order
      setPendingOrder(data?.pending_order || null);

      // Format cart items
     const formatted: CartItem[] = (data?.items || []).map((item: any) => ({
  ...item, // ✅ Include all API fields

  id: String(item.product_id),
  name: item.name || item.product_name || "",
  image: item.image ,
  logo_image: item.logo_image ,
  basePrice: Number(item.price ?? item.base_price ?? 0),
  quantity: Number(item.quantity ?? 1),
  cart_id: item.cart_id,

  customization: {
    uploadedImage: item.uploaded_image || null,
    placements: item.placements || [],
    uploadFee: Number(item.customization_price ?? 0),
  },
}));
      setItems(formatted);

      console.log("Formatted Cart Items:", formatted);
    } catch (err) {
      console.error("Fetch Cart Error:", err);

      setItems([]);
      setPendingOrder(null);
      setCartData(null);
    }
  }, []);

  // ✅ INITIAL FETCH
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ ADD ITEM
  const addItem = (
    item: CartItem
  ) => {
    if (!isLoggedIn) return;

    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id
      );

      // ✅ Increase qty
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
              ...i,
              quantity:
                i.quantity +
                item.quantity,
            }
            : i
        );
      }

      // ✅ Add new
      return [...prev, item];
    });
  };

  // ✅ TOTAL ITEMS
  const totalItems = items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  // ✅ SUBTOTAL
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      item.basePrice *
      item.quantity,
    0
  );

  // ✅ CUSTOMIZATION TOTAL
  const customizationTotal =
    items.reduce(
      (sum, item) =>
        sum +
        (item.customization
          .uploadFee || 0) *
        item.quantity,
      0
    );

  // ✅ GRAND TOTAL
  const grandTotal =
    subtotal +
    customizationTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        cartData,
        totalItems,
        subtotal,
        customizationTotal,
        grandTotal,
        pending_order: pendingOrder,
        refreshCart: fetchCart,
        addItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};