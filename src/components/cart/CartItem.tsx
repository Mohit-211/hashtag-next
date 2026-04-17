"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";

import { useCart } from "@/contexts/CartContext";
import CartCustomization from "./CartCustomization";

import {
  IncrementCartItemApi,
  DecrementCartItemApi,
  RemoveFromCartApi,
} from "@/api/operations/cart.api";

import { message } from "antd";

// ✅ Types
type Placement = {
  id: string;
  label: string;
  cost: number;
};

type Customization = {
  placements?: Placement[];
  uploadedImage?: string;
  uploadedFileName?: string;
  uploadFee?: number;
};

export type CartItemType = {
  id: string; // cart_id
  name: string;
  image?: string;
  basePrice: number;
  price: number;
  quantity: number;
  customization?: Customization;
};

interface Props {
  item: CartItemType;
  onRefresh: () => void;
}

export default function CartItem({ item, onRefresh }: Props) {
  const { removeItem, updateQuantity } = useCart();
  const [loading, setLoading] = useState(false);

  const placements: Placement[] = item.customization?.placements ?? [];

  const placementCost = placements.reduce(
    (sum, p) => sum + (p?.cost ?? 0),
    0
  );

  const uploadCost =
    item.customization?.uploadedImage
      ? item.customization?.uploadFee ?? 0
      : 0;

  const unitCustomization = placementCost + uploadCost;

  const itemTotal =
    (item.basePrice + unitCustomization) * item.quantity;

  // 🔽 Decrease
  const handleDecrease = async () => {
    if (item.quantity <= 1 || loading) return;

    setLoading(true);
    updateQuantity(item.id, item.quantity - 1);

    try {
      const res = await DecrementCartItemApi({ cart_id: item.id });

      message.success(
        res?.data?.message || "Quantity decreased"
      );

      onRefresh();
    } catch (err: any) {
      console.error("Decrement failed", err);

      updateQuantity(item.id, item.quantity); // rollback

      message.error(
        err?.response?.data?.message || "Failed to decrease quantity"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔼 Increase
  const handleIncrease = async () => {
    if (loading) return;

    setLoading(true);
    updateQuantity(item.id, item.quantity + 1);

    try {
      const res = await IncrementCartItemApi({ cart_id: item.id });

      message.success(
        res?.data?.message || "Quantity increased"
      );

      onRefresh();
    } catch (err: any) {
      console.error("Increment failed", err);

      updateQuantity(item.id, item.quantity);

      message.error(
        err?.response?.data?.message || "Failed to increase quantity"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Remove
  const handleRemove = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await RemoveFromCartApi(item.id);

      removeItem(item.id);

      message.success(
        res?.data?.message || "Item removed"
      );

      onRefresh();
    } catch (err: any) {
      console.error("Remove failed", err);

      message.error(
        err?.response?.data?.message || "Failed to remove item"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Top */}
      <div className="flex gap-4">
        <Image
          src={item.image || "/placeholder.png"}
          alt={item.name}
          width={96}
          height={96}
          className="w-24 h-24 rounded-lg object-cover bg-secondary shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold truncate">
                {item.name}
              </h3>

              <p className="text-sm text-muted-foreground">
                Base: ${item.basePrice}
              </p>
            </div>

            <button
              onClick={handleRemove}
              disabled={loading}
              className="hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customization */}
      <CartCustomization
        item={{
          ...item,
          customization: {
            placements,
            uploadFee: item.customization?.uploadFee ?? 0,
            uploadedImage: item.customization?.uploadedImage,
          },
        }}
        unitCustomization={unitCustomization}
      />

      {/* Bottom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Quantity */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={handleDecrease}
              disabled={loading || item.quantity <= 1}
              className="p-2 disabled:opacity-50"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>

            <button
              onClick={handleIncrease}
              disabled={loading}
              className="p-2 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Edit */}
          <Link
            href={`/product/${item.id}`}
            className="text-sm flex items-center gap-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>

        {/* Total */}
        <p className="font-bold text-lg">
          ${itemTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}