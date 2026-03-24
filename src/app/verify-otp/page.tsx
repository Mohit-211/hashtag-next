"use client";

import { Suspense } from "react";
import AuthCard from "@/components/login/AuthCard";
import VerifyOtpClient from "./VerifyOtpClient";

export const dynamic = "force-dynamic";

export default function VerifyOtpPage() {
  return (
    <section className="py-12 lg:py-20">
      <div className="container max-w-md">
        <AuthCard>
          <Suspense fallback={<div className="text-center py-10">Loading…</div>}>
            <VerifyOtpClient />
          </Suspense>
        </AuthCard>
      </div>
    </section>
  );
}