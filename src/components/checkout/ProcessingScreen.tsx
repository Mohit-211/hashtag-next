"use client";

import { Loader2 } from "lucide-react";

export default function ProcessingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="text-center max-w-sm w-full">
        {/* Animated ring */}
        <div className="relative h-24 w-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-violet-100 dark:bg-violet-900/30" />
          <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-800 animate-ping opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold text-slate-900 dark:text-white">
          Placing your order…
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          We're processing your payment and confirming your order. This will only take a moment.
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-violet-400 dark:bg-violet-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
