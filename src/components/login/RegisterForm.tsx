// components/login/RegisterForm.tsx

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import PasswordInput from "./PasswordInput";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";

export default function RegisterForm({ switchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = register(name, email, phone, password);

    if (result.success) {
      router.push("/");
    }
  };

  return (
    <>
      <div className="text-center space-y-1">
        <h1 className="text-xl font-heading font-bold">Create Your Account</h1>
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

        <Button type="submit" variant="hero" size="lg" className="w-full">
          Create Account
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
