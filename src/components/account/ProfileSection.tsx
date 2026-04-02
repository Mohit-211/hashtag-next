"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";

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

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // later this will call API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-heading font-bold text-foreground">
        Profile Information
      </h2>

      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Full Name"
        />

        <input
          value={user?.email ?? ""}
          readOnly
          className={`${inputClass} bg-secondary`}
        />

        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
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
    </div>
  );
}
