"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Minus,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";

import { AddToCartApi } from "@/api/operations/cart.api";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  variantId?: number;
  price: number;
  name: string;
  onSuccess?: () => void;
}

export default function AddToCartModal({
  open,
  onClose,
  productId,
  variantId,
  price,
  name,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [quantity, setQuantity] =
    useState<number>(1);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [success, setSuccess] =
    useState<boolean>(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);

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

      onSuccess?.();

      // ✅ redirect to checkout page
      setTimeout(() => {
        setQuantity(1);
        onClose();

        router.push("/checkout");
      }, 1000);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-lg font-bold">
              Add To Cart
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Quantity */}
          <div>
            <p className="text-sm font-medium mb-3">
              Quantity
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.max(1, q - 1)
                  )
                }
                className="h-11 w-11 rounded-full border hover:bg-gray-100 flex items-center justify-center transition"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Number(e.target.value) || 1
                    )
                  )
                }
                className="w-24 h-11 text-center border rounded-xl font-semibold outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => q + 1)
                }
                className="h-11 w-11 rounded-full border hover:bg-gray-100 flex items-center justify-center transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl bg-gray-50 p-5 border">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Price
              </span>

              <span className="font-medium">
                ₹{price}
              </span>
            </div>

            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600">
                Quantity
              </span>

              <span className="font-medium">
                {quantity}
              </span>
            </div>

            <div className="border-t my-4" />

            <div className="flex justify-between items-center">
              <span className="text-base font-semibold">
                Total
              </span>

              <span className="text-2xl font-bold text-primary">
                ₹{(price * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              onClick={handleAddToCart}
              disabled={loading || success}
              className="flex-1 h-11 rounded-xl"
            >
              {loading ? (
                "Adding..."
              ) : success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Added
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}