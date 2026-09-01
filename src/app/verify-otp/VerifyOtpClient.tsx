"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtpApi, verifyOtpApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, ShieldCheck, Loader2 } from "lucide-react";

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
      toast.error("Please enter the complete 4-digit OTP ⚠️");
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
        toast.success(res.data.message || "OTP verified successfully 🎉");

        setTimeout(() => {
          if (type === "forgot_password") {
            router.push(
              `/forgot-password?email=${encodeURIComponent(email)}&type=${type}&token=${btoa(res?.data?.data?.token || "")}`
            );
          } else {
            router.push("/login");
          }
        }, 1000);
      } else {
        setHasError(true);
        toast.error(res?.data?.message || "Invalid OTP ❌");
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
        toast.success(res.data.message || "OTP sent successfully 📧");
        setDigits(Array(OTP_LENGTH).fill(""));
        setHasError(false);
        setTimer(RESEND_SECONDS);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res?.data?.message || "Failed to resend OTP ❌");
      }
    } catch (err: any) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */

 return (
  <div className="flex items-center justify-center">
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-md">
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-3">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold mb-2">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-500">
          Enter the 4-digit OTP sent to
        </p>

        <p className="text-sm font-medium text-gray-700 mt-1 break-all">
          {email}
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="space-y-2 mb-5">
        <div
          className="flex justify-center gap-3"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-14 w-12 rounded-lg border text-center text-2xl font-semibold outline-none transition-all
                ${
                  hasError
                    ? "border-red-500"
                    : digit
                    ? "border-blue-500"
                    : "border-gray-300"
                }
                focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            />
          ))}
        </div>

        {hasError && (
          <p className="text-center text-sm text-red-500">
            Invalid OTP. Please try again.
          </p>
        )}
      </div>

      {/* Verify Button */}
      <Button
        type="button"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={loading || otpValue.length !== OTP_LENGTH}
        onClick={handleVerify}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </span>
        ) : (
          "Verify OTP"
        )}
      </Button>

      {/* Resend */}
      <div className="text-center mt-5">
        {timer > 0 ? (
          <p className="text-sm text-gray-500">
            Resend OTP in{" "}
            <span className="font-semibold text-blue-600">
              {timer}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
      >
        Back
      </button>
    </div>
  </div>
);
  
}