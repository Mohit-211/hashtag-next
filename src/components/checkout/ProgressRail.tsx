"use client";
import { MapPin, Truck, CreditCard, Check } from "lucide-react";

const STEPS = [
  { key: "address",  label: "Address",  icon: MapPin },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "payment",  label: "Payment",  icon: CreditCard },
];

export default function ProgressRail({ current }: { current: string }) {
  const ci = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center mb-6 px-6 py-3.5 bg-card border border-border border-b-[3px] border-b-primary">
      {STEPS.map((step, i) => {
        const done   = ci > i;
        const active = ci === i;
        const Icon   = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-10 w-10 flex items-center justify-center transition-all duration-300 rounded-sm
                ${done   ? "bg-success text-background"
                : active ? "bg-primary text-foreground border border-primary-hover"
                :          "bg-muted border border-input text-muted-foreground"}`}
              >
                {done
                  ? <Check className="h-4 w-4 stroke-[3]" />
                  : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest
                ${done ? "text-success" : active ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="mx-3 mb-5 h-0.5 w-12 bg-muted rounded-full overflow-hidden">
                <div className={`h-full bg-success transition-all duration-500 ${done ? "w-full" : "w-0"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}