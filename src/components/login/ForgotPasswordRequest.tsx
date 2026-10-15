"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requestPasswordResetApi } from "@/api/auth/auth.api";
import { apiMessage } from "@/lib/errors";
import { emailSchema } from "@/lib/validation";
import { TextField } from "./FormField";

/** Step 1 of a password reset: email a reset link. */
export default function ForgotPasswordRequest() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      return;
    }
    setEmailError(undefined);
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordResetApi({ email: parsed.data });
      // Generic on purpose — the API never reveals whether the account exists.
      setSentMessage(res?.data?.message || "If an account matches that email, we've sent a link to reset your password.");
    } catch (err) {
      setError(apiMessage(err) || "We couldn't send the email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sentMessage) {
    return (
      <>
        <div className="space-y-1.5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
            <MailCheck className="h-5 w-5 text-primary-ink" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">{sentMessage}</p>
          <p className="text-sm text-muted-foreground">The link works once and expires in 60 minutes.</p>
        </div>
        <Button variant="outline" size="lg" className="w-full" onClick={() => setSentMessage(null)}>
          Use a different email
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          maxLength={254}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Sending…
            </>
          ) : (
            "Email me a reset link"
          )}
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
