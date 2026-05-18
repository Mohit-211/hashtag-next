"use client";

import {
  Truck,
  ChevronLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";

import ShippingRateCard from "./ShippingRateCard";

interface Props {
  shippingRates: any[];
  selectedRate: any;
  setSelectedRate: (rate: any) => void;

  selectedAddressId: number | null;
  shippingAmount: number;

  processing: boolean;
  loading?: boolean;
  orderError?: string | null;

  onContinue: () => Promise<void> | void;
  onBack: () => void;
}

export default function ShippingSection({
  shippingRates,
  selectedRate,
  setSelectedRate,
  processing,
  loading = false,
  orderError,
  onContinue,
  onBack,
}: Props) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <Truck
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            strokeWidth={1.75}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Shipping Method
          </h2>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Choose your preferred delivery option
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />

          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading shipping rates...
          </p>
        </div>
      ) : shippingRates.length > 0 ? (
        /* Rates */
        <div className="space-y-3">
          {shippingRates.map((rate: any) => (
            <ShippingRateCard
              key={`${rate.carrier_code}-${rate.service_code}`}
              rate={rate}
              selected={
                selectedRate?.service_code ===
                rate.service_code
              }
              onSelect={() => setSelectedRate(rate)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <Truck
            className="h-10 w-10 mx-auto mb-3 opacity-30"
            strokeWidth={1.5}
          />

          <p className="font-medium text-sm">
            No shipping options available
          </p>

          <p className="text-xs mt-1">
            Please check your delivery address
          </p>
        </div>
      )}

      {/* Order error */}
      {orderError && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />

          <p className="text-sm text-red-600 dark:text-red-400">
            {orderError}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={onContinue}
          disabled={!selectedRate || processing || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-violet-200 dark:hover:shadow-violet-900/30 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Payment"
          )}
        </button>

        <button
          onClick={onBack}
          disabled={processing || loading}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to address
        </button>
      </div>
    </div>
  );
}