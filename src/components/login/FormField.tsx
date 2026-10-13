"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase =
  "h-11 w-full rounded-lg border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-60";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Rendered at the right end of the label row (e.g. "Forgot password?"). */
  labelAction?: ReactNode;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  labelAction,
  children,
}: Pick<FieldProps, "label" | "error" | "hint" | "labelAction"> & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <div id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function TextField({ label, error, hint, labelAction, className, id, ...rest }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} labelAction={labelAction}>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(inputBase, error ? "border-destructive" : "border-input", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function PasswordField({ label, error, hint, labelAction, className, id, ...rest }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} labelAction={labelAction}>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn(inputBase, "pr-11", error ? "border-destructive" : "border-input", className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FieldShell>
  );
}

/** Live checklist for the password rules enforced by `passwordSchema`. */
export const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn("flex items-center gap-1.5 text-xs", met ? "text-success" : "text-muted-foreground")}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                met ? "border-success bg-success text-success-foreground" : "border-input"
              )}
              aria-hidden="true"
            >
              {met && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
