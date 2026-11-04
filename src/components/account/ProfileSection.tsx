"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { DeactivateAccountApi } from "@/api/users/users.api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { inputClass } from "@/data/constants";
import { mobileSchema, nameSchema } from "@/lib/validation";

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
  const [saved, setSaved] = useState(false);

  const router = useRouter();
  const { logout } = useAuth();
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
      // The axios response interceptor already toasts the failure.
      console.error(err);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      toast.error(nameResult.error.issues[0]?.message ?? "Enter your full name ⚠️");
      return;
    }

    const mobileResult = mobileSchema.safeParse(mobile);
    if (!mobileResult.success) {
      toast.error(mobileResult.error.issues[0]?.message ?? "Enter a valid mobile number ⚠️");
      return;
    }

    // later this will call API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-heading font-bold text-foreground">
        Profile Information
      </h2>

      <form onSubmit={handleSave} className="space-y-4 max-w-lg" noValidate>
        <input
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
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
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={inputClass}
          placeholder="Phone Number"
        />

        <div className="flex items-center gap-3">
          <Button type="submit">Save Changes</Button>

          {saved && (
            <span className="text-sm flex items-center gap-1 text-foreground">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
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
