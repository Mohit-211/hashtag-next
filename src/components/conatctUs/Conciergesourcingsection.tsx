"use client";

import { AddToSourcingRequestApi } from "@/api/operations/contact.api";
import { useEffect, useId, useRef, useState, FormEvent } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { emailSchema, nameSchema, textSchema, zodErrors } from "@/lib/validation";
import TurnstileWidget, { TURNSTILE_FIELD, TURNSTILE_SITE_KEY } from "@/components/common/TurnstileWidget";

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];
const ALLOWED_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.svg";
const MAX_IMAGES = 10;

export interface SourcingRequestPayload {
  name: string;
  email: string;
  company: string;
  requested_name: string;
  details: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<Record<keyof SourcingRequestPayload, string>>;

const sourcingRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: textSchema({ required: false, max: 120 }),
  requested_name: textSchema({ min: 2, max: 200 }),
  details: textSchema({ required: false, max: 2000 }),
});

export default function ConciergeSourcingSection() {
  const [form, setForm] = useState<SourcingRequestPayload>({
    name: "",
    email: "",
    company: "",
    requested_name: "",
    details: "",
  });

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsId = useId();
  const fileInputId = useId();
  const uploadHintId = useId();

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update =
    (field: keyof SourcingRequestPayload) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        // A field flagged by the last submit is re-checked as it changes, so its
        // aria-invalid state and message stay accurate and clear once it's fixed.
        if (fieldErrors[field]) {
          const check = sourcingRequestSchema.shape[field].safeParse(value);
          setFieldErrors((prev) => ({ ...prev, [field]: check.success ? undefined : check.error.issues[0]?.message }));
        }
      };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const typeFiltered = selected.filter((file) => ALLOWED_IMAGE_TYPES.includes(file.type));
    const rejectedByType = selected.length - typeFiltered.length;

    const remainingSlots = Math.max(0, MAX_IMAGES - files.length);
    const accepted = typeFiltered.slice(0, remainingSlots);
    const rejectedByLimit = typeFiltered.length - accepted.length;

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
      setPreviews((prev) => [...prev, ...accepted.map((file) => URL.createObjectURL(file))]);
    }

    if (rejectedByLimit > 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images.`);
    } else if (rejectedByType > 0) {
      toast.error("Only JPG, PNG, or SVG files are allowed.");
    }

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation feedback is surfaced via toast only (one message at a time)
  // rather than visible inline per-field errors. For screen readers, every
  // invalid field is also marked aria-invalid and described by its message
  // (visually hidden, see FieldError).
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = sourcingRequestSchema.safeParse(form);
    if (!result.success) {
      setFieldErrors(zodErrors(sourcingRequestSchema, form));
      toast.error(result.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }
    setFieldErrors({});
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error("Please complete the check above the button.");
      return;
    }

    setStatus("submitting");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("company", form.company);
      formData.append("requested_name", form.requested_name);
      formData.append("details", form.details);
      if (turnstileToken) formData.append(TURNSTILE_FIELD, turnstileToken);
      files.forEach((file) => formData.append("images", file));

      await AddToSourcingRequestApi(formData);
      setStatus("success");
    } catch (err) {
      // The axios response interceptor already toasts the failure.
      console.error(err);
      setStatus("error");
      setTurnstileReset((n) => n + 1);
    } finally {
      setTurnstileToken(null);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      requested_name: "",
      details: "",
    });
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setFieldErrors({});
    setStatus("idle");
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
          <h1 className="mb-4 max-w-lg text-3xl leading-[1.1] md:text-4xl">
            Looking for a Specific Brand or Custom Item?
          </h1>

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
              className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary-ink"
            >
              832 752 6450
            </a>{" "}
            or drop your details.
          </p>
        </div>

        {/* Right column — form */}
        <div className="rounded-lg border border-border bg-background/60 p-6 md:p-8">
          <div className="mb-6 border-b border-border pb-5">
            <p className="mb-1.5 inline-block bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Sourcing Desk
            </p>
            <h3 className="text-2xl leading-tight">
              {status === "success" ? "Request received" : "Custom source request"}
            </h3>
          </div>

          {status === "success" ? (
            <div className="flex flex-col items-start gap-4 py-2">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/70 bg-primary/10 text-primary-ink">
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
                  className="text-primary-ink underline underline-offset-2"
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
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <Field
                label="Name"
                required
                maxLength={80}
                value={form.name}
                onChange={update("name")}
                placeholder="John Smith"
                error={fieldErrors.name}
              />

              <Field
                label="Email"
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={update("email")}
                placeholder="john.smith@company.com"
                error={fieldErrors.email}
              />

              <Field
                label="Company"
                maxLength={120}
                value={form.company}
                onChange={update("company")}
                placeholder="Smith & Co."
                error={fieldErrors.company}
              />


              <Field
                label="Brand or product you need"
                required
                maxLength={200}
                value={form.requested_name}
                onChange={update("requested_name")}
                placeholder="e.g. Adidas Quarter-Zip"
                error={fieldErrors.requested_name}
              />

              <div>
                <label htmlFor={detailsId} className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                  Details / Brand Guidelines
                </label>
                <textarea
                  id={detailsId}
                  aria-invalid={fieldErrors.details ? true : undefined}
                  aria-describedby={fieldErrors.details ? `${detailsId}-error` : undefined}
                  value={form.details}
                  onChange={update("details")}
                  rows={4}
                  maxLength={2000}
                  placeholder="Logo files, PMS colors, quantities, deadline, or a link to your brand guidelines..."
                  className="w-full resize-none rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                <FieldError id={`${detailsId}-error`} message={fieldErrors.details} />
              </div>

              <div>
                {/* Clicking the label opens the file picker, like the button below.
                    The input is disabled at the limit so the label can't bypass it. */}
                <label htmlFor={fileInputId} className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                  Logo / Reference Images
                </label>

                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  type="file"
                  accept={ALLOWED_IMAGE_ACCEPT}
                  multiple
                  disabled={files.length >= MAX_IMAGES}
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_IMAGES}
                  aria-describedby={uploadHintId}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3.5 py-4 text-[13px] text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-background"
                >
                  <Upload size={16} />
                  {files.length >= MAX_IMAGES
                    ? `Maximum ${MAX_IMAGES} images reached`
                    : "Click to upload logo or images"}
                </button>

                {previews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {previews.map((src, index) => (
                      <div
                        key={src}
                        className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview */}
                        <img
                          src={src}
                          alt={files[index]?.name ?? "Uploaded file"}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          aria-label={`Remove ${files[index]?.name ?? "file"}`}
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p id={uploadHintId} className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ImageIcon size={12} />
                  PNG, JPG, or SVG — up to {MAX_IMAGES} images ({files.length}/{MAX_IMAGES}).
                </p>
              </div>

              <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
                <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileReset} />

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
  error,
  id,
  ...props
}: {
  label: string;
  required?: boolean;
  /** Message from the last submit; read by screen readers only (see FieldError). */
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {/* aria-required carries this for screen readers, so the name stays "Name", not "Name star". */}
        {required && <span className="text-primary-ink" aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

/**
 * Visually hidden field error. The form shows validation as a toast (which is
 * announced through sonner's live region); this text is what a screen reader
 * reads with the field, via aria-describedby, when the user moves to it.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="sr-only">
      {message}
    </p>
  );
}