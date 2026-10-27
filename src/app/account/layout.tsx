import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("My Account");

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
