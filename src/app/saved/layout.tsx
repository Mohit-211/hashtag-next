import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Saved Items");

export default function SavedLayout({ children }: { children: ReactNode }) {
  return children;
}
