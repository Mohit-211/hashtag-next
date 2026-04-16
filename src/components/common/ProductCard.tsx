"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddToCartApi } from "@/api/operations/cart.api";

interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  customizable?: boolean;
  productId?: number;
  variantId?: number;
}

export default function ProductCard({
  image,
  name,
  price,
  originalPrice,
  badge,
  customizable,
  productId = 1,
  variantId = 1,
}: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group relative bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

        {/* ✅ CLICKABLE IMAGE ONLY */}
        <Link href={`/product/${productId}`}>
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <Image
              unoptimized={process.env.NODE_ENV === "development"}
              crossOrigin="anonymous"
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {badge && (
              <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md">
                {badge}
              </span>
            )}
          </div>
        </Link>

        {/* ❤️ Like Button */}
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
            liked
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </button>

        {/* 🛒 Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="hero"
            size="sm"
            className="w-full gap-2 rounded-md"
            onClick={() => setShowModal(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>

        {/* ✅ CLICKABLE TITLE */}
        <div className="p-4 space-y-1.5">
          <Link href={`/product/${productId}`}>
            <h3 className="text-sm font-medium text-foreground truncate hover:underline cursor-pointer">
              {name}
            </h3>
          </Link>

          {/* <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              ${price}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice}
              </span>
            )}
          </div> */}

          {customizable && (
            <span className="inline-block text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              CUSTOMIZABLE
            </span>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">

            <div className="flex justify-between">
              <h2 className="text-base font-semibold">{name}</h2>
              <button onClick={() => setShowModal(false)}>
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
              <Button onClick={() => setShowModal(false)} variant="outline">
                Cancel
              </Button>

              <Button onClick={handleAddToCart} disabled={loading || success}>
                {success ? "Added ✓" : loading ? "Adding..." : "Confirm"}
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}