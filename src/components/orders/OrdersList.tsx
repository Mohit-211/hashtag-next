"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import OrderCard, { OrderData } from "@/components/orders/OrderCard";
import { GetOrderDetailApi, CancelOrderApi } from "@/api/operations/order.api";
import { toast } from "sonner"; // swap for whatever toast lib you use, or remove

interface OrdersListProps {
  orders: OrderData[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const [localOrders, setLocalOrders] = useState<OrderData[]>(orders);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderDetails, setOrderDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [cancellingOrders, setCancellingOrders] = useState<Record<string, boolean>>({});

  // Keep local copy in sync if parent refetches/passes new orders
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const toggleExpand = async (cardKey: string, realId: string | number) => {
    const isCurrentlyExpanded = expandedOrders[cardKey];

    if (isCurrentlyExpanded) {
      setExpandedOrders((prev) => ({ ...prev, [cardKey]: false }));
      return;
    }

    setExpandedOrders((prev) => ({ ...prev, [cardKey]: true }));

    if (!orderDetails[cardKey]) {
      try {
        setLoadingDetails((prev) => ({ ...prev, [cardKey]: true }));
        const res = await GetOrderDetailApi(realId);
        const detail = res?.data?.data ?? res?.data ?? null;
        if (detail) {
          setOrderDetails((prev) => ({ ...prev, [cardKey]: detail }));
        }
      } catch (err) {
        console.error("Failed to fetch order detail:", err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [cardKey]: false }));
      }
    }
  };

  const handleCancelOrder = async (cardKey: string, realId: string | number) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      setCancellingOrders((prev) => ({ ...prev, [cardKey]: true }));
      await CancelOrderApi(realId);

      // Reflect cancellation locally so UI updates immediately
      setLocalOrders((prev) =>
        prev.map((order) => {
          const key = String(order?.orderId || order?.id);
          return key === cardKey ? { ...order, status: "Cancelled" } : order;
        })
      );

      toast?.success?.("Order cancelled successfully");
    } catch (err: any) {
      console.error("Failed to cancel order:", err);
      toast?.error?.(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancellingOrders((prev) => ({ ...prev, [cardKey]: false }));
    }
  };

  if (!localOrders?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground font-bold">0</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">No orders yet</p>
          <p className="text-xs text-muted-foreground">
            Your orders will appear here once placed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {localOrders.map((order) => {
        const cardKey = String(order?.orderId || order?.id);
        const realId = order?.id ?? order?.orderId;
        const status = String(order?.status || "").toLowerCase();
        const isCancellable = !["cancelled", "delivered", "completed"].includes(status);

        return (
          <OrderCard
            key={cardKey}
            order={order}
            expanded={expandedOrders[cardKey] ?? false}
            toggleExpand={(key) => toggleExpand(key, realId)}
            detail={orderDetails[cardKey] ?? null}
            loadingDetail={loadingDetails[cardKey] ?? false}
            onCancel={isCancellable ? () => handleCancelOrder(cardKey, realId) : undefined}
            cancelling={cancellingOrders[cardKey] ?? false}
          />
        );
      })}
    </div>
  );
}