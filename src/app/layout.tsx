import type { Metadata } from "next";

import { Inter, Space_Grotesk } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";

import { CartProvider } from "@/contexts/CartContext";
import { SavedItemsProvider } from "@/contexts/SavedItemsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HashtagBillionaire",
  description:
    "A platform for identity, customization, and self-expression through personalized products.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <SavedItemsProvider>
                <OrdersProvider>
                  <Header />

                  {children}

                  <Footer />

                  <Sonner position="top-right" richColors />
                </OrdersProvider>
              </SavedItemsProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
