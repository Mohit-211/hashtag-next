"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

import { CartProvider } from "@/contexts/CartContext";
import { SavedItemsProvider } from "@/contexts/SavedItemsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <SavedItemsProvider>
            <OrdersProvider>{children}</OrdersProvider>
          </SavedItemsProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
