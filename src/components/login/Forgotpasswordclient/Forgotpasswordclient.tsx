"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PasswordInput from "../PasswordInput";
import { forgotPasswordApi } from "@/api/auth/auth.api";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

/* ── Password Strength ───────────────────────── */
function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

export default function ForgotPasswordClient() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") || "";
  const type = params.get("type") || "forgot_password";
  const token = params.get("token") || "";


  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);
  const mismatch = confirm && password !== confirm;

  /* ── Reset Password ───────────────────────── */
  const handleReset = async () => {
    if (strength < 3) {
      toast.error("Use strong password ⚠️");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match ❌");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email,
        password,
        confirm_password: confirm,
        token:atob(token) // optional if API needs
      };

      const res = await forgotPasswordApi(payload);


      if (res?.data?.success || res?.data?.status) {
        toast.success(res?.data?.message || "Password reset successful 🎉");

        setTimeout(() => {
          router.push("/login");
        }, 1200);
      } else {
        toast.error(res?.data?.message || "Reset failed ❌");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Something went wrong ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Create a new password for your account
        </p>
        <p className="text-sm font-semibold text-primary">{email}</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <PasswordInput
          value={password}
          onChange={(e:any) => setPassword(e.target.value)}
          placeholder="New Password"
        />

        <PasswordInput
          value={confirm}
          onChange={(e:any) => setConfirm(e.target.value)}
          placeholder="Confirm Password"
        />

        {/* Strength */}
        {password && (
          <p className="text-xs text-muted-foreground">
            Strength:{" "}
            <span className="font-semibold">
              {strength < 2
                ? "Weak"
                : strength === 2
                ? "Fair"
                : strength === 3
                ? "Good"
                : "Strong"}
            </span>
          </p>
        )}

        {mismatch && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}

        <Button
          onClick={handleReset}
          className="w-full"
          disabled={
            loading || !password || !confirm || mismatch || strength < 3
          }
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </div>

      {/* Back */}
      <p className="text-sm text-center text-muted-foreground">
        Back to{" "}
        <button
          onClick={() => router.push("/login")}
          className="text-primary font-semibold hover:underline"
        >
          Login
        </button>
      </p>
    </>
  );
}