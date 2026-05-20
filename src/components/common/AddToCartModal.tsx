"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Minus,
  Plus,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { AddToCartApi } from "@/api/operations/cart.api";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  variantId?: number;
  price: number;
  name: string;
  initialQuantity?: number;
  onSuccess?: () => void;
}

export default function AddToCartModal({
  open,
  onClose,
  productId,
  variantId,
  price,
  name,
  initialQuantity = 1,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [quantity, setQuantity] =
    useState<number>(initialQuantity || 1);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [success, setSuccess] =
    useState<boolean>(false);

  // sync quantity when modal opens
  useEffect(() => {
    if (open) {
      setQuantity(initialQuantity || 1);
      setSuccess(false);
    }
  }, [initialQuantity, open]);

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

      setTimeout(() => {
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div className="pr-4">
            <h2 className="text-xl font-bold text-black">
              Add To Cart
            </h2>

            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          
          {/* Quantity */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Quantity
            </p>

            <div className="flex items-center justify-center gap-4">
              
              {/* Minus */}
              <button
                type="button"
                onClick={() =>
                  setQuantity((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>

              {/* Input */}
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
                className="h-12 w-24 rounded-xl border text-center text-lg font-semibold outline-none focus:border-black"
              />

              {/* Plus */}
              <button
                type="button"
                onClick={() =>
                  setQuantity((prev) => prev + 1)
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border bg-gray-50 p-5">
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Price
              </span>

              <span className="font-semibold">
                ${price}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-gray-600">
                Quantity
              </span>

              <span className="font-semibold">
                {quantity}
              </span>
            </div>

            <div className="my-4 border-t" />

            <div className="flex items-center justify-between">
              <span className="text-base font-bold">
                Total
              </span>

              <span className="text-3xl font-extrabold text-black">
                ${(price * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="h-12 flex-1 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              onClick={handleAddToCart}
              disabled={loading || success}
              className="h-12 flex-1 rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </span>
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