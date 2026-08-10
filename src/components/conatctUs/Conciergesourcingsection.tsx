"use client";

import { useState, FormEvent } from "react";

/**
 * ConciergeSourcingSection
 * -------------------------------------------------------------
 * Two-column section for the product/form page. Left column
 * carries the concierge sourcing pitch + partner-brand swatches.
 * Right column holds the "Start a custom source request" form,
 * shown inline at all times (no drawer/modal).
 *
 * Usage:
 *   <ConciergeSourcingSection onSubmit={async (data) => { ... }} />
 *
 * If no onSubmit is passed, it falls back to a stub that just logs
 * — wire this to your API route (e.g. POST /api/sourcing-request).
 * -------------------------------------------------------------
 */

const PARTNER_BRANDS = [
  "Adidas",
  "Columbia",
  "Brooks Brothers",
  "RTIC",
  "The North Face",
  "Carhartt",
];

const SOURCING_PHONE_DISPLAY = "832 752 6450";
const SOURCING_PHONE_TEL = "+18327526450";

export interface SourcingRequestPayload {
  name: string;
  email: string;
  company: string;
  brand: string;
  details: string;
}

interface ConciergeSourcingSectionProps {
  onSubmit?: (data: SourcingRequestPayload) => Promise<void> | void;
}

export default function ConciergeSourcingSection({
  onSubmit,
}: ConciergeSourcingSectionProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [form, setForm] = useState<SourcingRequestPayload>({
    name: "",
    email: "",
    company: "",
    brand: "",
    details: "",
  });

  const update =
    (field: keyof SourcingRequestPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      if (onSubmit) {
        await onSubmit(form);
      } else {
        // eslint-disable-next-line no-console
        console.log("Sourcing request submitted:", form);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setForm({ name: "", email: "", company: "", brand: "", details: "" });
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
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            <span className="h-px w-4 bg-primary/60" aria-hidden="true" />
            Sourcing Desk · By Request Only
          </p>
          <h2 className="mb-4 max-w-lg text-3xl leading-[1.1] md:text-4xl">
            Looking for a specific brand or a custom item?
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Our public catalog represents the peak of modern corporate identity —
            but our Concierge Sourcing Team reaches further. We hold direct,
            elite-tier access to thousands of additional retail brands, and
            we&apos;ll custom-source and decorate any of them to your exact
            retail-grade standard.
          </p>

          <div className="mt-7">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              A sample of what&apos;s reachable
            </p>
            <div className="flex flex-wrap gap-2">
              {PARTNER_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border border-border px-3 py-1 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {brand}
                </span>
              ))}
              <span className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-[12.5px] font-medium text-foreground">
                + thousands more
              </span>
            </div>
          </div>

          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Send existing brand guidelines, specific apparel requirements, or a
            vision for something you don&apos;t see here — we&apos;ll build a
            custom digital mockup deck for your team.
          </p>

          <div className="mt-8 text-[13px] text-muted-foreground">
            Prefer to talk it through?{" "}
            <a
              href={`tel:${SOURCING_PHONE_TEL}`}
              className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
            >
              {SOURCING_PHONE_DISPLAY}
            </a>
          </div>
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
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-iteration-count:2]" aria-hidden="true" />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Our Sourcing Desk will follow up with a custom mockup deck
                shortly. Need it faster? Text{" "}
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
                placeholder="Jordan Blake"
              />
              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="jordan@company.com"
              />
              <Field
                label="Company"
                value={form.company}
                onChange={update("company")}
                placeholder="Company / Team name"
              />
              <Field
                label="Brand or product you need"
                value={form.brand}
                onChange={update("brand")}
                placeholder="e.g. Adidas quarter-zips, size run S–3XL"
              />
              <div>
                <label className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                  Details / brand guidelines
                </label>
                <textarea
                  value={form.details}
                  onChange={update("details")}
                  rows={4}
                  placeholder="Logo files, PMS colors, quantities, deadline, or a link to your brand guidelines..."
                  className="w-full resize-none rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
                >
                  {status === "submitting" ? "Sending..." : "Send to Sourcing Desk"}
                </button>
                {status === "error" && (
                  <span className="text-[13px] text-destructive">
                    Something went wrong — please try again or text{" "}
                    {SOURCING_PHONE_DISPLAY}.
                  </span>
                )}
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