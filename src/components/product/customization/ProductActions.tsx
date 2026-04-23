"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import AddToCartModal from "@/components/common/AddToCartModal";
import {
  AddToWishlistApi,
  RemoveFromWishlistApi,
} from "@/api/operations/wishlist.api";
import { message } from "antd";
import { useRouter } from "next/navigation";

interface Props {
  productId: number;
  variantId?: number;
  price: number;
  name: string;
  is_in_cart: boolean;
  is_in_wishlist: boolean;
  wishlist_id?: number | null;
}

export default function ProductActions({
  productId,
  variantId,
  price,
  name,
  is_in_cart,
  is_in_wishlist,
  wishlist_id,
}: Props) {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState<boolean>(is_in_wishlist);
  const [wishlistId, setWishlistId] = useState<number | null>(
    wishlist_id ?? null
  );

  // ✅ Sync when props change
  useEffect(() => {
    setIsWishlisted(is_in_wishlist);
    setWishlistId(wishlist_id ?? null);
  }, [is_in_wishlist, wishlist_id]);

  // ❤️ Toggle Wishlist
  const handleWishlist = async () => {
    if (loadingWishlist) return;

    try {
      setLoadingWishlist(true);

      // ❌ REMOVE
      if (isWishlisted) {
        if (!wishlistId) {
          message.error("Wishlist ID missing");
          return;
        }

        await RemoveFromWishlistApi(wishlistId);

        setIsWishlisted(false);
        setWishlistId(null);

        message.success("Removed from wishlist");
        return;
      }

      // ✅ ADD (safe variantId handling)
      const payload: {
        product_id: number;
        variant_id?: number;
      } = {
        product_id: productId,
      };

      if (variantId !== undefined) {
        payload.variant_id = variantId;
      }

      const res = await AddToWishlistApi(payload);

      const id: number | undefined = res?.data?.data?.id;

      if (!id) {
        message.error("Invalid response from server");
        return;
      }

      setWishlistId(id);
      setIsWishlisted(true);

      message.success("Added to wishlist ❤️");
    } catch (error) {
      console.error(error);
      message.error("Something went wrong");
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 🛒 CART */}
        {is_in_cart ? (
          <Button
            variant="hero"
            className="flex-1 gap-2"
            onClick={() => router.push("/cart")}
          >
            <ShoppingBag className="h-5 w-5" />
            Go to Cart
          </Button>
        ) : (
          <Button
            variant="hero"
            className="flex-1 gap-2"
            onClick={() => setShowModal(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            Add to Cart
          </Button>
        )}

        {/* ❤️ WISHLIST */}
        <Button
          variant="outline"
          onClick={handleWishlist}
          disabled={loadingWishlist}
        >
          <Heart
            className={`h-5 w-5 transition ${
              isWishlisted ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </Button>
      </div>

      {/* 🛒 MODAL */}
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