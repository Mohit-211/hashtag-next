import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("My Orders");

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
