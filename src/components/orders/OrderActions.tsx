// components/orders/OrderActions.tsx

"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { GetOrderDetailApi } from "@/api/operations/order.api";
import { AddToCartApi } from "@/api/operations/cart.api";
import { calculateVariantTotal } from "@/components/product/customization/pricing";

interface OrderActionsProps {
  order: { orderId: string; [key: string]: any };
}

export default function OrderActions({ order }: OrderActionsProps) {
  const { refreshCart } = useCart();
  const [reordering, setReordering] = useState(false);

  const reorder = async () => {
    if (reordering) return;

    setReordering(true);
    try {
      const res = await GetOrderDetailApi(order.orderId);
      const detail = res?.data?.data ?? res?.data;
      const items: any[] = detail?.items ?? [];

      if (!items.length) {
        toast.error("No items available to reorder");
        return;
      }

      let addedCount = 0;
      for (const item of items) {
        try {
          const unitPrice =
            item.pricing_breakdown?.final_product_price ?? item.price ?? 0;
          const decorationUnitPrice =
            item.pricing_breakdown?.customization_price ?? 0;
          const linePricing = calculateVariantTotal({
            productPrice: unitPrice,
            decorationPrice: decorationUnitPrice,
            quantity: item.quantity,
          });

          // Same schema AddToCartModal.tsx sends for a configured variant —
          // that's the only shape verified against the real backend, so
          // reorder maps the past order's line onto it rather than
          // inventing a new one.
          const customizationPayload = [
            {
              product_id: item.product_id,
              ...(item.customization_config?.print_method
                ? { print_method: item.customization_config.print_method }
                : {}),
              ...(item.customization_config?.locations
                ? { locations: item.customization_config.locations }
                : {}),
              customizations: [
                {
                  variant_id: item.variant_id,
                  color: item.color,
                  size: item.size,
                  quantity: item.quantity,
                  product_price: unitPrice,
                  decoration_price: decorationUnitPrice,
                  total_price: linePricing.total,
                },
              ],
              sizes: [
                {
                  variant_id: item.variant_id,
                  size_id: null,
                  quantity: item.quantity,
                },
              ],
            },
          ];

          const formData = new FormData();
          formData.append("product_id", String(item.product_id));
          formData.append(
            "customization",
            JSON.stringify(customizationPayload)
          );

          await AddToCartApi(formData);
          addedCount += 1;
        } catch (err) {
          console.error(`Failed to reorder product ${item.product_id}:`, err);
        }
      }

      if (addedCount === 0) {
        toast.error("Failed to add items to cart");
        return;
      }

      await refreshCart();
      toast.success(
        addedCount === items.length
          ? `Items from order #${order.orderId} added to cart`
          : `${addedCount} of ${items.length} items added to cart`
      );
    } catch (err) {
      console.error("Failed to reorder:", err);
      toast.error("Failed to reorder");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={reorder}
        disabled={reordering}
        className="gap-1.5"
      >
        {reordering ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        Reorder
      </Button>
    </div>
  );
}
