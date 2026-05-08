"use client";

import { Package, ChevronDown, ChevronUp } from "lucide-react";
import OrderItems from "./OrderItems";
import OrderPriceSummary from "./OrderPriceSummary";
import OrderActions from "./OrderActions";

interface OrderItem {
  id?: string | number;
  [key: string]: any;
}

export interface OrderData {
  id: string | number;
  orderId: string;
  date?: string;
  status?: string;
  total?: number | string;
  items?: OrderItem[];
  [key: string]: any;
}

interface OrderCardProps {
  order: OrderData;
  expanded: boolean;
  toggleExpand: (orderId: string) => void;
}

const statusStyles: Record<string, string> = {
  Processing: "bg-secondary text-muted-foreground",
  Shipped: "bg-secondary text-foreground",
  "Out for Delivery": "bg-primary/20 text-primary-foreground",
  Delivered: "bg-primary/10 text-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export default function OrderCard({ order, expanded, toggleExpand }: OrderCardProps) {
  // Use a single consistent key — prefer orderId, fall back to id
  const cardKey = String(order?.orderId || order?.id);

  const orderDate = order?.date
    ? new Date(order.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const orderStatus = order?.status || "Processing";

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleExpand(cardKey)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex items-center justify-center shrink-0">
          {order?.preview?.image ? (
            <img
              src={order.preview.image}
              alt={order?.preview?.product_name || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate">#{order?.order_number}</p>

            <span
              className={`text-[10px] px-2 py-0.5 rounded ${
                statusStyles[
                  orderStatus?.charAt(0) + orderStatus?.slice(1).toLowerCase()
                ] || "bg-secondary text-foreground"
              }`}
            >
              {orderStatus}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{orderDate}</p>

          {order?.preview?.product_name && (
            <p className="text-sm truncate mt-1">{order.preview.product_name}</p>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            {order?.preview?.total_items || 0} item
            {(order?.preview?.total_items || 0) > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold">
            ${Number(order?.total_amount || 0).toFixed(2)}
          </span>

          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t p-5 space-y-5">
          <OrderItems
            items={(order?.items || []).map((item, index) => ({
              id: item?.id || index,
              ...item,
            }))}
          />

          <OrderPriceSummary
            order={{
              subtotal: Number(order?.total_amount || 0),
              customizationTotal: 0,
              shippingCost: Number(order?.shipping_amount || 0),
              tax: 0,
              total: Number(order?.total_amount || 0),
            }}
          />

          <OrderActions order={order as any} />
        </div>
      )}
    </div>
  );
}