"use client";

import { MapPin, Truck, CreditCard, Check } from "lucide-react";

const STEPS = [
  { key: "address", label: "Address", icon: MapPin },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "payment", label: "Payment", icon: CreditCard },
];

export default function ProgressRail({ current }: { current: string }) {
  const ci = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, i) => {
        const done = ci > i;
        const active = ci === i;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-emerald-500 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                    : active
                    ? "bg-violet-600 shadow-md shadow-violet-200 dark:shadow-violet-900/30 scale-110"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {done ? (
                  <Check className="text-white h-4 w-4 stroke-[3]" />
                ) : (
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-white" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? "text-violet-600 dark:text-violet-400"
                    : done
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="mx-3 mb-5 h-0.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-emerald-500 rounded-full transition-all duration-500 ${
                    done ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
