"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";

export default function PasswordSection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [pwMessage, setPwMessage] = useState("");

  const pwValid =
    currentPw.length > 0 && newPw.length >= 6 && newPw === confirmPw;

  const handleChangePassword = () => {
    if (newPw !== confirmPw) {
      setPwMessage("Passwords do not match");
      return;
    }

    // Demo logic (replace with API later)
    setPwMessage("Password updated successfully");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">
          Change Password
        </h2>

        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Keep your account secure by updating your password regularly. Choose a
          strong password that you don't use on other websites.
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
          <label className="text-sm font-medium text-foreground block mb-1.5">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
          <label className="text-sm font-medium text-foreground block mb-1.5">
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
              placeholder="Min 6 characters"
            />

            <button
              type="button"
              onClick={() => setShowNewPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Confirm New Password
          </label>

          <input
            type="password"
            value={confirmPw}
            onChange={(e) => {
              setConfirmPw(e.target.value);
              setPwMessage("");
            }}
            className={inputClass}
            placeholder="Re-enter new password"
          />
        </div>

        {/* Message */}
        {pwMessage && (
          <p
            className={`text-sm ${
              pwMessage.includes("success")
                ? "text-foreground"
                : "text-destructive"
            }`}
          >
            {pwMessage}
          </p>
        )}

        <Button
          type="submit"
          variant="hero"
          className="rounded-lg"
          disabled={!pwValid}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
