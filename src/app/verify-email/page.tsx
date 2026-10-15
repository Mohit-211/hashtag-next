import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import VerifyEmailClient from "@/components/login/VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthLayout>
  );
}
