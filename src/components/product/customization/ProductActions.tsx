"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import AddToCartModal from "@/components/common/AddToCartModal";
import {
  AddToWishlistApi,
  RemoveFromWishlistApi,
  GetWishlistApi,
} from "@/api/operations/wishlist.api";
import { message } from "antd";

interface Props {
  productId: number;
  variantId: number;
  price: number;
  name: string;
}

export default function ProductActions({
  productId,
  variantId,
  price,
  name,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);

  // ✅ Check if already wishlisted
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await GetWishlistApi();
        const items = res?.data?.data || [];

        const found = items.find(
          (item: any) =>
            item.product_id === productId &&
            item.variant_id === variantId
        );

        if (found) {
          setIsWishlisted(true);
          setWishlistId(found.id);
        }
      } catch (err) {
        console.error("Wishlist fetch error", err);
      }
    };

    if (productId && variantId) {
      checkWishlist();
    }
  }, [productId, variantId]);

  // ✅ Toggle Wishlist
  const handleWishlist = async () => {
    try {
      setLoadingWishlist(true);

      if (isWishlisted && wishlistId) {
        await RemoveFromWishlistApi(wishlistId);
        message.success("Removed from wishlist");
        setIsWishlisted(false);
        setWishlistId(null);
      } else {
        const res = await AddToWishlistApi({
          product_id: productId,
          variant_id: variantId,
        });

        const id = res?.data?.data?.id;

        setWishlistId(id);
        setIsWishlisted(true);

        message.success("Added to wishlist ❤️");
      }
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
        {/* 🛒 ADD TO CART */}
        <Button
          variant="hero"
          className="flex-1 gap-2"
          onClick={() => setShowModal(true)}
        >
          <ShoppingBag className="h-5 w-5" />
          Add to Cart
        </Button>

        {/* ❤️ WISHLIST */}
        <Button
          variant="outline"
          className="gap-2"
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

      {/* 🛒 CART MODAL */}
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