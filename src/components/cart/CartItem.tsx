"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { message } from "antd";

import {
  IncrementCartItemApi,
  DecrementCartItemApi,
  RemoveFromCartApi,
} from "@/api/operations/cart.api";

import ProxyImage from "../Proxyimage";
import CartCustomization from "./CartCustomization";

// TYPES
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
  // price: number;
  quantity: number;
  customization?: Customization;
};

interface Props {
  item: CartItemType;
  onRefresh: () => void;
}

export default function CartItem({ item, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);

  const placements = item.customization?.placements ?? [];

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

    try {
      setLoading(true);

      await DecrementCartItemApi({ cart_id: item.id });

      message.success("Quantity decreased");

      onRefresh(); // 🔥 sync with API
    } catch (err: any) {
      console.error(err);
      message.error("Failed to decrease quantity");
    } finally {
      setLoading(false);
    }
  };

  // 🔼 Increase
  const handleIncrease = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await IncrementCartItemApi({ cart_id: item.id });

      message.success("Quantity increased");

      onRefresh(); // 🔥 sync
    } catch (err: any) {
      console.error(err);
      message.error("Failed to increase quantity");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Remove
  const handleRemove = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await RemoveFromCartApi(item.id);

      message.success("Item removed");

      onRefresh(); // 🔥 sync
    } catch (err: any) {
      console.error(err);
      message.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      
      {/* Top */}
      <div className="flex gap-4">
        <ProxyImage
          src={item?.image || "/placeholder.png"}
          alt={item?.name}
          width={96}
          height={96}
          className="w-24 h-24 rounded-lg object-cover bg-secondary shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">
                {item.name}
              </h3>

              <p className="text-sm text-muted-foreground">
                Base: ₹{item.basePrice}
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
              className="p-2"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>

            <button
              onClick={handleIncrease}
              disabled={loading}
              className="p-2"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Total */}
        <p className="font-bold text-lg">
          ₹{itemTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}