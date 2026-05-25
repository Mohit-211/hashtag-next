"use client";

import React from "react";

export interface PaymentPreview {
  product_name: string;
  original_image: string;
  customized_image: string;
  total_items: number;
  print_method: string;
}

export interface PaymentOrder {
  order_id: number;
  order_number: string;
  total_amount: number;
  shipping_amount: number;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  shipment_status: "SUCCESS" | "FAILED" | "PENDING" | "IN_TRANSIT";
  tracking_number: string;
  tracking_url: string;
  preview: PaymentPreview;
}

export interface Payment {
  payment_id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  created_at: string;
  order: PaymentOrder;
}

interface PaymentHistoryCardProps {
  payment: Payment;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  SUCCESS: {
    label: "Success",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  IN_TRANSIT: {
    label: "In Transit",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const { order } = payment;
  const preview = order.preview;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-300">
      {/* Top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
              Order Number
            </p>
            <p className="text-sm font-bold text-slate-800 font-mono">
              {order.order_number}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">
              ${payment.amount.toLocaleString()}
              <span className="text-sm font-semibold text-slate-400 ml-1">
                {payment.currency}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(payment.created_at)} · {formatTime(payment.created_at)}
            </p>
          </div>
        </div>

        {/* Product preview */}
        <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 mb-5">
          <div className="relative flex-shrink-0">
            <img
              src={preview.original_image}
              alt={preview.product_name}
              className="w-14 h-14 rounded-lg object-cover border border-slate-200"
            />
            <img
              src={preview.customized_image}
              alt="Customized"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-md object-cover border-2 border-white shadow"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
              {preview.product_name}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {preview.total_items}
                </span>{" "}
                items
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">
                {preview.print_method}
              </span>
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Payment:</span>
            <StatusBadge status={order.payment_status} />
          </div>
          <span className="text-slate-300 text-xs">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Shipment:</span>
            <StatusBadge status={order.shipment_status} />
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700">
              ${(order.total_amount - order.shipping_amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Shipping</span>
            <span className="font-medium text-slate-700">
              ${order.shipping_amount.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-bold text-slate-800">
            <span>Total</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Transaction ID + Tracking */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-slate-500">Transaction ID:</span>
            <span className="text-xs font-mono text-slate-700 truncate max-w-[180px]">
              {payment.transaction_id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs text-slate-500">Tracking:</span>
            <span className="text-xs font-mono text-slate-700">
              {order.tracking_number}
            </span>
          </div>
        </div>

        {/* CTA */}
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-violet-600 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Track Shipment
        </a>
      </div>
    </div>
  );
}