"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Package, ShoppingBag, ArrowRight } from "lucide-react";

export default function SuccessScreen({ orderId }: { orderId: number | null }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-sm w-full">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          {/* Top accent */}
          <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div className="relative h-20 w-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping opacity-30" />
              <div className="relative h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
              Order Confirmed!
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your order has been placed successfully. You'll receive a confirmation email shortly.
            </p>

            {/* Order ID badge */}
            {orderId && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Order #{orderId}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 space-y-3">
             
              <button
                onClick={() => router.push("/categories")}
                className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Questions? Contact our support team anytime.
        </p>
      </div>
    </div>
  );
}
