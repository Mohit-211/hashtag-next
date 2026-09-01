"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { changePasswordApi } from "@/api/auth/auth.api";

export default function PasswordSection() {
  const router = useRouter();
  const { logout } = useAuth();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [loading, setLoading] = useState(false);

const getStrength = () => {
  let score = 0;

  if (newPw.length >= 8) score++;
  if (/[A-Z]/.test(newPw)) score++;
  if (/[0-9]/.test(newPw)) score++;
  if (/[^A-Za-z0-9]/.test(newPw)) score++;

  if (score <= 2) return { label: "Weak", color: "text-red-500" };
  if (score === 3) return { label: "Medium", color: "text-yellow-500" };

  return { label: "Strong", color: "text-green-600" };
};

const strength = getStrength();

  // Validation feedback is surfaced via toast only (one message at a time)
  // rather than inline per-field errors.
  const handleChangePassword = async () => {
    if (!currentPw) {
      toast.error("Enter your current password ⚠️");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters ⚠️");
      return;
    }
    if (!/[A-Z]/.test(newPw)) {
      toast.error("New password must include an uppercase letter ⚠️");
      return;
    }
    if (!/[0-9]/.test(newPw)) {
      toast.error("New password must include a number ⚠️");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPw)) {
      toast.error("New password must include a special character ⚠️");
      return;
    }
    if (newPw === currentPw) {
      toast.error("New password must be different from your current password ⚠️");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match ❌");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        old_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      };

      const res = await changePasswordApi(payload);

      if (res?.data?.success) {
        message.success("Password updated. Logging out...");

        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");

        // 🔐 Auto logout after success
        setTimeout(() => {
          logout();
          router.push("/login");
        }, 1500);
      } else {
        message.error(res?.data?.message || "Something went wrong");
      }
    } catch (error: any) {
      // The axios response interceptor already toasts the failure.
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">
          Change Password
        </h2>

        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Keep your account secure by updating your password regularly.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleChangePassword();
        }}
        className="space-y-4 max-w-lg"
      >
        {/* Current Password */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Current Password
          </label>

          <div className="relative">
            <input
              type={showCurrentPw ? "text" : "password"}
              value={currentPw}
              maxLength={128}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Enter current password"
            />

            <button
              type="button"
              onClick={() => setShowCurrentPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showCurrentPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            New Password
          </label>

          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPw}
              maxLength={128}
              onChange={(e) => setNewPw(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Strong password"
            />

            <button
              type="button"
              onClick={() => setShowNewPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showNewPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Strength */}
          {newPw && (
            <p className={`text-xs mt-1 ${strength.color}`}>
              Strength: {strength.label}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPw}
            maxLength={128}
            onChange={(e) => setConfirmPw(e.target.value)}
            className={inputClass}
            placeholder="Re-enter password"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="hero"
          className="rounded-lg"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}