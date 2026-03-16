// components/support/SupportContactForm.tsx

"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SUBJECTS } from "@/data/supportData";
import { CheckCircle } from "lucide-react";

interface SupportFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function SupportContactForm() {
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [form, setForm] = useState<SupportFormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Full Name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              className="input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
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
