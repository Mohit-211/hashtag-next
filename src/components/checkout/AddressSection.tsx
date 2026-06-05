"use client";
import { MapPin, Plus, Loader2 } from "lucide-react";
import AddressCard from "./AddressCard";

export default function AddressSection({
  addresses, selectedAddressId, setSelectedAddressId, onContinue, loading = false,
}: any) {
  return (
    <div className="bg-white border border-[#E0DFDB] border-t-[3px] border-t-[#F5D800]">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0DFDB]">
        <div className="h-10 w-10 bg-[#F5D800] flex items-center justify-center shrink-0 rounded-sm">
          <MapPin className="h-5 w-5 text-[#1A1A1A]" />
        </div>
        <div className="flex-1">
          <h2 className="font-condensed font-bold text-lg uppercase tracking-wide text-[#1A1A1A]">
            Delivery Address
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Select where to ship your order</p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#F5D800] hover:bg-[#E8CE00] text-[#1A1A1A] font-condensed font-bold text-xs uppercase tracking-widest px-3 py-2 rounded-sm transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Address
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
            <p className="mt-3 font-condensed font-bold text-xs uppercase tracking-widest text-[#6B6B6B]">
              Loading addresses...
            </p>
          </div>
        ) : addresses?.length > 0 ? (
          addresses?.map((addr: any) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={selectedAddressId === addr.id}
              onSelect={() => setSelectedAddressId(addr.id)}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-[#CDCCC8]" />
            <p className="font-condensed font-bold uppercase tracking-wide text-[#9A9A9A]">
              No saved addresses
            </p>
            <p className="text-sm text-[#9A9A9A] mt-1">Add an address to continue</p>
          </div>
        )}

        <button
          onClick={onContinue}
          disabled={!selectedAddressId || loading}
          className="w-full mt-2 py-3.5 bg-[#F5D800] hover:bg-[#E8CE00] text-[#1A1A1A] font-condensed font-bold text-base uppercase tracking-widest rounded-sm disabled:bg-[#F5F4F0] disabled:text-[#CDCCC8] disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Please wait..." : "Continue to Shipping →"}
        </button>
      </div>
    </div>
  );
}