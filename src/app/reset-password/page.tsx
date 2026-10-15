import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import ResetPasswordClient from "@/components/login/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <ResetPasswordClient />
      </Suspense>
    </AuthLayout>
  );
}
