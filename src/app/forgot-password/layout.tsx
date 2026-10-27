import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Forgot Password");

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
