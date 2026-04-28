"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  ArrowRight,
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
  const { wishlist, loading, removeItem, moveToCart } = useWishlist();
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const handleRemove = async (id: number) => {
    setActionLoadingId(id);
    await removeItem(id);
    setActionLoadingId(null);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    setActionLoadingId(item.id);
    await moveToCart(item);
    setActionLoadingId(null);
  };

  if (loading) {
    return (
      <p className="text-center py-20 text-muted-foreground">
        Loading wishlist...
      </p>
    );
  }

  if (wishlist.length === 0) {
    return (
      <section className="py-20 text-center">
        <h1 className="text-3xl font-bold">No Saved Items</h1>
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
        <h1 className="text-3xl font-bold mb-6">Saved Items</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {wishlist.map((item) => {
            const isLoading = actionLoadingId === item.id;

            return (
              <div key={item.id} className="border rounded-lg p-3">
                <ProxyImage
                  src={item.image}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="w-full h-40 object-cover"
                />

                <h3 className="text-sm mt-2">{item.name}</h3>
                <p className="font-bold">₹{item.price}</p>

                <div className="flex flex-col gap-2 mt-2">
                  <button onClick={() => handleRemove(item.id)}>
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Heart className="text-red-500" fill="currentColor" />
                    )}
                  </button>

                  <Button
                    size="sm"
                    onClick={() => handleMoveToCart(item)}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
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