"use client";

import { AddToSourcingRequestApi } from "@/api/operations/contact.api";
import { useState, FormEvent } from "react";

/**
 * ConciergeSourcingSection
 * -------------------------------------------------------------
 * Two-column section for the product/form page. Left column
 * carries the concierge sourcing pitch + partner-brand swatches.
 * Right column holds the "Start a custom source request" form,
 * shown inline at all times (no drawer/modal).
 * -------------------------------------------------------------
 */

const SOURCING_PHONE_DISPLAY = "832 752 6450";
const SOURCING_PHONE_TEL = "+18327526450";

export interface SourcingRequestPayload {
  name: string;
  email: string;
  company: string;
  request_type: "BRAND" | "PRODUCT" | "CUSTOM";
  requested_name: string;
  details: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function ConciergeSourcingSection() {
  const [form, setForm] = useState<SourcingRequestPayload>({
    name: "",
    email: "",
    company: "",
    request_type: "BRAND",
    requested_name: "",
    details: "",
  });

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof SourcingRequestPayload) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("company", form.company);
      formData.append("request_type", form.request_type);
      formData.append("requested_name", form.requested_name);
      formData.append("details", form.details);

      await AddToSourcingRequestApi(formData);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      request_type: "BRAND",
      requested_name: "",
      details: "",
    });
    setStatus("idle");
    setError(null);
  };

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm md:p-12">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Left column — pitch */}
        <div>
          <h2 className="mb-4 max-w-lg text-3xl leading-[1.1] md:text-4xl">
            Looking for a Specific Brand or Custom Item?
          </h2>

          <h3 className="mb-5 max-w-lg text-xl font-medium leading-snug md:text-2xl">
            Our Concierge Sourcing Team Has You Covered.
          </h3>

          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            We curate our public catalog to represent the absolute peak of modern
            corporate identity. However, we have direct, elite-tier access to
            thousands of additional retail brands—including Adidas, Columbia,
            Brooks Brothers, RTIC, and more.
          </p>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            If you have existing brand guidelines, specific apparel requirements, or
            a vision for a custom product you don&apos;t see here, we will custom-source
            and decorate it to your exact retail-grade standards.
          </p>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Text our Sourcing Desk directly at{" "}
            <a
              href="tel:8327526450"
              className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
            >
              832 752 6450
            </a>{" "}
            or drop your details below, and we&apos;ll build a custom digital mockup
            deck for your team.
          </p>
        </div>

        {/* Right column — form */}
        <div className="rounded-lg border border-border bg-background/60 p-6 md:p-8">
          <div className="mb-6 border-b border-border pb-5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Sourcing Desk
            </p>
            <h3 className="text-2xl leading-tight">
              {status === "success" ? "Request received" : "Custom source request"}
            </h3>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-start gap-4 py-2">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/70 bg-primary/10 text-primary">
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-iteration-count:2]"
                  aria-hidden="true"
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Our Sourcing Desk will follow up with a custom mockup deck shortly.
                Need it faster? Text{" "}
                <a
                  href={`tel:${SOURCING_PHONE_TEL}`}
                  className="text-primary underline underline-offset-2"
                >
                  {SOURCING_PHONE_DISPLAY}
                </a>
                .
              </p>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field
                label="Name"
                required
                value={form.name}
                onChange={update("name")}
                placeholder="John Smith"
              />

              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="john.smith@company.com"
              />

              <Field
                label="Company"
                value={form.company}
                onChange={update("company")}
                placeholder="Smith & Co."
              />

              <div>
                <label className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                  Request Type
                </label>
                <select
                  value={form.request_type}
                  onChange={update("request_type")}
                  className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="BRAND">Brand</option>
                  <option value="PRODUCT">Product</option>
                  <option value="CUSTOM">Custom Item</option>
                </select>
              </div>

              <Field
                label="Brand or product you need"
                required
                value={form.requested_name}
                onChange={update("requested_name")}
                placeholder="e.g. Adidas Quarter-Zip"
              />

              <div>
                <label className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                  Details / Brand Guidelines
                </label>
                <textarea
                  value={form.details}
                  onChange={update("details")}
                  rows={4}
                  placeholder="Logo files, PMS colors, quantities, deadline, or a link to your brand guidelines..."
                  className="w-full resize-none rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              {status === "error" && (
                <p className="text-[13px] text-red-500">
                  {error ?? "Couldn't send your request. Please try again or text us directly."}
                </p>
              )}

              <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
                >
                  {status === "submitting" ? "Sending..." : "Send to Sourcing Desk"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  ...props
}: {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      <input
        required={required}
        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
        {...props}
      />
    </div>
  );
}