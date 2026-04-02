"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtpApi, verifyOtpApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const OTP_LENGTH = 4;

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") || "";
  const type = params.get("type") || "email_varification";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);

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
    // Focus last filled or last box
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const otpValue = digits.join("");

  /* ── Verify ─────────────────────────────────────────────────────────────── */
 async function handleVerify() {
  if (otpValue.length !== OTP_LENGTH) {
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
      toast.error(res?.data?.message || "Invalid OTP ❌");
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Verification failed ❌");
  } finally {
    setLoading(false);
  }
}

  /* ── Resend ─────────────────────────────────────────────────────────────── */
  async function handleResend() {
    try {
      setResendLoading(true);

      const res = await sendOtpApi(email);

      if (res?.data?.success || res?.data?.status) {
        toast.success(res.data.message || "OTP sent successfully 📧");
        setDigits(Array(OTP_LENGTH).fill(""));
        setTimer(30);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(res?.data?.message || "Failed to resend OTP ❌");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend OTP ❌");
    } finally {
      setResendLoading(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Header — matches RegisterForm style */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-heading font-bold">Verify Your Email</h1>
        <p className="text-sm text-muted-foreground">
          We've sent a 4-digit code to
        </p>
        <p className="text-sm font-semibold text-primary truncate">{email}</p>
      </div>

      {/* OTP Boxes */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`
              w-14 h-14 text-center text-xl font-bold rounded-lg border
              bg-background text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary
              transition-all duration-150
              ${digit ? "border-primary" : "border-input"}
            `}
          />
        ))}
      </div>

      {/* Verify Button */}
      <Button
        type="button"
        onClick={handleVerify}
        variant="hero"
        size="lg"
        className="w-full"
        disabled={loading || otpValue.length !== OTP_LENGTH}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </Button>

      {/* Resend */}
      <div className="text-center">
        {timer > 0 ? (
          <p className="text-sm text-muted-foreground select-none">
            Resend OTP in{" "}
            <span className="font-semibold text-primary">{timer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>

      {/* Back to login — matches RegisterForm footer style */}
      <p className="text-sm text-center text-muted-foreground">
        Wrong email?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-semibold text-primary hover:underline"
        >
          Go back
        </button>
      </p>
    </>
  );
}