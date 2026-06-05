"use client";
import { MapPin, Truck, CreditCard, Check } from "lucide-react";

const STEPS = [
  { key: "address",  label: "Address",  icon: MapPin },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "payment",  label: "Payment",  icon: CreditCard },
];

export default function ProgressRail({ current }: { current: string }) {
  const ci = STEPS.findIndex((s) => s.key === current);
console.log(current,"current")
  return (
    <div className="flex items-center justify-center mb-6 px-6 py-3.5 bg-white border border-[#E0DFDB] border-b-[3px] border-b-[#F5D800]">
      {STEPS.map((step, i) => {
        const done   = ci > i;
        const active = ci === i;
        const Icon   = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-10 w-10 flex items-center justify-center transition-all duration-300 rounded-sm
                ${done   ? "bg-green-700 text-white"
                : active ? "bg-[#F5D800] text-[#1A1A1A] border border-[#E8CE00]"
                :          "bg-[#F5F4F0] border border-[#CDCCC8] text-[#9A9A9A]"}`}
              >
                {done
                  ? <Check className="h-4 w-4 stroke-[3]" />
                  : <Icon className="h-4 w-4" />}
              </div>
              <span className={`font-condensed text-[10px] font-bold uppercase tracking-widest
                ${done ? "text-green-700" : active ? "text-[#1A1A1A]" : "text-[#9A9A9A]"}`}>
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="mx-3 mb-5 h-0.5 w-12 bg-[#E0DFDB] rounded-full overflow-hidden">
                <div className={`h-full bg-green-700 transition-all duration-500 ${done ? "w-full" : "w-0"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}