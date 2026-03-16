import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { inputClass } from "../../data/constants";

interface Props {
  user: any;
}

const ProfileSection = ({ user }: Props) => {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

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
        />

        <input
          value={user?.email}
          readOnly
          className={`${inputClass} bg-secondary`}
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />

        <div className="flex items-center gap-3">
          <Button type="submit">Save Changes</Button>

          {saved && (
            <span className="text-sm flex items-center gap-1">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSection;
