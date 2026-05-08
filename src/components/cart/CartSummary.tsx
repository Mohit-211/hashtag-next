"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CheckoutAddressModal from "./Checkoutaddressmodal";
 // adjust path

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
  const [modalOpen, setModalOpen] = useState(false);

  const finalTotal = grandTotal;

  const handleConfirm = (addressId: string, shippingData: any) => {
    // shippingData contains the response from SHIPPING_RATE API
    console.log("Selected address:", addressId, "Shipping:", shippingData);
    // TODO: navigate to /checkout or update checkout state with addressId + shippingData
  };

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-heading font-bold text-lg">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {customizationTotal > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Customization</span>
              <span>+₹{customizationTotal}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3 flex justify-between font-heading font-bold">
          <span>Total</span>
          <span className="text-primary text-xl">₹{finalTotal}</span>
        </div>

        <div className="space-y-2 pt-2">
          {/* ✅ Opens address modal instead of navigating directly */}
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => setModalOpen(true)}
          >
            Proceed to Checkout
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/categories">Continue Shopping</Link>
          </Button>
        </div>
      </div>

      {/* ✅ Address selection modal */}
      <CheckoutAddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}