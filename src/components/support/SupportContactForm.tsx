// components/support/SupportContactForm.tsx

"use client";

import { inputClass } from "@/data/constants";
import { useState, FormEvent } from "react";
import { AddToContactApi } from "@/api/operations/contact.api";
import { Button } from "@/components/ui/button";
import TurnstileWidget, { TURNSTILE_FIELD, TURNSTILE_SITE_KEY } from "@/components/common/TurnstileWidget";
import { SUBJECTS } from "@/data/supportData";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { emailSchema, nameSchema, textSchema } from "@/lib/validation";

interface SupportFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const supportFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, "Please select a subject."),
  message: textSchema({ min: 10, max: 2000 }),
});

export default function SupportContactForm() {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const [form, setForm] = useState<SupportFormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const setField = (field: keyof SupportFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Validation feedback is surfaced via toast only (one message at a time)
  // rather than inline per-field errors.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = supportFormSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error("Please complete the check above the button.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("reason", form.subject);
      formData.append("message", form.message);
      if (turnstileToken) formData.append(TURNSTILE_FIELD, turnstileToken);

      await AddToContactApi(formData);
      setSubmitted(true);
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
      setTurnstileReset((n) => n + 1);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-16">
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-heading font-bold">Contact Support</h2>

        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-primary-ink" />

            <p className="text-muted-foreground">
              Your message has been received.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <input
              placeholder="Full Name"
              className={inputClass}
              maxLength={80}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />

            <input
              placeholder="Email"
              type="email"
              className={inputClass}
              maxLength={254}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />

            <select
              className={inputClass}
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
            >
              <option value="">Select Subject</option>

              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <textarea
              rows={5}
              placeholder="Your message"
              className={inputClass}
              maxLength={2000}
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
            />

            <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileReset} />

            <Button type="submit" variant="hero" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
