"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import PasswordInput from "./PasswordInput";

import { registerApi } from "./../../api/auth/auth.api"; // ✅ import your API

interface RegisterFormProps {
  switchToLogin: () => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

export default function RegisterForm({ switchToLogin }: RegisterFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ basic validation
    if (!name || !email || !phone || !password || !confirm) {
      setError("All fields are required");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        name,
        email,
        phone,
        password,
      };

      const res = await registerApi(payload);

      // ✅ handle success (depends on your API structure)
      if (res?.data?.success) {
        router.push("/"); // or "/login"
      } else {
        setError(res?.data?.message || "Registration failed");
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
        <h1 className="text-xl font-heading font-bold">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />

        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm Password"
        />

        {/* ✅ Error Message */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <button
          onClick={switchToLogin}
          className="font-semibold hover:underline"
        >
          Login
        </button>
      </p>
    </>
  );
}