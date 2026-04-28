"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordInput from "./PasswordInput";
import DemoCredentials from "./DemoCredentials";
// import { loginApi } from "@/api/auth/auth.api";
// ✅ Sonner toast
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
interface LoginFormProps {
  switchToRegister: () => void;
}
const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm";
// Message returned by API when user hasn't verified OTP
const UNVERIFIED_MESSAGE = "User is not verified yet.Please verify Your Otp First";
export default function LoginForm({ switchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
 const { login } = useAuth();

const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error("Email and password are required ⚠️");
    return;
  }

  setLoading(true);

  const res = await login(email.trim(), password);

  if (res.success) {
    toast.success("Login successful 🎉");
    router.push("/");
  } else {
    if (res.error?.toLowerCase().includes("not verified")) {
      toast.warning("Please verify your email first 📧");

      router.push(
        `/verify-otp?type=email_varification&email=${encodeURIComponent(email.trim())}`
      );
      return;
    }

    toast.error(res.error || "Login failed ❌");
  }

  setLoading(false);
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
            onClick={() => router.push("/send-otp")}
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot Password?
          </button>
        </div>
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