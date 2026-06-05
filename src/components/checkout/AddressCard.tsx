"use client";
import { Check } from "lucide-react";

interface Props {
  address: any;
  selected: boolean;
  onSelect: () => void;
}

export default function AddressCard({ address, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-all border-l-[3px]
        ${selected
          ? "bg-[#FFFEF5] border border-[#E8CE00] border-l-[#F5D800]"
          : "bg-[#FAFAFA] border border-[#E0DFDB] border-l-transparent hover:border-[#CDCCC8] hover:bg-white"
        }`}
    >
      <div className={`w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 rounded-sm border transition-all
        ${selected ? "bg-[#1A1A1A] border-[#1A1A1A]" : "border-[#CDCCC8]"}`}>
        {selected && <Check className="h-3 w-3 text-white stroke-[3]" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[#1A1A1A]">{address.name}</span>
          {address.is_default && (
            <span className="bg-[#F5D800] text-[#1A1A1A] font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
          {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
          {address.city}, {address.state} {address.zip}, {address.country}
        </p>
      </div>
    </div>
  );
}