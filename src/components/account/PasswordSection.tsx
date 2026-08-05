"use client";

import { useState } from "react";
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

  const [pwMessage, setPwMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Validation rules
  const passwordRules = {
    length: newPw.length >= 8,
    uppercase: /[A-Z]/.test(newPw),
    number: /[0-9]/.test(newPw),
    special: /[^A-Za-z0-9]/.test(newPw),
    match: newPw === confirmPw && confirmPw.length > 0,
  };

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

  // ✅ Final validation
  const pwValid =
    currentPw.length > 0 &&
    Object.values(passwordRules).every(Boolean) &&
    newPw !== currentPw;

  // ✅ API call
  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMessage("Passwords do not match");
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

        setPwMessage("Password updated successfully");

        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");

        // 🔐 Auto logout after success
        setTimeout(() => {
          logout();
          router.push("/login");
        }, 1500);
      } else {
        const msg = res?.data?.message || "Something went wrong";
        message.error(msg);
        setPwMessage(msg);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Failed to update password";
      message.error(msg);
      setPwMessage(msg);
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
              onChange={(e) => {
                setCurrentPw(e.target.value);
                setPwMessage("");
              }}
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
              onChange={(e) => {
                setNewPw(e.target.value);
                setPwMessage("");
              }}
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

          {/* ✅ Validation UI — only list requirements that aren't met yet */}
          {newPw && !Object.values(passwordRules).slice(0, 4).every(Boolean) && (
            <div className="text-xs space-y-1 mt-2">
              {!passwordRules.length && (
                <p className="text-red-500">✖ At least 8 characters</p>
              )}
              {!passwordRules.uppercase && (
                <p className="text-red-500">✖ One uppercase letter</p>
              )}
              {!passwordRules.number && (
                <p className="text-red-500">✖ One number</p>
              )}
              {!passwordRules.special && (
                <p className="text-red-500">✖ One special character</p>
              )}
            </div>
          )}

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
            onChange={(e) => {
              setConfirmPw(e.target.value);
              setPwMessage("");
            }}
            className={inputClass}
            placeholder="Re-enter password"
          />

          {/* Match Indicator */}
          {confirmPw && (
            <p
              className={`text-xs mt-1 ${
                passwordRules.match ? "text-green-600" : "text-red-500"
              }`}
            >
              {passwordRules.match
                ? "✔ Passwords match"
                : "✖ Passwords do not match"}
            </p>
          )}
        </div>

        {/* Message */}
        {pwMessage && (
          <p
            className={`text-sm ${
              pwMessage.toLowerCase().includes("success")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {pwMessage}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="hero"
          className="rounded-lg"
          disabled={!pwValid || loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}