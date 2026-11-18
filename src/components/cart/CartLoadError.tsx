"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown by the cart and checkout pages when the cart couldn't be loaded. */
export default function CartLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="py-20">
      <div role="alert" className="container max-w-lg text-center space-y-6">
        <AlertCircle
          className="h-12 w-12 mx-auto text-destructive"
          strokeWidth={1.5}
        />

        <h1 className="text-3xl font-heading font-bold text-foreground">
          {message}
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          Nothing in your cart has been removed. Please try again in a moment.
        </p>

        <Button
          variant="hero"
          size="lg"
          className="rounded-lg gap-2 mt-2"
          onClick={onRetry}
        >
          <RefreshCw className="h-5 w-5" />
          Retry
        </Button>
      </div>
    </section>
  );
}
