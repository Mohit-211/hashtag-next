"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Heart,
  ShoppingBag,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import ProxyImage from "@/components/Proxyimage";

import { useWishlist } from "@/contexts/WishlistContext";

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  image: string;
  price: number;
  variant_id?: number;
}

export default function Saved() {
  const {
    wishlist,
    loading,
    removeItem,
    moveToCart,
  } = useWishlist();

  const [actionLoadingId, setActionLoadingId] =
    useState<number | null>(null);

  // ✅ TOKEN CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  const handleRemove = async (id: number) => {
    setActionLoadingId(id);

    await removeItem(id);

    setActionLoadingId(null);
  };

  const handleMoveToCart = async (
    item: WishlistItem
  ) => {
    setActionLoadingId(item.id);

    await moveToCart(item);

    setActionLoadingId(null);
  };

  // ✅ LOGIN REQUIRED
  if (!isLoggedIn) {
    return (
      <section className="py-8 lg:py-14">
        <div className="container max-w-3xl">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-bold">
              Please Login
            </h2>

            <p className="text-muted-foreground mt-2 max-w-md">
              You need to login to view your
              orders and track your purchases.
            </p>

            <Link href="/login" className="mt-6">
              <Button className="cursor-pointer">
                Login to Continue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Loading
  if (loading) {
    return (
      <p className="text-center py-20 text-muted-foreground">
        Loading wishlist...
      </p>
    );
  }

  // ✅ Empty Wishlist
  if (wishlist.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-bold">
          No Saved Items
        </h1>

        <p className="text-muted-foreground mt-2">
          Your wishlist is currently empty.
        </p>

        <Link href="/categories">
          <Button className="mt-4">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Browse Products
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">
          Saved Items
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {wishlist.map((item) => {
            const isLoading =
              actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="border rounded-lg p-3"
              >
                <ProxyImage
                  src={item.image}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="w-full h-40 object-cover"
                />

                <h3 className="text-sm mt-2 line-clamp-2">
                  {item.name}
                </h3>

                <p className="font-bold mt-1">
                  ₹{item.price}
                </p>

                <div className="flex flex-col gap-2 mt-3">
                  {/* Remove */}
                  <button
                    onClick={() =>
                      handleRemove(item.id)
                    }
                    className="flex items-center justify-center border rounded-md py-2 hover:bg-secondary transition"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart
                        className="h-4 w-4 text-red-500"
                        fill="currentColor"
                      />
                    )}
                  </button>

                  {/* Move To Cart */}
                  <Button
                    size="sm"
                    onClick={() =>
                      handleMoveToCart(item)
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="mr-1 h-4 w-4" />
                    )}

                    Move to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}