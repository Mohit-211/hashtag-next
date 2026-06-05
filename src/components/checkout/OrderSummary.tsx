"use client";
import { ShoppingBag, Tag, Truck, Receipt } from "lucide-react";

function fmt(n: any): string {
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrderSummary({
  items, subtotal, customizationTotal, shippingAmount, total, selectedRate,
}: any) {
  return (
    <div className="bg-white border border-[#E0DFDB] border-t-[3px] border-t-[#F5D800] sticky top-6">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-[#1A1A1A] border-b border-[#2C2C2C]">
        <div className="w-8 h-8 bg-[#F5D800] flex items-center justify-center shrink-0">
          <ShoppingBag className="h-4 w-4 text-[#1A1A1A]" strokeWidth={2} />
        </div>
        <h2 className="font-condensed font-bold text-lg uppercase tracking-wide text-white">
          Order Summary
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-3">

        {/* Items */}
        <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto">
          {items.map((item: any) => {
            const unit = parseFloat(item.price);
            const qty  = parseInt(item.quantity ?? 1, 10);
            const line = isNaN(unit) || isNaN(qty) ? null : unit * qty;
            return (
              <div key={item.id} className="flex items-start gap-3">
                {item.image
                  ? <img src={item.image} alt={item.name} className="h-10 w-10 object-cover border border-[#E0DFDB] shrink-0" />
                  : <div className="h-10 w-10 bg-[#F5F4F0] border border-[#E0DFDB] flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-[#CDCCC8]" strokeWidth={1.5} />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
                  <p className="text-xs text-[#9A9A9A] mt-0.5">Qty {qty}</p>
                </div>
                <p className="font-condensed font-bold text-sm text-[#1A1A1A] shrink-0">
                  {line !== null ? `$${fmt(line)}` : "—"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#E0DFDB]" />

        {/* Breakdown */}
        <div className="flex flex-col gap-2">
          {[
            { icon: Receipt, label: "Subtotal", value: `$${fmt(subtotal)}` },
            ...(parseFloat(customizationTotal) > 0
              ? [{ icon: Tag, label: "Customization", value: `$${fmt(customizationTotal)}` }]
              : []),
            ...(parseFloat(shippingAmount) !== 0
              ? [{ icon: Truck, label: selectedRate?.label || "Shipping", value: `$${fmt(shippingAmount)}` }]
              : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#6B6B6B]">
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                {label}
              </span>
              <span className="font-medium text-[#2C2C2C] tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t-2 border-[#1A1A1A] pt-3">
          <span className="font-condensed font-bold text-sm uppercase tracking-widest text-[#1A1A1A]">
            Total
          </span>
          <div className="text-right">
            <p className="font-condensed font-bold text-3xl text-[#1A1A1A] tabular-nums">
              ${fmt(total)}
            </p>
            <p className="text-[10px] text-[#9A9A9A] uppercase tracking-wider mt-0.5">
              USD incl. tax
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
}