"use client";

import Link from "next/link";
import {
  Package, ChevronDown, ChevronUp,
  Clock, Truck, CheckCircle2, XCircle,
  RotateCcw, ShoppingBag, ArrowUpRight,
} from "lucide-react";
import OrderPriceSummary from "./OrderPriceSummary";
import OrderActions from "./OrderActions";
import ProxyImage from "../Proxyimage";

export interface OrderData {
  id: string | number;
  orderId?: string;
  order_number?: string;
  date?: string;
  created_at?: string;
  status?: string;
  total_amount?: number | string;
  shipping_amount?: number | string;
  payment_status?: string;
  tracking_number?: string;
  tracking_url?: string;
  preview?: {
    image?: string;
    product_name?: string;
    product_id?: string | number;
    total_items?: number;
  };
  [key: string]: any;
}

interface OrderCardProps {
  order: OrderData;
  expanded: boolean;
  toggleExpand: (orderId: string) => void;
}

const statusConfig: Record<string, { style: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: {
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  PENDING: {
    style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: <RotateCcw className="h-3 w-3" />,
  },
  PROCESSING: {
    style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    icon: <RotateCcw className="h-3 w-3" />,
  },
  SHIPPED: {
    style: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
    icon: <Truck className="h-3 w-3" />,
  },
  OUT_FOR_DELIVERY: {
    style: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    style: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function decodeHtml(str: string) {
  return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export default function OrderCard({ order, expanded, toggleExpand }: OrderCardProps) {
  const cardKey = String(order?.orderId || order?.id);

  const rawDate = order?.created_at || order?.date;
  const orderDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const orderStatus = (order?.status || "PENDING").toUpperCase();
  const config = statusConfig[orderStatus] || {
    style: "bg-secondary text-foreground border border-border",
    icon: <Clock className="h-3 w-3" />,
  };

  const productName = order?.preview?.product_name
    ? decodeHtml(order.preview.product_name)
    : null;

  const totalItems = order?.preview?.total_items || 0;

  // swap order?.preview?.product_id with your real field once confirmed
  const productId = order?.preview?.product_id || order?.id;

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden transition-shadow duration-200 ${
        expanded ? "shadow-md" : "shadow-sm hover:shadow-md"
      }`}
    >
      {/* ── Header / toggle ── */}
      <button
        type="button"
        onClick={() => toggleExpand(cardKey)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group"
      >
        {/* Preview image */}
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted ring-1 ring-border shrink-0 flex items-center justify-center">
          {order?.preview?.image ? (
            <ProxyImage
              src={order.preview.image}
              alt={productName || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">
              #{order?.order_number || cardKey}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.style}`}
            >
              {config.icon}
              {orderStatus.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{orderDate}</p>
          </div>

          {productName && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {productName}
              {totalItems > 1 && (
                <span className="ml-1 text-muted-foreground/70">
                  +{totalItems - 1} more
                </span>
              )}
            </p>
          )}
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-foreground">
            ${Number(order?.total_amount || 0).toFixed(2)}
          </span>
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center transition-colors group-hover:bg-muted/80">
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* ── Expanded ── */}
      {expanded && (
        <div className="border-t bg-muted/20 px-5 py-4 space-y-5">

          {/* Preview item card */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Items ({totalItems})
            </p>

            {order?.preview ? (
              <div className="space-y-2">
                {/* Clickable product row → /product/[id] */}
                <Link
                  href={`/product/${productId}`}
                  className="group/item flex items-center gap-3 rounded-xl border bg-card p-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                    {order.preview.image ? (
                      <ProxyImage
                        src={order.preview.image}
                        alt={productName || "Product"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Name + count */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover/item:text-primary transition-colors">
                      {productName || "Product"}
                    </p>
                    {totalItems > 1 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        +{totalItems - 1} more item{totalItems - 1 > 1 ? "s" : ""} in this order
                      </p>
                    )}
                  </div>

                  {/* View Product link */}
                  <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover/item:opacity-100 transition-opacity">
                    View Product
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                <ShoppingBag className="h-7 w-7 opacity-30" />
                <p className="text-xs">No item preview available</p>
              </div>
            )}
          </div>

          <OrderPriceSummary
            order={{
              subtotal: Number(order?.total_amount || 0),
              customizationTotal: 0,
              shippingCost: Number(order?.shipping_amount || 0),
              tax: 0,
              total: Number(order?.total_amount || 0),
            }}
          />

          {/* <OrderActions order={order as any} /> */}
        </div>
      )}
    </div>
  );
}