"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, X, ArrowRight } from "lucide-react";
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

  // ✅ Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const res = await GetWishlistApi();
      const data = res?.data?.data || [];

      setWishlist(data);
    } catch (error) {
      console.error("Wishlist fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // ❌ Remove
  const handleRemove = async (id: number) => {
    try {
      await RemoveFromWishlistApi(id);

      setWishlist((prev) => prev.filter((item) => item.id !== id));

      toast.success("Removed from wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  // 🔄 Move to Cart
  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      await MoveWishlistToCartApi({
        wishlist_id: item.id,
      });

      // optional: also add locally to cart UI
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
    }
  };

  // ⏳ Loading
  if (loading) {
    return <p className="text-center py-20">Loading wishlist...</p>;
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

          <h1 className="text-3xl font-heading font-bold">
            No Saved Items
          </h1>

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
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="group relative bg-card rounded-lg overflow-hidden border hover:shadow-lg transition"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />

                {/* ❌ Remove */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* ❤️ */}
                <span className="absolute top-3 left-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" fill="currentColor" />
                </span>
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
                    onClick={() => handleMoveToCart(item)}
                  >
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Move to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}