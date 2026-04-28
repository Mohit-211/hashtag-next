"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddToCartModal from "./AddToCartModal";
import ProxyImage from "../Proxyimage";

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

  return (
    <>
      <div className="group relative bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

        {/* IMAGE */}
        <Link href={`/product/${productId}`}>
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <ProxyImage
              // unoptimized={process.env.NODE_ENV === "development"}
              // crossOrigin="anonymous"
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

        {/* LIKE */}
        {/* <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
            liked
              ? "bg-primary text-primary-foreground"
              : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </button> */}

        {/* QUICK ADD */}
        {/* <div className="bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="hero"
            size="sm"
            className="w-full gap-2 rounded-md"
            onClick={() => setShowModal(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
        </div> */}

        {/* TITLE */}
        <div className="p-4 space-y-1.5">
          <Link href={`/product/${productId}`}>
            <h3 className="text-sm font-medium text-foreground truncate hover:underline cursor-pointer">
              {name}
            </h3>
          </Link>

          {customizable && (
            <span className="inline-block text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              CUSTOMIZABLE
            </span>
          )}
        </div>
      </div>

      {/* ✅ REUSABLE MODAL */}
      <AddToCartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        productId={productId}
        variantId={variantId}
        price={price}
        name={name}
      />
    </>
  );
}