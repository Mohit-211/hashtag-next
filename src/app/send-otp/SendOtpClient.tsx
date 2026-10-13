"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtpApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { TextField } from "@/components/login/FormField";
import { emailSchema } from "@/lib/validation";

export default function SendOtpClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await sendOtpApi({ email, type: "forgot_password" });

      toast.success("Verification code sent to your email.");

      router.push(
        `/verify-otp?type=forgot_password&email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      // The axios response interceptor already toasts the failure.
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send you a verification code to reset it.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Sending code…" : "Send verification code"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
