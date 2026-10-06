"use client";

import { Lock, X } from "lucide-react";

/** "Sign in to continue" prompt shown before sending the user to /login. */
export default function LoginPromptModal({
  open,
  message = "Log in to continue. We'll bring you right back here with your selections saved.",
  onSignIn,
  onCancel,
}: {
  open: boolean;
  message?: string;
  onSignIn: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-[#E8D03A]">
            <Lock size={18} />
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F3F0] hover:text-[#111111]"
          >
            <X size={16} />
          </button>
        </div>
        <h3 id="login-prompt-title" className="mb-1.5 text-lg font-bold text-[#111111]">
          Sign in to continue
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-[#6B7280]">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-lg border border-[#E5E5E5] text-sm font-semibold text-[#111111] hover:border-[#111111]"
          >
            Continue browsing
          </button>
          <button
            type="button"
            onClick={onSignIn}
            autoFocus
            className="h-11 flex-1 rounded-lg bg-[#111111] text-sm font-bold text-[#E8D03A] hover:bg-black"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
