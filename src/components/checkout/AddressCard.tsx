"use client";

import { Check, Home, Building2 } from "lucide-react";

export default function AddressCard({ address, selected, onSelect }: any) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 group ${
        selected
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-100 dark:shadow-violet-900/20"
          : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Radio indicator */}
        <div
          className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected
              ? "border-violet-500 bg-violet-500"
              : "border-slate-300 dark:border-slate-600"
          }`}
        >
          {selected && <Check className="h-3 w-3 text-white stroke-[3]" />}
        </div>

        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected
              ? "bg-violet-100 dark:bg-violet-900/50"
              : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          {address.is_default ? (
            <Home className={`h-5 w-5 ${selected ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`} />
          ) : (
            <Building2 className={`h-5 w-5 ${selected ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`} />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${selected ? "text-violet-900 dark:text-violet-100" : "text-slate-800 dark:text-slate-200"}`}>
              {address.name}
            </p>
            {address.is_default && (
              <span className="text-[11px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-700">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{address.line1}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {address.city}, {address.state} {address.zip}
          </p>
          {address.phone && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{address.phone}</p>
          )}
        </div>
      </div>
    </button>
  );
}
