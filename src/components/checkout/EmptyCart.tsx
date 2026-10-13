"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCart() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-sm w-full text-center">
        {/* Illustration */}
        <div className="relative h-28 w-28 mx-auto">
          <div className="absolute inset-0 rounded-full bg-muted" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          {/* Badge */}
          <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-card border-2 border-border flex items-center justify-center text-muted-foreground font-bold text-sm">
            0
          </div>
        </div>

        <h2 className="mt-7 text-2xl font-bold text-foreground">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Looks like you haven&apos;t added anything yet. Browse our products and find something you&apos;ll love.
        </p>

        <button
          onClick={() => router.push("/")}
          className="mt-8 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-foreground/10 active:scale-[0.99]"
        >
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
