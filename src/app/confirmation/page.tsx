"use client";

import { useState } from "react";
// import { useSearchParams } from "next/navigation";

import ConfirmationHeader from "@/components/confirmation/ConfirmationHeader";
import OrderInfoCard from "@/components/confirmation/OrderInfoCard";
import OrderedItems from "@/components/confirmation/OrderedItems";
import PriceSummary from "@/components/confirmation/PriceSummary";
import NextSteps from "@/components/confirmation/NextSteps";
import ConfirmationActions from "@/components/confirmation/ConfirmationActions";

import type { CartItem } from "@/contexts/CartContext";

interface OrderState {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  customizationTotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  shippingMethod: string;
  date: string;
}

export default function Confirmation() {
  // const searchParams = useSearchParams();

  // const orderId = searchParams.get("orderId") || "HB00000001";
const orderId="HB00000001"
  const [order] = useState<OrderState | null>(null);

  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-3xl">
        <ConfirmationHeader />

        <OrderInfoCard
          orderId={orderId}
          orderDate={orderDate}
          paymentMethod={order?.paymentMethod ?? "card"}
        />

        <OrderedItems items={order?.items ?? []} />

        {order && <PriceSummary order={order} />}

        <NextSteps />

        <ConfirmationActions />
      </div>
    </section>
  );
}
