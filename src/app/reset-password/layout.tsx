import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Reset Password");

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
