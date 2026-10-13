import { Suspense } from "react";
import AuthLayout from "@/components/login/AuthLayout";
import SendOtpClient from "./SendOtpClient";

export default function SendOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}>
        <SendOtpClient />
      </Suspense>
    </AuthLayout>
  );
}
