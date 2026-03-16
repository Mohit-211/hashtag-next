"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { CartItem } from "./CartContext";

export type OrderStatus =
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface Order {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  customizationTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
  date: string;
  status: OrderStatus;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "status">) => void;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
};

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = useCallback((order: Omit<Order, "status">) => {
    setOrders((prev) => [{ ...order, status: "Processing" }, ...prev]);
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};
