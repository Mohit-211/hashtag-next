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
import { hasAuthToken } from "@/lib/authRedirect";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";

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
    image?: string;
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
  const { refreshCart } = useCart();

  const loggedIn = useIsLoggedIn();
  // null until loaded for the current session.
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const setWishlist = (update: (prev: WishlistItem[]) => WishlistItem[]) =>
    setItems((prev) => update(prev ?? []));

  // Handlers read the token at call time (it may have changed since render).
  const isLoggedIn = () => hasAuthToken();

  // Load on login (and on page load with a stored token); clear on logout.
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    GetWishlistApi()
      .then((res) => {
        if (!cancelled) setItems(res?.data?.data || []);
      })
      .catch((error) => {
        // The axios response interceptor already toasts the failure.
        console.error(error);
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
      setItems(null);
    };
  }, [loggedIn]);

  const wishlist = loggedIn ? items ?? [] : [];
  const loading = loggedIn && items === null;
  const wishlistCount = wishlist.length;

  /** Re-sync with the server (keeps showing the current list meanwhile). */
  const fetchWishlist = async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await GetWishlistApi();
      setItems(res?.data?.data || []);
    } catch (error) {
      // The axios response interceptor already toasts the failure.
      console.error(error);
    }
  };

  const removeItem = async (id: number) => {
    if (!isLoggedIn()) return;

    try {
      await RemoveFromWishlistApi(id);

      setWishlist((prev) =>
        prev.filter((item) => item.id !== id)
      );

      toast.success("Removed from wishlist");
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    }
  };

  const addToWishlist = async ({
    product_id,
    variant_id,
    name,
    price,
    image,
  }: {
    product_id: number;
    variant_id?: number;
    name: string;
    price: number;
    image?: string;
  }) => {
    if (!isLoggedIn()) {
      toast.error("Please login first");
      return;
    }

    try {
      const exists = wishlist.some(
        (item) =>
          item.product_id === product_id &&
          item.variant_id === variant_id
      );

      if (exists) {
        toast.error("Already in wishlist");
        return;
      }

      const res = await AddToWishlistApi({
        product_id,
        variant_id,
      });

      const newItem = res?.data?.data;

      if (!newItem?.id) {
        toast.error("Invalid response");
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
          image: image || "",
        },
      ]);

      toast.success("Added to wishlist");
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);

      throw err;
    }
  };

  const moveToCart = async (
    item: WishlistItem
  ) => {
    if (!isLoggedIn()) return;

    try {
      await MoveWishlistToCartApi({
        wishlist_id: item.id,
      });

      await refreshCart();

      setWishlist((prev) =>
        prev.filter((i) => i.id !== item.id)
      );

      toast.success(
        `${item.name} moved to cart`
      );
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
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

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used within WishlistProvider"
    );
  }

  return context;
};