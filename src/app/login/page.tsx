"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AuthLayout from "@/components/login/AuthLayout";
import LoginForm from "@/components/login/LoginForm";
import RegisterForm from "@/components/login/RegisterForm";
import { sanitizeReturnTo } from "@/lib/authRedirect";
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

      {mode === "login" ? (
        <LoginForm returnTo={returnTo} switchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm returnTo={returnTo} switchToLogin={() => setMode("login")} />
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
