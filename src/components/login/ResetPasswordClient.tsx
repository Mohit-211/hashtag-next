"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { resetPasswordWithTokenApi } from "@/api/auth/auth.api";
import { apiMessage } from "@/lib/errors";
import { PASSWORD_MAX_LENGTH, passwordSchema, zodErrors } from "@/lib/validation";
import { PasswordChecklist, PasswordField } from "./FormField";

const resetSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

// The emailed token is 64 hex characters.
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
// The API's wording for a used, expired or unknown link.
const isLinkProblem = (message: string) => /invalid or has expired|no longer exists/i.test(message);

/**
 * Step 2 of a password reset, opened from the emailed link. Also used by
 * customers whose account an admin created ("Set your password" email).
 */
export default function ResetPasswordClient() {
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(
    TOKEN_PATTERN.test(token) ? null : "This link is invalid or has expired."
  );
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const fieldErrors = zodErrors(resetSchema, { password, confirm });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      const res = await resetPasswordWithTokenApi({ token, password, confirm_password: confirm });
      setDoneMessage(res?.data?.message || "Your password has been changed. Please sign in with your new password.");
    } catch (err) {
      const message = apiMessage(err) || "We couldn't change your password. Please try again.";
      // A password-rule or mismatch error leaves the link usable, so the form stays.
      if (isLinkProblem(message)) setLinkError(message);
      else setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (doneMessage) {
    return (
      <>
        <div className="space-y-1.5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
          <p className="text-sm text-muted-foreground">{doneMessage}</p>
        </div>
        <Button asChild variant="hero" size="lg" className="w-full">
          <Link href="/login">Log in</Link>
        </Button>
      </>
    );
  }

  if (linkError) {
    return (
      <>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">This link can&apos;t be used</h1>
          <p className="text-sm text-muted-foreground">{linkError}</p>
          <p className="text-sm text-muted-foreground">Reset links work once and expire after 60 minutes.</p>
        </div>
        <Button asChild variant="hero" size="lg" className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
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
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a password for your account. You&apos;ll be signed out on your other devices.
        </p>
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              <Loader2 className="animate-spin" /> Saving…
            </>
          ) : (
            "Save new password"
          )}
        </Button>
      </form>
    </>
  );
}
