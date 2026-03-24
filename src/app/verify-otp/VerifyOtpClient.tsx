"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOtpApi, verifyOtpApi } from "@/api/auth/auth.api";

export default function VerifyOtpClient() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [timer, setTimer] = useState(10);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ================= VERIFY OTP ================= */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (otp.length !== 4) {
      setError("Please enter a 4-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const payload = { email, otp, type:"email_varification" };

      const res = await verifyOtpApi(payload);

      if (res?.data?.success) {
        setMessage(res.data.message || "OTP verified successfully");
        setTimeout(() => router.push("/auth/login"), 800);
      } else {
        setError(res?.data?.message || "Invalid OTP");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  /* ================= RESEND OTP ================= */
  async function handleResendOtp() {
    try {
      setResendLoading(true);
      setError(null);
      setMessage(null);

      const res = await sendOtpApi(email);

      if (res?.data?.success) {
        setMessage(res.data.message || "OTP sent successfully");
        setTimer(30);
      } else {
        setError(res?.data?.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2 text-center">Verify OTP</h1>

      <p className="text-sm text-gray-400 text-center mb-6">Sent to {email}</p>

      {/* ===== MESSAGE ===== */}
      {message && (
        <div className="mb-4 text-sm text-center text-green-400">{message}</div>
      )}

      {/* ===== ERROR ===== */}
      {error && (
        <div className="mb-4 text-sm text-center text-red-400">{error}</div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="4-digit OTP"
          maxLength={4}
          required
          className="w-full text-center tracking-widest text-lg px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 transition py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {/* ================= RESEND OTP ================= */}
      <div className="mt-4 text-center">
        {timer > 0 ? (
          <p className="text-sm text-gray-400 select-none cursor-not-allowed">
            Resend OTP in <span className="text-white">{timer}s</span>
          </p>
        ) : (
          <button
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>
    </>
  );
}
