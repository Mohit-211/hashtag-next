"use client";

import Link from "next/link";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShoppingBag,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import OrderPriceSummary from "./OrderPriceSummary";
import ProxyImage from "../Proxyimage";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface OrderData {
  id: string | number;
  orderId?: string;
  order_number?: string;
  date?: string;
  created_at?: string;
  status?: string;
  total_amount?: number | string;
  subtotal_amount?: number | string;
  shipping_amount?: number | string;
  payment_status?: string;
  shipment_status?: string;
  tracking_number?: string;
  tracking_url?: string;

  preview?: {
    original_image?: string;
    customized_image?: string;
    product_name?: string;
    product_id?: string | number;
    total_items?: number;
    print_method?: string;

    customization_summary?: Array<{
      type: string;
      location: string;
      quantity: number;
      price_per_item: number;
      total: number;
    }>;
  };

  [key: string]: any;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  subtotal_amount: number;
  shipping_amount: string | number;
  total_amount: string | number;
  currency: string;
  status: string;
  payment_status: string;
  shipment_status: string;
  carrier?: string;
  service_code?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;

  address?: {
    name: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };

  items: Array<{
    product_id: number;
    product_name: string;
    variant_id: number;
    sku: string;
    color: string;
    size: string;
    original_image: string;
    customized_image: string;
    price: number;
    quantity: number;
    total: number;

    customization_config?: {
      print_method: string;
      locations: Array<{ id: string }>;
      quantity: number;
      custom_text: string;
    };

    pricing_breakdown?: {
      actual_product_price: number;
      supplier_markup: number;
      final_product_price: number;
      customization_price: number;
      setup_fee: number;
      final_price_per_item: number;
      final_total: number;
    };
  }>;
}

interface OrderCardProps {
  order: OrderData;
  expanded: boolean;
  toggleExpand: (orderId: string) => void;
  detail?: OrderDetail | null;
  loadingDetail?: boolean;
}

// ─────────────────────────────────────────────
// Status Config
// ─────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    pill: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  PENDING_PAYMENT: {
    pill:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    dot: "bg-amber-400",
    icon: <Clock className="h-3 w-3" />,
  },

  PENDING: {
    pill:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20",
    dot: "bg-yellow-400",
    icon: <RotateCcw className="h-3 w-3" />,
  },

  PROCESSING: {
    pill:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    dot: "bg-blue-400",
    icon: <RotateCcw className="h-3 w-3 animate-spin" />,
  },

  SHIPPED: {
    pill:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
    dot: "bg-violet-400",
    icon: <Truck className="h-3 w-3" />,
  },

  OUT_FOR_DELIVERY: {
    pill:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
    dot: "bg-indigo-400",
    icon: <Truck className="h-3 w-3" />,
  },

  DELIVERED: {
    pill:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },

  SUCCESS: {
    pill:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20",
    dot: "bg-green-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },

  CANCELLED: {
    pill:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    dot: "bg-red-400",
    icon: <XCircle className="h-3 w-3" />,
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function decodeHtml(str: string) {
  return str.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number(code))
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70 mb-3">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function OrderCard({
  order,
  expanded,
  toggleExpand,
  detail,
  loadingDetail,
}: OrderCardProps) {
  const cardKey = String(order?.orderId || order?.id);

  const rawDate = order?.created_at || order?.date;

  const orderDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "N/A";

  const orderStatus = (
    order?.payment_status ||
    order?.status ||
    "PENDING"
  ).toUpperCase();

  const config = statusConfig[orderStatus] || {
    pill: "bg-secondary text-foreground border-border",
    dot: "bg-muted-foreground",
    icon: <Clock className="h-3 w-3" />,
  };

  const productName = order?.preview?.product_name
    ? decodeHtml(order.preview.product_name)
    : null;

  // ✅ FIXED TOTAL ITEMS
  const totalItems =
    order?.preview?.total_items ||
    order?.preview?.customization_summary?.reduce(
      (acc: number, item: any) => acc + (item.quantity || 0),
      0
    ) ||
    0;

  const customizationTotal =
    detail?.items?.reduce(
      (acc, item) =>
        acc +
        (item.pricing_breakdown?.customization_price ?? 0) *
        item.quantity,
      0
    ) ?? 0;
  console.log("Customization Total:", detail);
  return (
    <div
      className={`
        bg-card border border-border/70 rounded-2xl overflow-hidden
        transition-all duration-300
        ${expanded
          ? "shadow-lg shadow-black/5 dark:shadow-black/20 border-border"
          : "shadow-sm hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/15 hover:border-border"
        }
      `}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => toggleExpand(cardKey)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group transition-colors hover:bg-muted/20"
      >
        {/* Product Preview */}
        <div className="relative shrink-0">
          <div className="relative w-[56px] h-[56px]">
            <div className="w-full h-full rounded-xl overflow-hidden bg-muted ring-1 ring-border flex items-center justify-center">
              {order?.preview?.original_image ? (
                <ProxyImage
                  src={order.preview.original_image}
                  alt={productName || "Product"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : order?.preview?.customized_image ? (
                <ProxyImage
                  src={order.preview.customized_image}
                  alt={productName || "Product"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>

            {/* Customized Overlay */}
            {order?.preview?.customized_image && (
              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-md overflow-hidden border-2 border-background shadow-md bg-card">
                <ProxyImage
                  src={order.preview.customized_image}
                  alt="Customized"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Quantity Badge */}
            {totalItems > 1 && (
              <span className="absolute -top-1 -left-1 h-4 min-w-4 px-1 bg-foreground text-background rounded-full text-[9px] font-bold flex items-center justify-center z-10">
                {totalItems}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-foreground tracking-tight">
              #{order?.order_number || cardKey}
            </p>

            <span
              className={`
                inline-flex items-center gap-1 text-[10px]
                font-semibold px-2 py-0.5 rounded-full border
                ${config.pill}
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
              />
              {orderStatus.replace(/_/g, " ")}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            {orderDate}
          </p>

          {productName && (
            <p className="text-[11px] text-muted-foreground/80 truncate leading-relaxed">
              {productName}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {totalItems > 0 && (
              <span className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {totalItems}
                </span>{" "}
                items
              </span>
            )}

            {order?.preview?.print_method && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />

                <span className="text-[10px] bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold px-2 py-0.5 rounded-full">
                  {order.preview.print_method}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground tabular-nums tracking-tight">
              ${Number(order?.total_amount || 0).toFixed(2)}
            </p>
          </div>

          <div
            className={`
              h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200
              ${expanded
                ? "bg-foreground/10"
                : "bg-muted group-hover:bg-muted/80"
              }
            `}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border/60 px-5 py-5 bg-muted/10">
          {loadingDetail && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs">
                Loading order details...
              </span>
            </div>
          )}

          {!loadingDetail && !detail && (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">
                Could not load order details
              </p>
            </div>
          )}

          {!loadingDetail && detail && (
            <>
              {/* Items */}
              <section>
                <SectionLabel>
                  Items ({detail.items.length})
                </SectionLabel>

                <div className="space-y-3">
                  {detail.items.map((item, idx) => {
                    const name = decodeHtml(item.product_name);

                    const displayImage =
                      item.customized_image ||
                      item.original_image;

                    return (
                      <div
                        key={`${item.product_id}-${idx}`}
                        className="rounded-xl border border-border/70 bg-card overflow-hidden"
                      >
                        <Link
                          href={`/product/${item.product_id}`}
                          className="group/item flex items-start gap-3 p-3.5 hover:bg-muted/20 transition-colors"
                        >
                          <div className="relative w-[52px] h-[52px] shrink-0">
                            <div className="w-full h-full rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                              {displayImage ? (
                                <ProxyImage
                                  src={displayImage}
                                  alt={name}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
                              {name}
                            </p>

                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {item.color && (
                                <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/60">
                                  {item.color}
                                </span>
                              )}

                              {item.size && (
                                <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/60">
                                  {item.size}
                                </span>
                              )}

                              <span className="text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/60">
                                Qty: {item.quantity}
                              </span>
                            </div>

                            {item.customization_config && (
                              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/8 text-primary border border-primary/15 px-1.5 py-0.5 rounded-full font-semibold">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  {
                                    item.customization_config
                                      .print_method
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground">
                              ${item.total.toFixed(2)}
                            </span>

                            <span className="text-[11px] text-muted-foreground">
                              ${item.price.toFixed(2)} ×{" "}
                              {item.quantity}
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Payment */}
              <section className="rounded-xl border border-border/70 bg-card px-4 py-3 mt-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <span className="text-xs font-medium text-muted-foreground">
                    Payment
                  </span>

                  <span
                    className={`ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full border ${detail.payment_status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {detail.payment_status}
                  </span>
                </div>
              </section>

              {/* Summary */}
              <div className="mt-5">
                <OrderPriceSummary
                  order={{
                    subtotal: Number(
                      detail.subtotal_amount || 0
                    ),
                    customizationTotal,
                    shippingCost: Number(
                      detail.shipping_amount || 0
                    ),
                    tax: 0,
                    total: Number(detail.total_amount || 0),
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}