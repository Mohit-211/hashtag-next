// components/support/SupportContactForm.tsx

"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = supportFormSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="mb-16">
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-heading font-bold">Contact Support</h2>

        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-primary" />

            <p className="text-muted-foreground">
              Your message has been received.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <input
              placeholder="Full Name"
              className="input"
              maxLength={80}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />

            <input
              placeholder="Email"
              type="email"
              className="input"
              maxLength={254}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />

            <select
              className="input"
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
              className="input"
              maxLength={2000}
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
            />

            <Button type="submit" variant="hero">
              Send Message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
