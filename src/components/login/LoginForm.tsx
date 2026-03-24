"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import PasswordInput from "./PasswordInput";
import DemoCredentials from "./DemoCredentials";

import { loginApi } from "@/api/auth/auth.api"; // ✅ import API

interface LoginFormProps {
  switchToRegister: () => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

export default function LoginForm({ switchToRegister }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        email: email.trim(),
        password,
      };

      const res = await loginApi(payload);

      // ✅ adjust based on your API response
      if (res?.data?.success) {
        const token = res?.data?.data?.token;

        // ✅ store token
        if (remember) {
          localStorage.setItem("hastagBillionaire", token);
        } else {
          sessionStorage.setItem("hastagBillionaire", token);
        }

        router.push("/");
      } else {
        setError(res?.data?.message || "Login failed");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
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