"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DeactivateAccountApi, UpdateUserProfileApi } from "@/api/users/users.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { inputClass } from "@/data/constants";
import { nameSchema, optionalUsPhoneSchema, toUsPhoneDigits } from "@/lib/validation";

// Flip to true once the backend POST user/profile route is live.
const PROFILE_EDIT_ENABLED = false;

interface User {
  name?: string;
  email?: string;
  mobile?: string;
}

interface Props {
  user: User | null;
}

export default function ProfileSection({ user }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const router = useRouter();
  const { logout, refreshProfile } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await DeactivateAccountApi();
      logout();
      toast.success("Your account is closed. Sign in within 30 days to restore it.");
      router.push("/");
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!PROFILE_EDIT_ENABLED || saving) return;

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      toast.error(nameResult.error.issues[0]?.message ?? "Enter your full name.");
      return;
    }

    const phoneResult = optionalUsPhoneSchema.safeParse(mobile);
    if (!phoneResult.success) {
      toast.error(phoneResult.error.issues[0]?.message ?? "Enter a valid phone number, or leave it empty.");
      return;
    }

    setSaving(true);
    try {
      const trimmedName = name.trim();
      const digits = mobile.trim() ? toUsPhoneDigits(mobile) : "";
      await UpdateUserProfileApi({ name: trimmedName, mobile: digits || "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refreshProfile();
    } catch {
      // The axios response interceptor already toasts the server error.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <h1 className="text-xl font-heading font-bold text-foreground">
        Profile Information
      </h1>

      <form onSubmit={handleSave} className="space-y-4 max-w-lg" noValidate>
        <input
          value={name}
          maxLength={80}
          readOnly={!PROFILE_EDIT_ENABLED}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass}${!PROFILE_EDIT_ENABLED ? " bg-muted" : ""}`}
          placeholder="Full Name"
        />

        <input
          value={user?.email ?? ""}
          readOnly
          className={`${inputClass} bg-muted`}
        />

        <input
          value={mobile}
          maxLength={10}
          readOnly={!PROFILE_EDIT_ENABLED}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={`${inputClass}${!PROFILE_EDIT_ENABLED ? " bg-muted" : ""}`}
          placeholder="Phone Number"
        />

        {PROFILE_EDIT_ENABLED ? (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>

            {saved && (
              <span className="text-sm flex items-center gap-1 text-foreground">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Profile editing is temporarily unavailable. Contact support if you need to update your name or phone number.
          </p>
        )}
      </form>

      <div className="border-t border-border pt-6 max-w-lg space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Delete account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ll be signed out on every device. You can restore your account by signing in
            again within 30 days.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setConfirmingDelete(true)}>
          Delete account
        </Button>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
          >
            <h3 id="delete-account-title" className="text-lg font-bold text-foreground">
              Delete your account?
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in with this email and password within 30 days to restore it, with your orders,
              addresses, cart and wishlist. After that it&apos;s deleted for good.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="h-11 flex-1 rounded-lg border border-input text-sm font-semibold transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="h-11 flex-1 rounded-lg bg-destructive text-sm font-semibold text-background transition hover:bg-destructive/90 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
