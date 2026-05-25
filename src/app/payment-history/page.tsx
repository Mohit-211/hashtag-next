"use client";

import PaymentHistoryCard, { Payment } from "@/components/Paymenthistorycard/Paymenthistorycard";
import React, { useEffect, useState, useCallback } from "react";
// import { GetPaymentHistoryApi } from "@/api/payment.api"; // ← uncomment to use real API

// ─── Mock data matching your API response shape ────────────────────────────
const MOCK_RESPONSE = {
  success: true,
  status: 200,
  message: "Payment history fetched successfully",
  data: {
    total: 1,
    current_page: 1,
    total_pages: 1,
    payments: [
      {
        payment_id: 2,
        transaction_id: "lmCyzYQuLqgA3nxwuxFrzL7dMmIZY",
        amount: 794,
        currency: "USD",
        created_at: "2026-05-25T09:35:45.000Z",
        order: {
          order_id: 2,
          order_number: "ORD-1779701717386",
          total_amount: 793.52,
          shipping_amount: 228.32,
          payment_status: "SUCCESS" as const,
          shipment_status: "SUCCESS" as const,
          tracking_number: "1ZXXXXXXXXXXXXXXXX",
          tracking_url:
            "http://wwwapps.ups.com/WebTracking/processRequest?HTMLVersion=5.0&Requester=NES&AgreeToTermsAndConditions=yes&loc=en_US&tracknum=1ZXXXXXXXXXXXXXXXX",
          preview: {
            product_name:
              "Russell Outdoors Camo Snapback Trucker Cap RU900",
            original_image:
              "https://cdnm.sanmar.com/imglib/mresjpg/2023/f5/RU900_mossyoakdna_khaki_flat_left.jpg",
            customized_image:
              "https://node.hashtagbillionaire.com/images/images-1779701438019.png",
            total_items: 24,
            print_method: "DTF",
          },
        },
      },
    ],
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface PaginationMeta {
  total: number;
  current_page: number;
  total_pages: number;
}

// ─── Skeleton loader ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
        </div>
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="h-10 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        No payments yet
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        Your payment history will appear here once you've made a purchase.
      </p>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  if (meta.total_pages <= 1) return null;

  const pages = Array.from({ length: meta.total_pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between mt-8">
      <p className="text-sm text-slate-500">
        Showing page{" "}
        <span className="font-semibold text-slate-700">{meta.current_page}</span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700">{meta.total_pages}</span>{" "}
        · {meta.total} total
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === meta.current_page
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.total_pages}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    current_page: 1,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      // ── Real API call (uncomment when ready) ──────────────────────────────
      // const res = await GetPaymentHistoryApi({ page, limit: 10 });
      // if (!res?.success) throw new Error(res?.message || "Failed to fetch");
      // setPayments(res.data.payments);
      // setMeta({
      //   total: res.data.total,
      //   current_page: res.data.current_page,
      //   total_pages: res.data.total_pages,
      // });

      // ── Mock (remove once real API is connected) ──────────────────────────
      await new Promise((r) => setTimeout(r, 800)); // simulate network
      const res = MOCK_RESPONSE;
      setPayments(res.data.payments as Payment[]);
      setMeta({
        total: res.data.total,
        current_page: res.data.current_page,
        total_pages: res.data.total_pages,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  return (
    <main className="min-h-screen bg-[#f8f7f4]">
      {/* Decorative header band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Payment History
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            A record of all your transactions and orders.
          </p>
        </div>

        {/* Summary chips */}
        {!loading && !error && payments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <p className="text-lg font-extrabold text-slate-900">{meta.total}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <p className="text-xs text-slate-500 font-medium">Total Spent</p>
              <p className="text-lg font-extrabold text-slate-900">
                $
                {payments
                  .reduce((acc, p) => acc + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* States */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-red-700 mb-2">{error}</p>
            <button
              onClick={() => fetchPayments(currentPage)}
              className="text-xs font-bold text-red-700 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && !error && payments.length === 0 && <EmptyState />}

        {!loading && !error && payments.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {payments.map((payment) => (
                <PaymentHistoryCard
                  key={payment.payment_id}
                  payment={payment}
                />
              ))}
              
            </div>


            <Pagination
              meta={meta}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
    </main>
  );
}