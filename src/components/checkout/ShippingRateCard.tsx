"use client";

import { Truck, Clock, Zap, Check } from "lucide-react";

export default function ShippingRateCard({ rate, selected, onSelect }: any) {
  const days = rate.delivery_days ?? 999;
  const isFast = days <= 2;
  const isMedium = days > 2 && days <= 5;

  const Icon = isFast ? Zap : isMedium ? Clock : Truck;

  const speedLabel = isFast
    ? { text: "Express", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700" }
    : isMedium
    ? { text: "Standard", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" }
    : { text: "Economy", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
        selected
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-100 dark:shadow-violet-900/20"
          : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Radio */}
        <div
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected ? "border-violet-500 bg-violet-500" : "border-slate-300 dark:border-slate-600"
          }`}
        >
          {selected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>

        {/* Carrier icon */}
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            selected
              ? "bg-violet-100 dark:bg-violet-900/50"
              : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          <Icon className={`h-5 w-5 ${selected ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${selected ? "text-violet-900 dark:text-violet-100" : "text-slate-800 dark:text-slate-200"}`}>
              {rate.label || rate.service_name}
            </p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${speedLabel.bg} ${speedLabel.color}`}>
              {speedLabel.text}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">
              {rate.carrier_name || rate.carrier_code}
            </span>
            {rate.delivery_text && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {rate.delivery_text}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className={`font-bold text-base ${selected ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-slate-200"}`}>
            {rate.price === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
            ) : (
              `$${Number(rate.price).toFixed(2)}`
            )}
          </p>
          {rate.delivery_days && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {rate.delivery_days} {rate.delivery_days === 1 ? "day" : "days"}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
