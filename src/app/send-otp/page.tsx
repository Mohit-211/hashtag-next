"use client";

import { Suspense } from "react";
import AuthCard from "@/components/login/AuthCard";
import SendOtpClient from "./SendOtpClient";

export const dynamic = "force-dynamic";

export default function SendOtpPage() {
  return (
    <section className="py-12 lg:py-20">
      <div className="container max-w-md">
        <AuthCard>
          <Suspense fallback={<div className="text-center py-10">Loading…</div>}>
            <SendOtpClient />
          </Suspense>
        </AuthCard>
      </div>
    </section>
  );
}