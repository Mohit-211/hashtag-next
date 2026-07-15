"use client";

import { GetPaymentHistoryApi } from "@/api/operations/payment.api";
import PaymentHistoryCard, { Payment } from "@/components/PaymentHistoryCard/PaymentHistoryCard";
import React, { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface PaginationMeta {
  total: number;
  current_page: number;
  total_pages: number;
}

// ─── Skeleton loader ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="h-1 bg-primary" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-7 w-20 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
        </div>
        <div className="h-20 bg-muted/60 rounded-md" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-muted/60 rounded-full" />
          <div className="h-6 w-24 bg-muted/60 rounded-full" />
        </div>
        <div className="h-16 bg-muted/60 rounded-md" />
        <div className="h-10 bg-muted rounded-md" />
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-muted-foreground"
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
      <h3 className="font-heading text-lg font-bold text-foreground mb-1">
        No payments yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
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
      <p className="text-sm text-muted-foreground">
        Showing page{" "}
        <span className="font-semibold text-foreground">{meta.current_page}</span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{meta.total_pages}</span>{" "}
        · {meta.total} total
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="p-2 rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-md text-sm font-semibold transition-colors ${
              p === meta.current_page
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground hover:bg-secondary"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.total_pages}
          className="p-2 rounded-md border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      const res = await GetPaymentHistoryApi({ page, limit: 10 });
      if (!res?.success) throw new Error(res?.message || "Failed to fetch");
      setPayments(res.data.payments);
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
    <main className="min-h-screen bg-background">
      {/* Decorative header band */}
      <div className="h-1.5 w-full bg-primary" />
<div className="container max-w-3xl">

      <div className="max-w-full px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
              <svg
                className="w-4 h-4 text-background"
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
            <h1 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
              Payment History
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            A record of all your transactions and orders.
          </p>
        </div>

        {/* Summary chips */}
        {!loading && !error && payments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-card border border-border rounded-md px-4 py-2.5">
              <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
              <p className="font-heading text-lg font-extrabold text-foreground">{meta.total}</p>
            </div>
            <div className="bg-card border border-border rounded-md px-4 py-2.5">
              <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
              <p className="font-heading text-lg font-extrabold text-foreground">
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
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-5 text-center">
            <p className="text-sm font-semibold text-destructive mb-2">{error}</p>
            <button
              onClick={() => fetchPayments(currentPage)}
              className="text-xs font-bold text-destructive underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="grid gap-8 sm:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && !error && payments.length === 0 && <EmptyState />}

        {!loading && !error && payments.length > 0 && (
          <>
            <div className="grid gap-8 sm:grid-cols-3">
              {payments.map((payment) => (
                <PaymentHistoryCard key={payment.payment_id} payment={payment} />
              ))}
            </div>

            <Pagination meta={meta} onPageChange={(page) => setCurrentPage(page)} />
          </>
        )}
      </div>
</div>
    </main>
  );
}