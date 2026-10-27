import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Verify Email");

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
