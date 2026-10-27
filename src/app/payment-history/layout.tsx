import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Payment History");

export default function PaymentHistoryLayout({ children }: { children: ReactNode }) {
  return children;
}
