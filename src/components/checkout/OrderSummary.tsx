"use client";

import { ShoppingBag, Tag, Truck, Receipt } from "lucide-react";

function fmt(n: any): string {
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrderSummary({
  items,
  subtotal,
  customizationTotal,
  shippingAmount,
  total,
  selectedRate,
}: any) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-700 shadow-sm sticky top-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Order Summary</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-0.5">
        {items.map((item: any) => {
          const unitPrice = parseFloat(item.price);
          const qty = parseInt(item.quantity ?? 1, 10);
          const lineTotal = isNaN(unitPrice) || isNaN(qty) ? null : unitPrice * qty;

          return (
            <div key={item.id} className="flex items-start gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-11 w-11 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Qty {qty}</p>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">
                {lineTotal !== null ? `$${fmt(lineTotal)}` : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-slate-100 dark:bg-slate-800" />

      {/* Breakdown */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Receipt className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            Subtotal
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium tabular-nums">${fmt(subtotal)}</span>
        </div>

        {parseFloat(customizationTotal) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              Customization
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium tabular-nums">${fmt(customizationTotal)}</span>
          </div>
        )}
        {parseFloat(shippingAmount) !== 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Truck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {selectedRate?.label || selectedRate?.service_name || "Shipping"}
            </span>
            <span className={`font-medium tabular-nums ${parseFloat(shippingAmount) === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
              {parseFloat(shippingAmount) !== 0 && `$${fmt(shippingAmount)}`}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
        <span className="font-semibold text-slate-900 dark:text-white">Total</span>
        <div className="text-right">
          <p className="font-bold text-xl text-slate-900 dark:text-white tabular-nums">${fmt(total)}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">USD incl. tax</p>
        </div>
      </div>

      {/* Trust badge */}
      {/* <div className="mt-4 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
        <span className="text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          🔒 Secure checkout · 30-day returns
        </span>
      </div> */}

    </div>
  );
}
