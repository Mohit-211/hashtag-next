"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

import { CartProvider } from "@/contexts/CartContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <OrdersProvider>{children}</OrdersProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
