"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

import RadioOption from "./RadioOption";

type ShippingMethod = "standard" | "express";

export default function ShippingMethodSection() {
  const [method, setMethod] = useState<ShippingMethod>("standard");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Shipping Method</h2>

      <RadioOption
        selected={method === "standard"}
        onSelect={() => setMethod("standard")}
        icon={<ShoppingBag className="h-5 w-5" />}
        label="Standard Shipping"
        desc="5–7 days delivery"
      />

      <RadioOption
        selected={method === "express"}
        onSelect={() => setMethod("express")}
        icon={<ShoppingBag className="h-5 w-5" />}
        label="Express Shipping"
        desc="2–3 days delivery"
      />
    </div>
  );
}
