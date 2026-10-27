import type { ReactNode } from "react";
import { privatePage } from "@/lib/seo";

export const metadata = privatePage("Track Order");

export default function TrackOrderLayout({ children }: { children: ReactNode }) {
  return children;
}
