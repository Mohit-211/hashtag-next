"use client";
import { Check } from "lucide-react";
import type { ShippingRate } from "./CheckoutLayout";

interface Props {
  rate: ShippingRate;
  selected: boolean;
  onSelect: () => void;
}

export default function ShippingRateCard({ rate, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-[3px]
        ${selected
          ? "bg-primary-soft border border-primary-hover border-l-primary"
          : "bg-muted border border-border border-l-transparent hover:border-input hover:bg-card"
        }`}
    >
      <div className={`w-5 h-5 flex items-center justify-center shrink-0 rounded-sm border transition-all
        ${selected ? "bg-foreground border-foreground" : "border-input"}`}>
        {selected && <Check className="h-3 w-3 text-background stroke-[3]" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {rate.carrier_name || rate.label} — {rate.service_name || rate.label}
        </p>
        
      </div>
      <span className="font-bold text-xl text-foreground">
        ${rate.price.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">
          est.
        </span>
      </span>
    </div>
  );
}