"use client";

import { Loader2 } from "lucide-react";

export default function ProcessingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-sm w-full">
        {/* Animated ring */}
        <div className="relative h-24 w-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary/15" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold font-heading text-foreground">
          Placing your order…
        </h2>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We&apos;re processing your payment and confirming your order. This will only take a moment.
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}