"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AuthCard from "@/components/login/AuthCard";
import LoginForm from "@/components/login/LoginForm";
import RegisterForm from "@/components/login/RegisterForm";
import { sanitizeReturnTo } from "@/lib/authRedirect";

function LoginContent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  // Where the user came from — they go back there after logging in, or via
  // the back link if they decide not to.
  const returnTo = sanitizeReturnTo(useSearchParams().get("returnTo"));

  return (
    <section className="py-12 lg:py-20">
      <div className="container max-w-md">
        {returnTo && (
          <Link
            href={returnTo}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to where you were
          </Link>
        )}
        <AuthCard>
          {mode === "login" ? (
            <LoginForm returnTo={returnTo} switchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm returnTo={returnTo} switchToLogin={() => setMode("login")} />
          )}
        </AuthCard>
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
