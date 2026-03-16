// components/product/customization/QuantitySelector.tsx

"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export default function QuantitySelector() {
  const [quantity, setQuantity] = useState<number>(1);

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">Quantity</span>

      <div className="flex items-center border rounded-lg">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="p-2"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="w-10 text-center">{quantity}</span>

        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="p-2"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
