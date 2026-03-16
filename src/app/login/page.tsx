"use client";

import { useState } from "react";
import Layout from "@/components/layout/Layout";

import AuthCard from "@/components/login/AuthCard";
import LoginForm from "@/components/login/LoginForm";
import RegisterForm from "@/components/login/RegisterForm";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container max-w-md">
          <AuthCard>
            {mode === "login" ? (
              <LoginForm switchToRegister={() => setMode("register")} />
            ) : (
              <RegisterForm switchToLogin={() => setMode("login")} />
            )}
          </AuthCard>
        </div>
      </section>
    </Layout>
  );
}
