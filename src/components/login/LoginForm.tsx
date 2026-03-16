// components/login/LoginForm.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

import PasswordInput from "./PasswordInput";
import DemoCredentials from "./DemoCredentials";

interface LoginFormProps {
  switchToRegister: () => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

export default function LoginForm({ switchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = login(email.trim(), password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-xl font-heading font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to continue shopping.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(!!v)}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="hero" size="lg" className="w-full">
          Login
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={switchToRegister}
          className="font-semibold hover:underline"
        >
          Sign Up
        </button>
      </p>

      <DemoCredentials />
    </>
  );
}
