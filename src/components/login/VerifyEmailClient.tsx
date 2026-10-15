"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifyEmailApi } from "@/api/auth/auth.api";
import { apiMessage } from "@/lib/errors";
import ResendVerification from "./ResendVerification";

type Outcome = { ok: true; email: string } | { ok: false; message: string };

// The emailed token is 64 hex characters.
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

// A link works once — a second call answers 400. React StrictMode runs effects
// twice in development, so the request is shared per token at module level.
const requests = new Map<string, Promise<Outcome>>();
const verifyOnce = (token: string) => {
  let request = requests.get(token);
  if (!request) {
    request = verifyEmailApi({ token })
      .then((res): Outcome => ({ ok: true, email: res?.data?.data?.email ?? "" }))
      .catch(
        (err): Outcome => ({ ok: false, message: apiMessage(err) || "This link is invalid or has expired." })
      );
    requests.set(token, request);
  }
  return request;
};

/** Opened from the verification email: /verify-email?token=… */
export default function VerifyEmailClient() {
  const token = useSearchParams().get("token") ?? "";
  const validToken = TOKEN_PATTERN.test(token);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (!validToken) return;
    verifyOnce(token).then(setOutcome);
  }, [token, validToken]);

  const result: Outcome | null = validToken ? outcome : { ok: false, message: "This link is invalid or has expired." };

  if (!result) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> Verifying your email…
      </div>
    );
  }

  if (result.ok) {
    const loginHref = result.email ? `/login?email=${encodeURIComponent(result.email)}` : "/login";
    return (
      <>
        <div className="space-y-1.5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your email has been verified</h1>
          <p className="text-sm text-muted-foreground">Your account is ready. Log in to start ordering.</p>
        </div>
        <Button asChild variant="hero" size="lg" className="w-full">
          <Link href={loginHref}>Log in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">This link can&apos;t be used</h1>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        <p className="text-sm text-muted-foreground">
          Verification links work once and expire after 2 hours. Enter your email to get a new one.
        </p>
      </div>
      <ResendVerification askForEmail />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login?mode=register" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Create an account again
        </Link>
      </p>
    </>
  );
}
