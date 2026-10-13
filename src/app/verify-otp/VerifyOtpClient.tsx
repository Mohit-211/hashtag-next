"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtpApi, verifyOtpApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { withReturnTo } from "@/lib/authRedirect";
import { ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") || "";
  const type = params.get("type") || "email_varification";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [hasError, setHasError] = useState(false);

  /* ── Autofocus first box on mount ─────────────────────────────────────── */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* ── Timer ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  /* ── OTP box handlers ───────────────────────────────────────────────────── */
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1); // only last digit
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    if (hasError) setHasError(false);

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current
        const updated = [...digits];
        updated[index] = "";
        setDigits(updated);
      } else if (index > 0) {
        // Move back
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const updated = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => (updated[i] = ch));
    setDigits(updated);
    if (hasError) setHasError(false);
    // Focus last filled or last box
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const otpValue = digits.join("");

  /* ── Verify ─────────────────────────────────────────────────────────────── */
  async function handleVerify() {
    if (otpValue.length !== OTP_LENGTH) {
      setHasError(true);
      toast.error(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email,
        otp: otpValue,
        type,
      };

      const res = await verifyOtpApi(payload);

      if (res?.data?.success || res?.data?.status) {
        toast.success(res.data.message || "Verified.");

        setTimeout(() => {
          if (type === "forgot_password") {
            router.push(
              `/forgot-password?email=${encodeURIComponent(email)}&type=${type}&token=${btoa(res?.data?.data?.token || "")}`
            );
          } else {
            router.push(withReturnTo("/login", params.get("returnTo")));
          }
        }, 1000);
      } else {
        setHasError(true);
        toast.error(res?.data?.message || "Invalid code.");
      }
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  /* ── Resend ─────────────────────────────────────────────────────────────── */
  async function handleResend() {
    try {
      setResendLoading(true);

      const res = await sendOtpApi({ email, type });

      if (res?.data?.success || res?.data?.status) {
        toast.success(res.data.message || "A new code is on its way.");
        setDigits(Array(OTP_LENGTH).fill(""));
        setHasError(false);
        setTimer(RESEND_SECONDS);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res?.data?.message || "Could not resend the code.");
      }
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-1.5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
          <ShieldCheck className="h-5 w-5 text-primary-ink" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">Enter the {OTP_LENGTH}-digit code we sent to</p>
        {/* Own line, never split mid-address; very long addresses truncate (full value on hover). */}
        <p className="truncate text-sm font-semibold text-foreground" title={email || undefined}>
          {email || "your email"}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "h-14 w-full rounded-lg border bg-card text-center text-2xl font-semibold text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-50",
                hasError ? "border-destructive" : digit ? "border-foreground" : "border-input"
              )}
            />
          ))}
        </div>
        {hasError && <p className="text-sm font-medium text-destructive">That code didn&apos;t work. Check it and try again.</p>}
      </div>

      <Button
        type="button"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={loading || otpValue.length !== OTP_LENGTH}
        onClick={handleVerify}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Verifying…
          </>
        ) : (
          "Verify"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          Back
        </button>
        {timer > 0 ? (
          <p className="text-muted-foreground">
            Resend code in <span className="font-semibold tabular-nums text-foreground">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </>
  );
}
