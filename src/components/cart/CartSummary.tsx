"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const finalTotal = grandTotal;

  const handleCheckout = () => {
    // ✅ direct redirect to checkout page
    router.push("/checkout");
  };

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-card border border-border rounded-xl p-6 space-y-4">
        
        {/* Heading */}
        <h2 className="font-heading font-bold text-lg">
          Order Summary
        </h2>

        {/* Price Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>

            <span>${subtotal}</span>
          </div>

          {customizationTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Customization</span>

              <span>
                +${customizationTotal}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-3 flex justify-between font-heading font-bold">
          <span>Total</span>

          <span className="text-primary text-xl">
            ${finalTotal}
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Link href="/categories">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}