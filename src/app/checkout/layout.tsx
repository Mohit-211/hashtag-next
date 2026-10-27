import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Checkout");

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
