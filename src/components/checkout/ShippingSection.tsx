"use client";

import {
  Truck,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Clock,
  Info,
  Scissors,
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
    <div className="rounded-3xl bg-card p-6 lg:p-8 border border-border shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Truck
            className="h-5 w-5 text-primary"
            strokeWidth={1.75}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold font-heading text-foreground">
            Shipping Method
          </h2>

          <p className="text-xs text-muted-foreground mt-0.5">
            Choose your preferred delivery option
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />

          <p className="mt-4 text-sm font-medium text-muted-foreground">
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
        <div className="text-center py-10 text-muted-foreground">
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
        <div className="flex gap-3 rounded-2xl bg-secondary border border-border px-4 py-3.5">
          <Clock className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">
              Estimated Delivery
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We strive to ship everything within <span className="font-medium text-foreground">10 days</span> but some items do take longer. Please note that delivery times are estimates and may vary due to factors such as courier schedules, holidays, or remote delivery locations.
            </p>
          </div>
        </div>

        {/* Production Variability */}
        <div className="flex gap-3 rounded-2xl bg-primary/10 border border-primary/30 px-4 py-3.5">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">
              Production Variability &amp; Unexpected Delays
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Because many of our products are custom-made, occasional production delays may occur. Factors such as machine maintenance, needle breaks, garment defects, or the need to re-run an item to meet our quality standards can extend the normal processing timeline. These situations are rare, but they are a natural part of custom apparel production.
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed mt-2">
              If your order is affected by an unexpected production delay, our team will notify you promptly with an updated timeline. We are committed to delivering high-quality products and will never ship an item that does not meet our standards.
            </p>
          </div>
        </div>

        {/* Embroidery Stitch Count Policy */}
        <div className="flex gap-3 rounded-2xl bg-secondary border border-border px-4 py-3.5">
          <Scissors className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">
              🧵 Embroidery Stitch Count Policy
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All pricing is based on standard stitch estimates per location (e.g., left chest ≈ 7,000 stitches). If your design's actual stitch count differs significantly from the estimated range, we'll review it after receiving your file.
            </p>
            <ul className="text-xs text-muted-foreground leading-relaxed mt-2 space-y-1 list-disc pl-4">
              <li>Minor variations (within ~15%) are covered by the listed price.</li>
              <li>Major differences (typically 20% or more above the range) may require a price adjustment before production. We'll contact you first if any change is needed — no surprises.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Order error */}
      {orderError && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/30 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />

          <p className="text-sm text-destructive">
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
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to address
        </button>
      </div>
    </div>
  );
}