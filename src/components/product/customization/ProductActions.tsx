"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import AddToCartModal from "@/components/common/AddToCartModal";
import { message } from "antd";
import { useRouter } from "next/navigation";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface Props {
  productId: number;
  variantId?: number;
  price: number;
  name: string;
  is_in_cart: boolean;
  is_in_wishlist: boolean;
  wishlist_id?: number | null;
  onReload?: () => void; // ✅ ADDED: callback to refresh parent component after cart/wishlist changes
}

export default function ProductActions({
  productId,
  variantId,
  price,
  name,
  is_in_cart,
  is_in_wishlist,
  wishlist_id

}: Props) {
  const router = useRouter();
  const { refreshCart } = useCart();
  const { wishlist, addToWishlist, removeItem } = useWishlist();

  const [showModal, setShowModal] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const item = wishlist.find(
    (w) =>
      w.product_id === productId &&
      (variantId ? w.variant_id === variantId : true)
  );

  const isWishlisted = !!item;

  const handleWishlist = async () => {
    if (loadingWishlist) return;

    setLoadingWishlist(true);

    try {
      if (isWishlisted && item) {
        await removeItem(item.id);
        message.success("Removed");
      } else {
        await addToWishlist({
          product_id: productId,
          variant_id: variantId,
          name,
          price,
        });
        message.success("Added ❤️");
      }
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        {is_in_cart ? (
          <Button onClick={() => router.push("/cart")} className="w-50">
            Go to Cart
          </Button>
        ) : (
          <Button onClick={() => setShowModal(true)} className="w-50">
            Add to Cart
          </Button>
        )}

        <Button onClick={handleWishlist}>
          <Heart
            className={isWishlisted ? "fill-red-500 text-red-500" : ""}
          />
        </Button>
      </div>

      <AddToCartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        productId={productId}
        variantId={variantId}
        price={price}
        name={name}
        onSuccess={refreshCart}
      />
    </>
  );
}