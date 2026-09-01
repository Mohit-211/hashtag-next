"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import PasswordInput from "./PasswordInput";
import { registerApi } from "./../../api/auth/auth.api";

// ✅ Sonner toast
import { toast } from "sonner";
import { emailSchema, nameSchema } from "@/lib/validation";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

// ─── Password Strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: number;       // 0–4
  label: string;
  color: string;       // Tailwind text color
  barColor: string;    // Tailwind bg color
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", color: "", barColor: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: StrengthResult[] = [
    { score: 1, label: "Weak",      color: "text-red-500",    barColor: "bg-red-500"    },
    { score: 2, label: "Fair",      color: "text-orange-400", barColor: "bg-orange-400" },
    { score: 3, label: "Good",      color: "text-yellow-500", barColor: "bg-yellow-500" },
    { score: 4, label: "Strong",    color: "text-green-500",  barColor: "bg-green-500"  },
  ];

  return levels[score - 1] ?? { score: 0, label: "", color: "", barColor: "" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterForm({ switchToLogin }: RegisterFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);

  // ── Mobile: allow only digits, max 10 ──────────────────────────────────────
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(onlyDigits);
  };

  // ── Password strength ──────────────────────────────────────────────────────
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  // ── Submit ─────────────────────────────────────────────────────────────────
  // Validation feedback is surfaced via toast only (one message at a time),
  // checked in field order, rather than inline per-field errors.
  const handleRegister = async () => {
    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      toast.error(nameResult.error.issues[0]?.message ?? "Enter your full name ⚠️");
      return;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.issues[0]?.message ?? "Enter a valid email address ⚠️");
      return;
    }

    if (mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits ❌");
      return;
    }

    if (!password) {
      toast.error("Password is required ⚠️");
      return;
    }

    if (strength.score < 3) {
      toast.error("Please choose a stronger password (at least Good) 🔒");
      return;
    }

    if (!confirm) {
      toast.error("Please confirm your password ⚠️");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match ❌");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("mobile", mobile.trim());
      formData.append("password", password.trim());
      formData.append("confirm_password", confirm.trim());

      const res = await registerApi(formData);

      if (res?.data?.success || res?.data?.status) {
        toast.success(
          res?.data?.message ||
            "User Created Successfully. Please check your email to verify your account 🎉"
        );

        setTimeout(() => {
          router.push(
            `/verify-otp?type=email_varification&email=${encodeURIComponent(email)}`
          );
        }, 1500);
      } else {
        toast.error(res?.data?.message || "Registration failed ❌");
      }
    } catch (err: any) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-heading font-bold">Create Your Account</h1>
        <p className="text-sm text-muted-foreground">
          Start your journey with us 🚀
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <input
          placeholder="Full Name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          maxLength={254}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        {/* ── Mobile field ── */}
        <div className="space-y-1">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Mobile Number (10 digits)"
            value={mobile}
            onChange={handleMobileChange}
            maxLength={10}
            className={inputClass}
          />
          {mobile.length === 10 && (
            <p className="text-xs text-green-500 px-1">✓ Valid mobile number</p>
          )}
        </div>

        {/* ── Password field + strength meter ── */}
        <div className="space-y-2">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            maxLength={128}
          />

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-1 px-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      strength.score >= level
                        ? strength.barColor
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${strength.color}`}>
                  {strength.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {strength.score < 3
                    ? "Use 8+ chars, uppercase, number & symbol"
                    : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Confirm password ── */}
        <div className="space-y-1">
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm Password"
            maxLength={128}
          />
          {confirm.length > 0 && !passwordMismatch && (
            <p className="text-xs text-green-500 px-1">✓ Passwords match</p>
          )}
        </div>

        {/* Button */}
        <Button
          type="button"
          onClick={handleRegister}
          variant="hero"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </div>

      {/* Footer */}
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="font-semibold text-primary hover:underline"
        >
          Login
        </button>
      </p>
    </>
  );
}