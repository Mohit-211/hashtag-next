"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCart() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-sm w-full text-center">
        {/* Illustration */}
        <div className="relative h-28 w-28 mx-auto">
          <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          </div>
          {/* Badge */}
          <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
            0
          </div>
        </div>

        <h2 className="mt-7 text-2xl font-bold text-slate-900 dark:text-white">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Looks like you haven't added anything yet. Browse our products and find something you'll love.
        </p>

        <button
          onClick={() => router.push("/")}
          className="mt-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-violet-200 dark:hover:shadow-violet-900/30 active:scale-[0.99]"
        >
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
