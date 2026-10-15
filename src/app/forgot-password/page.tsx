import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import ForgotPasswordRequest from "@/components/login/ForgotPasswordRequest";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <ForgotPasswordRequest />
      </Suspense>
    </AuthLayout>
  );
}
