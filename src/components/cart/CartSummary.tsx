"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  subtotal: number;
  customizationTotal: number;
  grandTotal: number;
}

export default function CartSummary({
  subtotal,
  customizationTotal,
  grandTotal,
}: Props) {
  const router = useRouter();

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 space-y-5">
        
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Order Summary
        </h2>

        {/* Line items */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {customizationTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Customization</span>
              <span className="text-primary">+${customizationTotal.toFixed(2)}</span>
            </div>
          )}

         
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Total */}
        <div className="flex justify-between items-baseline">
          <span className="font-medium text-base">Total</span>
          <span className="font-heading text-2xl font-bold">
            ${grandTotal.toFixed(2)}
          </span>
        </div>


        {/* CTAs */}
        <div className="space-y-2 pt-1">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => router.push("/checkout")}
          >
            Proceed to Checkout →
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/categories">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}