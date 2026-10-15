"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resendVerificationApi } from "@/api/auth/auth.api";
import { apiMessage } from "@/lib/errors";
import { emailSchema } from "@/lib/validation";
import { TextField } from "./FormField";

// The API sends at most one email a minute per account (extra requests still
// answer 200), so the button waits that long between sends.
const COOLDOWN_SECONDS = 60;

/** "Resend verification email" — with an email field when we don't know the address. */
export default function ResendVerification({
  email: knownEmail,
  askForEmail = false,
}: {
  email?: string;
  askForEmail?: boolean;
}) {
  const [email, setEmail] = useState(knownEmail ?? "");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message);
      return;
    }
    setEmailError(undefined);
    setError(null);
    setSending(true);
    try {
      const res = await resendVerificationApi({ email: parsed.data });
      // Generic on purpose — the API never reveals whether the account exists.
      setNotice(res?.data?.message || "If an account matches that email, we've sent a link to it.");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(apiMessage(err) || "We couldn't send the email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="space-y-3" noValidate>
      {askForEmail && (
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
      )}
      <Button type="submit" variant="outline" size="lg" className="w-full" disabled={sending || cooldown > 0}>
        {sending ? <Loader2 className="animate-spin" /> : <MailCheck />}
        {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
      </Button>
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
