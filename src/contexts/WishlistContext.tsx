"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  GetWishlistApi,
  RemoveFromWishlistApi,
  MoveWishlistToCartApi,
  AddToWishlistApi,
} from "@/api/operations/wishlist.api";

import { toast } from "sonner";

import { useCart } from "./CartContext";

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  image: string;
  price: number;
  variant_id?: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  wishlistCount: number;

  fetchWishlist: () => Promise<void>;

  removeItem: (id: number) => Promise<void>;

  moveToCart: (
    item: WishlistItem
  ) => Promise<void>;

  addToWishlist: (data: {
    product_id: number;
    variant_id?: number;
    name: string;
    price: number;
  }) => Promise<void>;
}

const WishlistContext =
  createContext<WishlistContextType | null>(
    null
  );

export const WishlistProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { addItem } = useCart();

  const [wishlist, setWishlist] = useState<
    WishlistItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  // ✅ SINGLE TOKEN CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  // ✅ Wishlist Count
  const wishlistCount = wishlist.length;

  // 🔄 Fetch Wishlist
  const fetchWishlist = async () => {
    // 🚫 No token
    if (!isLoggedIn) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await GetWishlistApi();

      setWishlist(res?.data?.data || []);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load wishlist");

      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial Fetch
  useEffect(() => {
    fetchWishlist();
  }, []);

  // ❌ Remove
  const removeItem = async (id: number) => {
    // 🚫 No token
    if (!isLoggedIn) return;

    try {
      await RemoveFromWishlistApi(id);

      setWishlist((prev) =>
        prev.filter((item) => item.id !== id)
      );

      toast.success("Removed from wishlist");
    } catch (err) {
      console.error(err);

      toast.error("Failed to remove item");
    }
  };

  // ❤️ Add
  const addToWishlist = async ({
    product_id,
    variant_id,
    name,
    price,
  }: {
    product_id: number;
    variant_id?: number;
    name: string;
    price: number;
  }) => {
    // 🚫 Guest user
    if (!isLoggedIn) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await AddToWishlistApi({
        product_id,
        variant_id,
      });

      const newItem = res?.data?.data;

      if (!newItem?.id) {
        toast.error("Invalid response");
        return;
      }

      // ✅ Prevent duplicate
      const exists = wishlist.some(
        (item) =>
          item.product_id === product_id &&
          item.variant_id === variant_id
      );

      if (exists) {
        toast.error("Already in wishlist");
        return;
      }

      setWishlist((prev) => [
        ...prev,
        {
          id: newItem.id,
          product_id,
          variant_id,
          name,
          price,
          image: newItem.image || "",
        },
      ]);

      toast.success("Added to wishlist");
    } catch (err) {
      console.error(err);

      toast.error("Failed to add");

      throw err;
    }
  };

  // 🛒 Move To Cart
  const moveToCart = async (
    item: WishlistItem
  ) => {
    // 🚫 No token
    if (!isLoggedIn) return;

    try {
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
          uploadFee: 30,
          uploadedImage: undefined,
        },
      });

      setWishlist((prev) =>
        prev.filter((i) => i.id !== item.id)
      );

      toast.success(
        `${item.name} moved to cart`
      );
    } catch (err) {
      console.error(err);

      toast.error("Failed to move item");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        wishlistCount,
        fetchWishlist,
        removeItem,
        moveToCart,
        addToWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// ✅ Hook
export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used within WishlistProvider"
    );
  }

  return context;
};