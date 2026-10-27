import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Customize");

export default function CustomizationLayout({ children }: { children: ReactNode }) {
  return children;
}
