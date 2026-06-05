"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  image: string;
  price: number;
  variant_id?: number;
  badge?: string;
}

function FastImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#f3f5f4]" />}
      <Image
        src={src?.trim() ? src : "/placeholder.png"}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        unoptimized
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-all duration-500 group-hover:scale-105",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

export default function Saved() {
  const { wishlist, loading, removeItem, moveToCart } = useWishlist();

  const [removeLoadingId, setRemoveLoadingId] = useState<number | null>(null);
  const [cartLoadingId, setCartLoadingId] = useState<number | null>(null);

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("hastagBillionaire");

  const handleRemove = async (id: number) => {
    try {
      setRemoveLoadingId(id);
      await removeItem(id);
    } finally {
      setRemoveLoadingId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      setCartLoadingId(item.id);
      await moveToCart(item);
    } finally {
      setCartLoadingId(null);
    }
  };

  /* ── Login required ── */
  if (!isLoggedIn) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Sign in to see your wishlist</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                Save items you love and come back to them any time.
              </p>
            </div>
            <Link href="/login" className="mt-2">
              <Button size="lg" className="rounded-full px-8">Login to Continue</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading wishlist…
      </div>
    );
  }

  /* ── Empty ── */
  if (wishlist.length === 0) {
    return (
      <section className="py-28 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nothing saved yet</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              Browse products and tap the heart to save items you love.
            </p>
          </div>
          <Link href="/categories" className="mt-2">
            <Button size="lg" className="rounded-full px-8 gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  /* ── Wishlist grid ── */
  return (
    <section className="py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Saved Items</h1>
          <span className="text-sm text-muted-foreground tabular-nums">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {wishlist.map((item, index) => {
            const isRemoving = removeLoadingId === item.id;
            const isMovingToCart = cartLoadingId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative bg-card border rounded-2xl overflow-hidden",
                  "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                )}
              >
                {/* IMAGE — clickable → product page */}
                <Link href={`/product/${item.product_id}`} className="block relative aspect-square overflow-hidden bg-[#f8f8f8]">
                  <FastImage src={item.image} alt={item.name} priority={index < 4} />
                </Link>

                {/* Remove (heart) button — sits over image, stops propagation */}
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isRemoving}
                  aria-label="Remove from wishlist"
                  className={cn(
                    "absolute top-2 right-2 h-8 w-8 rounded-full z-10",
                    "flex items-center justify-center",
                    "bg-white/90 backdrop-blur-md border border-border/50 shadow-sm",
                    "transition-all hover:scale-110 disabled:opacity-60"
                  )}
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Heart className="h-3.5 w-3.5 text-rose-500" fill="currentColor" />
                  )}
                </button>

                {/* BODY */}
                <div className="p-3">
                  {/* Name — clickable → product page */}
                  <Link
                    href={`/product/${item.product_id}`}
                    className="text-sm leading-snug line-clamp-2 text-foreground min-h-[2.5rem] hover:text-primary transition-colors block"
                  >
                    {item.name}
                  </Link>

                  <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="font-semibold text-base">
                      ${item.price.toLocaleString("en-IN")}
                    </span>

                    {/* Move to cart */}
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={isMovingToCart}
                      aria-label={`Move ${item.name} to cart`}
                      className={cn(
                        "flex items-center justify-center h-9 w-9 rounded-xl",
                        "bg-black text-white",
                        "transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                      )}
                    >
                      {isMovingToCart ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}