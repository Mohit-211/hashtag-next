"use client";
import { ShoppingBag, Truck, Receipt, Percent } from "lucide-react";
import ProxyImage from "../ProxyImage";
import type { CartItem } from "@/contexts/CartContext";
import type { ShippingRate } from "./CheckoutLayout";

function fmt(n: number | string | null | undefined): string {
  const num = parseFloat(String(n));
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrderSummary({
  items,
  subtotal,
  taxAmount,
  taxRate,
  shippingAmount,
  total,
  selectedRate,
}: {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  shippingAmount: number;
  total: number;
  selectedRate: ShippingRate | null;
}) {
  return (
    <div className="bg-card border border-border border-t-[3px] border-t-primary sticky top-24">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-foreground border-b border-foreground">
        <div className="w-8 h-8 bg-primary flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-foreground" strokeWidth={2} />
        </div>
        <h2 className="font-bold text-lg uppercase tracking-wide text-background">
          Order Summary
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-3">

        {/* Items */}
        <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto">
          {items.map((item) => {
            const qty  = Math.trunc(Number(item.quantity ?? 1));

            return (
              <div key={item.cart_id} className="flex items-start gap-3">
                <div className="relative h-10 w-10 shrink-0">
                  <div className="h-full w-full overflow-hidden bg-muted border border-border flex items-center justify-center">
                    {item.image ? (
                      <ProxyImage
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="h-full w-full"
                      />
                    ) : (
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    )}
                  </div>

                  {item.logo_image && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 overflow-hidden border border-card shadow-sm bg-card">
                      <ProxyImage
                        src={item.logo_image}
                        alt="Logo"
                        width={16}
                        height={16}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Qty {qty}</p>
                </div>
                <p className="font-bold text-sm text-foreground shrink-0">
                  ${fmt(item.total_price)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border" />

        {/* Breakdown */}
        <div className="flex flex-col gap-2">
          {[
            { icon: Receipt, label: "Subtotal", value: `$${fmt(subtotal)}` },
            ...(taxAmount !== undefined && taxAmount !== null
              ? [
                  {
                    icon: Percent,
                    label: `Tax${taxRate ? ` (${fmt(taxRate)}%)` : ""}`,
                    value: `$${fmt(taxAmount)}`,
                  },
                ]
              : []),
            ...(Number(shippingAmount) !== 0
              ? [{ icon: Truck, label: selectedRate?.label || "Shipping", value: `$${fmt(shippingAmount)}` }]
              : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                {label}
              </span>
              <span className="font-medium text-foreground tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t-2 border-foreground pt-3">
          <span className="font-bold text-sm uppercase tracking-widest text-foreground">
            Total
          </span>
          <div className="text-right">
            <p className="font-bold text-3xl text-foreground tabular-nums">
              ${fmt(total)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              USD incl. tax
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}