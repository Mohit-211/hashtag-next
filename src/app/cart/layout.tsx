import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Cart");

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
