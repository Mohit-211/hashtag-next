"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { emailSchema, PASSWORD_MAX_LENGTH, zodErrors } from "@/lib/validation";
import { notifyAuthChanged, resolvePostLoginRedirect } from "@/lib/authRedirect";
import { PasswordField, TextField } from "./FormField";
import ResendVerification from "./ResendVerification";

interface LoginFormProps {
  switchToRegister: () => void;
  /** Sanitized page to return to after login. */
  returnTo?: string | null;
  /** Prefill, e.g. after verifying an email. */
  initialEmail?: string;
}

const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(PASSWORD_MAX_LENGTH, `Password must be under ${PASSWORD_MAX_LENGTH} characters.`),
});

export default function LoginForm({ switchToRegister, returnTo, initialEmail = "" }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Set when the API refuses an unverified account (403).
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setUnverifiedEmail(null);

    const fieldErrors = zodErrors(loginSchema, { email, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    const res = await login(email.trim(), password);

    if (res.success) {
      toast.success("Welcome back!");
      notifyAuthChanged();
      // Back to the page that asked for login (it restores its state and
      // resumes any pending action). `replace` keeps /login out of history so
      // Back doesn't land on the login form again.
      router.replace(resolvePostLoginRedirect(returnTo));
      return;
    }

    if (res.status === 403) setUnverifiedEmail(email.trim());
    setFormError(res.error || "We couldn't log you in. Please try again.");
    setLoading(false);
  };

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to manage your orders, saved items and checkout.</p>
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </div>
      )}
      {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          maxLength={254}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          labelAction={
            <Link href="/forgot-password" className="text-xs font-medium text-primary-ink hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Logging in…
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to HashtagBillionaire?{" "}
        <button type="button" onClick={switchToRegister} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Create an account
        </button>
      </p>
    </>
  );
}
