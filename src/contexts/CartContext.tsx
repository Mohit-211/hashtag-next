import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CartItemCustomization {
  placements: { id: string; label: string; cost: number }[];
  uploadedImage: string | null;
  uploadedFileName: string;
  uploadFee: number;
}

export interface CartItem {
  id: string;
  image: string;
  name: string;
  basePrice: number;
  quantity: number;
  customization: CartItemCustomization;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  customizationTotal: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const subtotal = items.reduce((s, i) => s + i.basePrice * i.quantity, 0);

  const customizationTotal = items.reduce((s, i) => {
    const placementCost = i.customization.placements.reduce((ps, p) => ps + p.cost, 0);
    const uploadCost = i.customization.uploadedImage ? i.customization.uploadFee : 0;
    return s + (placementCost + uploadCost) * i.quantity;
  }, 0);

  const grandTotal = subtotal + customizationTotal;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, customizationTotal, grandTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};
