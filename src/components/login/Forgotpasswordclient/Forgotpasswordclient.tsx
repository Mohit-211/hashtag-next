"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { forgotPasswordApi } from "@/api/auth/auth.api";
import { PASSWORD_MAX_LENGTH, passwordSchema, zodErrors } from "@/lib/validation";
import { PasswordChecklist, PasswordField } from "@/components/login/FormField";

const resetSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

/** The reset token arrives base64-encoded in the URL (see VerifyOtpClient). */
const decodeToken = (raw: string): string | null => {
  try {
    return raw ? atob(raw) : null;
  } catch {
    return null;
  }
};

export default function ForgotPasswordClient() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") || "";
  const token = decodeToken(params.get("token") || "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fieldErrors = zodErrors(resetSchema, { password, confirm });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length || !token) return;

    try {
      setLoading(true);
      const res = await forgotPasswordApi({ email, password, confirm_password: confirm, token });
      if (res?.data?.success || res?.data?.status) {
        toast.success(res?.data?.message || "Password updated. Log in with your new password.");
        router.push("/login");
        return;
      }
      toast.error(res?.data?.message || "Could not reset your password. Please try again.");
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">This reset link isn&apos;t valid</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired or been opened directly. Request a new verification code to reset your password.
        </p>
        <Button asChild variant="hero" size="lg" className="w-full">
          <Link href="/send-otp">Request a new code</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="truncate text-sm text-muted-foreground" title={email}>
          for <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4" noValidate>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          hint={<PasswordChecklist password={password} />}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirm}
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
