"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AuthLayout from "@/components/login/AuthLayout";
import LoginForm from "@/components/login/LoginForm";
import RegisterForm from "@/components/login/RegisterForm";
import { SESSION_EXPIRED_REASON, sanitizeReturnTo } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

function LoginContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // `?mode=register` deep-links straight to sign-up.
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  // Where the user came from — they go back there after logging in, or via
  // the back link if they decide not to.
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  // An expired session sends the shopper here with `reason=session_expired`
  // (ApiErrorHandler). The notice stays for this visit; the flag then leaves the
  // URL (returnTo and the rest are kept), so a reload or a shared link doesn't
  // show it again.
  const reason = searchParams.get("reason");
  const [sessionExpired] = useState(() => reason === SESSION_EXPIRED_REASON);
  useEffect(() => {
    if (reason !== SESSION_EXPIRED_REASON) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("reason");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [reason, searchParams, pathname, router]);

  const setMode = (next: Mode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "register") params.set("mode", "register");
    else params.delete("mode");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <AuthLayout
      footer={
        returnTo && (
          <Link href={returnTo} className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground">
            <ArrowLeft size={14} />
            Back to where you were
          </Link>
        )
      }
    >
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-lg bg-muted p-1">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => setMode(tab)}
            className={cn(
              "h-9 rounded-md text-sm font-semibold transition-colors",
              mode === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "login" && sessionExpired && (
        <div role="alert" className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground">
          Your session has expired. Please login again.
        </div>
      )}

      {mode === "login" ? (
        <LoginForm
          returnTo={returnTo}
          initialEmail={searchParams.get("email") ?? ""}
          switchToRegister={() => setMode("register")}
        />
      ) : (
        <RegisterForm switchToLogin={() => setMode("login")} />
      )}
    </AuthLayout>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
