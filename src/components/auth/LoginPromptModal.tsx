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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-primary">
            <Lock size={18} />
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <h3 id="login-prompt-title" className="mb-1.5 text-lg font-bold text-foreground">
          Sign in to continue
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-foreground"
          >
            Continue browsing
          </button>
          <button
            type="button"
            onClick={onSignIn}
            autoFocus
            className="h-11 flex-1 rounded-lg bg-foreground text-sm font-bold text-primary hover:bg-foreground/85"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
