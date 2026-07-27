"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

export default function SuccessScreen({ orderId }: { orderId: number | null }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-sm w-full">
        {/* Card */}
        <div className="bg-card rounded-[1.5rem] border border-border shadow-xl overflow-hidden">
          {/* Top accent */}
          <div className="h-2 bg-primary" />

          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div className="relative h-20 w-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/25 animate-ping" />
              <div className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary-foreground" strokeWidth={2.25} />
              </div>
            </div>

            <h1 className="mt-6 font-heading text-2xl font-bold text-foreground tracking-tight">
              Order Confirmed!
            </h1>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Your order has been placed successfully. You&apos;ll receive a confirmation email shortly.
            </p>

            {/* Order ID badge */}
            {/* {orderId && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-[0.75rem] bg-secondary border border-border px-4 py-2.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  Order #{orderId}
                </span>
              </div>
            )} */}

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => router.push("/categories")}
                className="w-full bg-primary hover:brightness-95 text-primary-foreground py-3.5 rounded-[1rem] font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Questions? Contact our support team anytime.
        </p>
      </div>
    </div>
  );
}