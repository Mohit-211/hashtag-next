"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { AddToCartApi } from "@/api/operations/cart.api";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  variantId?: number;
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
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);

      // ✅ SAFE PAYLOAD (no undefined)
      const payload: {
        product_id: number;
        variant_id?: number;
        quantity: number;
      } = {
        product_id: productId,
        quantity,
      };

      if (variantId !== undefined) {
        payload.variant_id = variantId;
      }

      await AddToCartApi(payload);

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        setQuantity(1); // reset
      }, 1200);
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
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold">{name}</h2>
          <button onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus />
          </button>

          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-16 text-center border rounded"
          />

          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
          >
            <Plus />
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>₹{(price * quantity).toFixed(2)}</span>
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