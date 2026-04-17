"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { AddToCartApi } from "@/api/operations/cart.api";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  variantId: number;
  price: number;
  name: string;
}

export default function AddToCartModal({
  open,
  onClose,
  productId,
  variantId,
  price,
  name,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await AddToCartApi({
        product_id: productId,
        variant_id: variantId,
        quantity,
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5">

        {/* Header */}
        <div className="flex justify-between">
          <h2 className="text-base font-semibold">{name}</h2>
          <button onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
            <Minus />
          </button>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-16 text-center"
          />

          <button onClick={() => setQuantity(q => q + 1)}>
            <Plus />
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-between">
          <span>Total</span>
          <span>${(price * quantity).toFixed(2)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>

          <Button onClick={handleAddToCart} disabled={loading || success}>
            {success ? "Added ✓" : loading ? "Adding..." : "Confirm"}
          </Button>
        </div>

      </div>
    </div>
  );
}