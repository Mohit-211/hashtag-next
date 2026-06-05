"use client";
import { Check } from "lucide-react";

interface Props {
  rate: any;
  selected: boolean;
  onSelect: () => void;
}

export default function ShippingRateCard({ rate, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-[3px]
        ${selected
          ? "bg-[#FFFEF5] border border-[#E8CE00] border-l-[#F5D800]"
          : "bg-[#FAFAFA] border border-[#E0DFDB] border-l-transparent hover:border-[#CDCCC8] hover:bg-white"
        }`}
    >
      <div className={`w-5 h-5 flex items-center justify-center shrink-0 rounded-sm border transition-all
        ${selected ? "bg-[#1A1A1A] border-[#1A1A1A]" : "border-[#CDCCC8]"}`}>
        {selected && <Check className="h-3 w-3 text-white stroke-[3]" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1A1A1A]">
          {rate.carrier_name || rate.label} — {rate.service_name || rate.label}
        </p>
        
      </div>
      <span className="font-condensed font-bold text-xl text-[#1A1A1A]">
        ${rate.price.toFixed(2)} <span className="text-xs font-normal text-[#6B6B6B]">
          est.
        </span>
      </span>
    </div>
  );
}