import type { Metadata } from "next";
import { Suspense } from "react";

import OrderConfirmation, { ConfirmationSkeleton } from "@/components/confirmation/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <OrderConfirmation />
    </Suspense>
  );
}
