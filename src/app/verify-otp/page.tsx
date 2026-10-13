import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import VerifyOtpClient from "./VerifyOtpClient";

export default function VerifyOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <VerifyOtpClient />
      </Suspense>
    </AuthLayout>
  );
}
