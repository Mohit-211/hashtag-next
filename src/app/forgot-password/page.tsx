"use client";

import React, { Suspense } from "react";
import AuthCard from "@/components/login/AuthCard";
import ForgotPasswordClient from "@/components/login/Forgotpasswordclient/Forgotpasswordclient";

const ForgotPage = () => {
  return (
    <section className="py-12 lg:py-20">
      <div className="container max-w-md">
        <AuthCard>
          <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordClient />
          </Suspense>
        </AuthCard>
      </div>
    </section>
  );
};

export default ForgotPage;