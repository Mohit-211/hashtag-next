"use client";

import { MapPin, Plus, Loader2 } from "lucide-react";
import AddressCard from "./AddressCard";

export default function AddressSection({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  onContinue,
  loading = false,
}: any) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Delivery Address
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select where to ship your order
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
          <Plus className="h-4 w-4" />
          New address
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />

          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading addresses...
          </p>
        </div>
      ) : addresses.length > 0 ? (
        /* Address list */
        <div className="space-y-3">
          {addresses.map((addr: any) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={selectedAddressId === addr.id}
              onSelect={() => setSelectedAddressId(addr.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />

          <p className="font-medium">No saved addresses</p>

          <p className="text-sm mt-1">
            Add an address to continue
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onContinue}
        disabled={!selectedAddressId || loading}
        className="w-full mt-6 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-violet-200 dark:hover:shadow-violet-900/30 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Please wait...
          </>
        ) : (
          "Continue to Shipping"
        )}
      </button>
    </div>
  );
}