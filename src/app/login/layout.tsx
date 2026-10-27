import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Log In");

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
