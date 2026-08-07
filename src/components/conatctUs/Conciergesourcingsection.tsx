"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

/**
 * ConciergeSourcingSection
 * -------------------------------------------------------------
 * Drop-in section for the product/form page. Shows the concierge
 * sourcing pitch + partner-brand swatches, and a "Start a custom
 * source request" button that opens the request form in a modal.
 *
 * Usage:
 *   <ConciergeSourcingSection onSubmit={async (data) => { ... }} />
 *
 * If no onSubmit is passed, it falls back to a stub that just logs
 * — wire this to your API route (e.g. POST /api/sourcing-request).
 *
 * Themed off the project's design tokens (globals.css): a light
 * bg-card surface with a bordered outline, and the brand's primary
 * gold reserved for the CTA, accent chip, and focus states.
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
  const [modalOpen, setModalOpen] = useState(false);
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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const update =
    (field: keyof SourcingRequestPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    setModalOpen(false);
    triggerRef.current?.focus();
    if (status === "success") {
      setStatus("idle");
      setForm({ name: "", email: "", company: "", brand: "", details: "" });
    }
  };

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

  // lock body scroll + close on Escape while modal is open
  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  return (
    <section className="rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm md:p-12">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        Sourcing Desk · By Request Only
      </p>
      <h2 className="mb-4 text-3xl leading-[1.1] md:text-4xl">
        Looking for a specific brand
        <br />
        or a custom item?
      </h2>
      <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Our public catalog represents the peak of modern corporate identity —
        but our Concierge Sourcing Team reaches further. We hold direct,
        elite-tier access to thousands of additional retail brands, and
        we&apos;ll custom-source and decorate any of them to your exact
        retail-grade standard.
      </p>

      {/* brand swatches */}
      <div className="mt-7">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          A sample of what&apos;s reachable
        </p>
        <div className="flex flex-wrap gap-2">
          {PARTNER_BRANDS.map((brand) => (
            <span
              key={brand}
              className="rounded-full border border-border px-3 py-1 text-[12.5px] text-muted-foreground"
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

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button
          ref={triggerRef}
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
          aria-controls="concierge-sourcing-modal"
        >
          Start a custom source request
        </button>

        <div className="text-[13px] text-muted-foreground">
          Prefer to talk it through?{" "}
          <a
            href={`tel:${SOURCING_PHONE_TEL}`}
            className="font-medium text-foreground underline underline-offset-2 transition hover:text-primary"
          >
            {SOURCING_PHONE_DISPLAY}
          </a>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="concierge-sourcing-modal-title"
            id="concierge-sourcing-modal"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Sourcing Desk
                </p>
                <h3 id="concierge-sourcing-modal-title" className="text-2xl leading-tight">
                  {status === "success" ? "Request received" : "Custom source request"}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-start gap-4">
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
                  onClick={closeModal}
                  className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
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
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                    Details / brand guidelines
                  </label>
                  <textarea
                    value={form.details}
                    onChange={update("details")}
                    rows={4}
                    placeholder="Logo files, PMS colors, quantities, deadline, or a link to your brand guidelines..."
                    className="w-full resize-none rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-4 md:col-span-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
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
      )}
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
        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      />
    </div>
  );
}