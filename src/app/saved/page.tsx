"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

import {
  GetWishlistApi,
  RemoveFromWishlistApi,
  MoveWishlistToCartApi,
} from "@/api/operations/wishlist.api";

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  image: string;
  price: number;
  variant_id?: number;
}

export default function Saved() {
  const { addItem } = useCart();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // ✅ Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const res = await GetWishlistApi();
      const data = res?.data?.data || [];
      setWishlist(data);
    } catch (error) {
      console.error("Wishlist fetch error:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // ❌ Remove Item
  const handleRemove = async (id: number) => {
    try {
      setActionLoadingId(id);

      await RemoveFromWishlistApi(id);

      setWishlist((prev) => prev.filter((item) => item.id !== id));

      toast.success("Removed from wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 🔄 Move to Cart
  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      setActionLoadingId(item.id);

      await MoveWishlistToCartApi({
        wishlist_id: item.id,
      });

      addItem({
        id: `wishlist-${item.id}`,
        image: item.image,
        name: item.name,
        basePrice: item.price,
        quantity: 1,
        customization: {
          placements: [],
          uploadedImage: null,
          uploadedFileName: "",
          uploadFee: 30,
        },
      });

      setWishlist((prev) => prev.filter((i) => i.id !== item.id));

      toast.success(`${item.name} moved to cart`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to move item");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ⏳ Loading
  if (loading) {
    return (
      <p className="text-center py-20 text-muted-foreground">
        Loading wishlist...
      </p>
    );
  }

  // ❌ Empty
  if (wishlist.length === 0) {
    return (
      <section className="py-20">
        <div className="container max-w-lg text-center space-y-6">
          <Image
            src="/assets/empty-saved.jpg"
            alt="No saved items"
            width={112}
            height={112}
            className="w-28 h-28 mx-auto object-contain opacity-80"
          />

          <h1 className="text-3xl font-bold">No Saved Items</h1>

          <p className="text-muted-foreground">
            You haven't saved anything yet.
          </p>

          <Link href="/categories">
            <Button className="gap-2">
              <ShoppingBag className="h-5 w-5" />
              Browse Products
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  // ✅ UI
  return (
    <section className="py-8 lg:py-14">
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">Saved Items</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map((item) => {
            const isLoading = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="group relative bg-card rounded-lg overflow-hidden border hover:shadow-lg transition"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    unoptimized={process.env.NODE_ENV === "development"}
          crossOrigin="anonymous"
                    src={item?.image}
                    alt={item.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />

                 <button
  onClick={() => handleRemove(item.id)}
  disabled={isLoading}
  className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow"
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
  )}
</button>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium truncate">
                    {item.name}
                  </h3>

                  <p className="font-bold">₹{item.price}</p>

                  <div className="flex flex-col gap-2">
                    <Link href={`/product/${item.product_id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        View
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => handleMoveToCart(item)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <ShoppingBag className="h-3 w-3 mr-1" />
                      )}
                      Move to Cart
                    </Button>
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