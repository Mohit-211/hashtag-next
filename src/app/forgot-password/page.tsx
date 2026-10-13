import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import ForgotPasswordClient from "@/components/login/Forgotpasswordclient/Forgotpasswordclient";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <ForgotPasswordClient />
      </Suspense>
    </AuthLayout>
  );
}
