"use client";

import {
  Truck,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Clock,
  Info,
} from "lucide-react";

import ShippingRateCard from "./ShippingRateCard";
import { Button } from "../ui/button";

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
                selectedRate?.service_code === rate.service_code
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

      {/* ── DELIVERY NOTES ── */}
      <div className="mt-5 space-y-3">

        {/* Estimated Delivery */}
        <div className="flex gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-4 py-3.5">
          <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
              Estimated Delivery
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
              We strive to ship everything within <span className="font-medium">10 days</span> but some items do take longer. Please note that delivery times are estimates and may vary due to factors such as courier schedules, holidays, or remote delivery locations.
            </p>
          </div>
        </div>

        {/* Production Variability */}
        <div className="flex gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-4 py-3.5">
          <Info className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
              Production Variability &amp; Unexpected Delays
            </p>
            <p className="text-xs text-amber-700/75 dark:text-amber-400/80 leading-relaxed">
              Because many of our products are custom-made, occasional production delays may occur. Factors such as machine maintenance, needle breaks, garment defects, or the need to re-run an item to meet our quality standards can extend the normal processing timeline. These situations are rare, but they are a natural part of custom apparel production.
            </p>
            <p className="text-xs text-amber-700/75 dark:text-amber-400/80 leading-relaxed mt-2">
              If your order is affected by an unexpected production delay, our team will notify you promptly with an updated timeline. We are committed to delivering high-quality products and will never ship an item that does not meet our standards.
            </p>
          </div>
        </div>

      </div>

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
        <Button
          variant="hero"
          size="lg"
          className="w-full"


          onClick={onContinue}
          disabled={!selectedRate || processing || loading}
        // className="w-full bg-[#F5D800] hover:bg-[#e6ca00] disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-black py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-yellow-200 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Payment"
          )}
        </Button>

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