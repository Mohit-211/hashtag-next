"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { changePasswordApi } from "@/api/auth/auth.api";
import { AUTH_TOKEN_KEY } from "@/lib/authRedirect";
import { passwordSchema, zodErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

type PasswordField = "currentPw" | "newPw" | "confirmPw";
type FieldErrors = Partial<Record<PasswordField, string>>;

// On-screen order. After a failed submit, focus goes to the first field with an error.
const FIELD_ORDER: PasswordField[] = ["currentPw", "newPw", "confirmPw"];

// The new password follows the same rules as sign-up and password reset.
const changePasswordSchema = z
  .object({
    currentPw: z.string().min(1, "Enter your current password."),
    newPw: passwordSchema,
    confirmPw: z.string().min(1, "Please confirm your new password."),
  })
  .refine((v) => !v.currentPw || v.newPw !== v.currentPw, {
    path: ["newPw"],
    message: "New password must be different from your current password.",
  })
  .refine((v) => v.newPw === v.confirmPw, { path: ["confirmPw"], message: "Passwords do not match." });

export default function PasswordSection() {
  const router = useRouter();
  const { logout } = useAuth();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [loading, setLoading] = useState(false);

  // Inline errors, tied to their inputs the same way as the login form's
  // FormField: aria-invalid, plus aria-describedby pointing at `<id>-error`.
  const [errors, setErrors] = useState<FieldErrors>({});
  // Screen-reader-only status text, used when focus can't move to the error.
  const [announcement, setAnnouncement] = useState("");

  const idPrefix = useId();
  const fieldId = (field: PasswordField) => `${idPrefix}-${field}`;
  const errorId = (field: PasswordField) => `${fieldId(field)}-error`;

  const currentPwRef = useRef<HTMLInputElement>(null);
  const newPwRef = useRef<HTMLInputElement>(null);
  const confirmPwRef = useRef<HTMLInputElement>(null);
  const inputRefs = { currentPw: currentPwRef, newPw: newPwRef, confirmPw: confirmPwRef };
  const setters = { currentPw: setCurrentPw, newPw: setNewPw, confirmPw: setConfirmPw };

  // Pending "log in again" sign-out after a password change. Leaving this
  // section cancels it, so it can't sign the user out on another page.
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, []);

const getStrength = () => {
  let score = 0;

  if (newPw.length >= 8) score++;
  if (/[A-Z]/.test(newPw)) score++;
  if (/[0-9]/.test(newPw)) score++;
  if (/[^A-Za-z0-9]/.test(newPw)) score++;

  if (score <= 2) return { label: "Weak", color: "text-destructive" };
  if (score === 3) return { label: "Medium", color: "text-primary-ink" };

  return { label: "Strong", color: "text-success" };
};

const strength = getStrength();

  // Typing re-checks only the fields that already show an error: the message
  // follows the edit and goes away once the field is valid. Fields without an
  // error stay quiet until the next submit.
  const handleFieldChange = (field: PasswordField, value: string) => {
    setters[field](value);
    setAnnouncement("");
    const values = { currentPw, newPw, confirmPw, [field]: value };
    setErrors((prev) => {
      const shown = FIELD_ORDER.filter((f) => prev[f]);
      if (!shown.length) return prev;
      const latest = zodErrors(changePasswordSchema, values);
      const next: FieldErrors = {};
      for (const f of shown) if (latest[f]) next[f] = latest[f];
      return next;
    });
  };

  const handleChangePassword = async () => {
    const fieldErrors: FieldErrors = zodErrors(changePasswordSchema, { currentPw, newPw, confirmPw });
    const firstInvalid = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (firstInvalid) {
      // Render the messages and aria attributes before moving focus, so the
      // screen reader reads the field together with its error.
      flushSync(() => setErrors(fieldErrors));
      const input = inputRefs[firstInvalid].current;
      if (input && input !== document.activeElement) {
        input.focus();
      } else {
        // Enter was pressed in that same field, so focus doesn't move and
        // nothing would be read. Announce it through the status region instead.
        // The trailing space alternates so a repeated message is read again.
        const message = fieldErrors[firstInvalid] ?? "";
        setAnnouncement((prev) => (prev === message ? `${message} ` : message));
      }
      return;
    }
    setErrors({});
    setAnnouncement("");

    try {
      setLoading(true);

      const payload = {
        old_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      };

      const res = await changePasswordApi(payload);

      if (res?.data?.success) {
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");

        // The change signs out every other device and replaces this device's
        // token — store the new one, or the next call would sign us out.
        const newToken = res?.data?.data?.tokens?.access?.token;
        if (newToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, newToken);
          toast.success("Password updated. You've been signed out on your other devices.");
        } else {
          toast.success("Password updated. Please log in again.");
          // The user may have left this section while the request was in flight.
          if (!unmountedRef.current) {
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = setTimeout(() => {
              logoutTimerRef.current = null;
              logout();
              router.push("/login");
            }, 1500);
          }
        }
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (error) {
      // The axios response interceptor already toasts the failure.
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fieldA11y = (field: PasswordField) => ({
    id: fieldId(field),
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? errorId(field) : undefined,
  });

  const fieldError = (field: PasswordField) =>
    errors[field] ? (
      <p id={errorId(field)} className="mt-1.5 text-xs font-medium text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const fieldInputClass = (field: PasswordField, extra?: string) =>
    cn(inputClass, extra, errors[field] && "border-destructive");

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold text-foreground">
          Change Password
        </h1>

        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Keep your account secure by updating your password regularly.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleChangePassword();
        }}
        className="space-y-4 max-w-lg"
        noValidate
      >
        {/* Kept first so the submit button stays the last spaced child. */}
        <p role="status" className="sr-only">
          {announcement}
        </p>

        {/* Current Password */}
        <div>
          <label htmlFor={fieldId("currentPw")} className="text-sm font-medium mb-1.5 block">
            Current Password
          </label>

          <div className="relative">
            <input
              ref={currentPwRef}
              {...fieldA11y("currentPw")}
              type={showCurrentPw ? "text" : "password"}
              value={currentPw}
              maxLength={128}
              onChange={(e) => handleFieldChange("currentPw", e.target.value)}
              className={fieldInputClass("currentPw", "pr-10")}
              placeholder="Enter current password"
            />

            <button
              type="button"
              onClick={() => setShowCurrentPw((p) => !p)}
              aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
              aria-pressed={showCurrentPw}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showCurrentPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {fieldError("currentPw")}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor={fieldId("newPw")} className="text-sm font-medium mb-1.5 block">
            New Password
          </label>

          <div className="relative">
            <input
              ref={newPwRef}
              {...fieldA11y("newPw")}
              type={showNewPw ? "text" : "password"}
              value={newPw}
              maxLength={128}
              onChange={(e) => handleFieldChange("newPw", e.target.value)}
              className={fieldInputClass("newPw", "pr-10")}
              placeholder="Strong password"
            />

            <button
              type="button"
              onClick={() => setShowNewPw((p) => !p)}
              aria-label={showNewPw ? "Hide new password" : "Show new password"}
              aria-pressed={showNewPw}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showNewPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {fieldError("newPw")}

          {/* Strength */}
          {newPw && (
            <p className={`text-xs mt-1 ${strength.color}`}>
              Strength: {strength.label}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor={fieldId("confirmPw")} className="text-sm font-medium mb-1.5 block">
            Confirm Password
          </label>

          <input
            ref={confirmPwRef}
            {...fieldA11y("confirmPw")}
            type="password"
            value={confirmPw}
            maxLength={128}
            onChange={(e) => handleFieldChange("confirmPw", e.target.value)}
            className={fieldInputClass("confirmPw")}
            placeholder="Re-enter password"
          />

          {fieldError("confirmPw")}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="hero"
          className="rounded-lg"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
