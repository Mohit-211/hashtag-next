"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { registerApi } from "@/api/auth/auth.api";
import { emailSchema, mobileSchema, nameSchema, PASSWORD_MAX_LENGTH, passwordSchema, zodErrors } from "@/lib/validation";
import { withReturnTo } from "@/lib/authRedirect";
import { PasswordChecklist, PasswordField, TextField } from "./FormField";

interface RegisterFormProps {
  switchToLogin: () => void;
  /** Sanitized page to return to once the new account has logged in. */
  returnTo?: string | null;
}

// Same rules as change/reset password (all four), so an account can never be
// created with a password the rest of the site would reject.
const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    mobile: mobileSchema,
    password: passwordSchema,
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

export default function RegisterForm({ switchToLogin, returnTo }: RegisterFormProps) {
  const router = useRouter();

  const [values, setValues] = useState({ name: "", email: "", mobile: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fieldErrors = zodErrors(registerSchema, values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("email", values.email.trim());
      formData.append("mobile", values.mobile);
      // Passwords are sent exactly as typed — login doesn't trim either.
      formData.append("password", values.password);
      formData.append("confirm_password", values.confirm);

      const res = await registerApi(formData);
      if (res?.data?.success || res?.data?.status) {
        toast.success(res?.data?.message || "Account created. Check your email for the verification code.");
        router.push(
          withReturnTo(`/verify-otp?type=email_varification&email=${encodeURIComponent(values.email.trim())}`, returnTo)
        );
        return;
      }
      toast.error(res?.data?.message || "Registration failed. Please try again.");
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Order custom products, track deliveries and reorder in seconds.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={values.name}
          maxLength={80}
          error={errors.name}
          onChange={set("name")}
        />
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={values.email}
          maxLength={254}
          error={errors.email}
          onChange={set("email")}
        />
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-digit number"
          value={values.mobile}
          maxLength={10}
          error={errors.mobile}
          onChange={set("mobile")}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={values.password}
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.password}
          onChange={set("password")}
          hint={<PasswordChecklist password={values.password} />}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirm}
          maxLength={PASSWORD_MAX_LENGTH}
          error={errors.confirm}
          onChange={set("confirm")}
        />

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-medium text-foreground underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="font-medium text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={switchToLogin} className="font-semibold text-foreground underline-offset-4 hover:underline">
          Log in
        </button>
      </p>
    </>
  );
}
