// components/support/SupportInfo.tsx

import { Mail, Clock } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

export default function SupportInfo() {
  return (
    <div className="bg-surface border rounded-xl p-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="flex gap-3">
          <Mail className="h-5 w-5 text-primary-ink" />

          <div>
            <p className="font-semibold">Email Support</p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-muted-foreground text-sm hover:underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-primary-ink" />

          <div>
            <p className="font-semibold">Response Time</p>

            <p className="text-muted-foreground text-sm">Within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}
