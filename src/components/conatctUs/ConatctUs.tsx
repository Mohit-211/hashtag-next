"use client";

import { useState, forwardRef, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
 
import {
  User,
  Mail,
  Phone,
  ClipboardList,
  MessageSquare,
  Pencil,
  Loader2,
  RotateCcw,
  Send,
  AlertCircle,
  CheckCircle2,
  Headset,
  Clock,
  ChevronDown,
} from "lucide-react";
import { AddToContactApi } from "@/api/operations/contact.api";

/* ------------------------------------------------------------------ */
/* Validation schema                                                   */
/* ------------------------------------------------------------------ */

const CONTACT_REASONS = [
  "Order Related",
  "Payment Issue",
  "Shipping & Delivery",
  "Return / Refund",
  "Exchange Request",
  "Product Inquiry",
  "Product Quality Issue",
  "Cancellation Request",
  "Account & Login Support",
  "Technical Issue",
  "Bulk Order / Business Inquiry",
  "Feedback & Suggestions",
  "Complaint",
  "Other",
] as const;

const MOBILE_REGEX = /^[0-9]{10,15}$/;

const contactFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required.")
      .min(2, "Full name must be at least 2 characters.")
      .max(80, "Full name must be under 80 characters."),

    email: z.string().trim().min(1, "Email address is required.").email("Enter a valid email address."),

    mobile: z
      .string()
      .trim()
      .min(1, "Mobile number is required.")
      .regex(MOBILE_REGEX, "Enter a valid mobile number (10–15 digits, numbers only)."),

   
reason: z.enum(CONTACT_REASONS, {
  message: "Please select a reason for contact.",
}),

    otherReason: z.string().trim().max(120, "Keep it under 120 characters.").optional(),

    description: z
      .string()
      .trim()
      .min(1, "Description is required.")
      .min(20, "Please provide at least 20 characters so we can help you faster.")
      .max(2000, "Description must be under 2000 characters."),
  })
  .superRefine((data, ctx) => {
    if (data.reason === "Other" && (!data.otherReason || data.otherReason.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your reason.",
        path: ["otherReason"],
      });
    }
  });

type ContactFormValues = z.infer<typeof contactFormSchema>;

const defaultValues: Partial<ContactFormValues> = {
  fullName: "",
  email: "",
  mobile: "",
  otherReason: "",
  description: "",
};

/* ------------------------------------------------------------------ */
/* Small local classnames helper (no external dep needed)              */
/* ------------------------------------------------------------------ */

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const fieldBase =
  "w-full rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-60";

// Fixed icon-column width. Inputs/selects/textareas reserve this much
// space on the left via inline style so it can never be collapsed by
// conflicting/overridden Tailwind classes passed through `className`.
const ICON_COL = "2.75rem"; // 44px

/* ------------------------------------------------------------------ */
/* Form field primitives                                               */
/* ------------------------------------------------------------------ */

function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Icon wrapper: reserves a fixed-width column (w-10) pinned to the full
 * height of the field via inset-y-0, and centers the icon inside it with
 * flex. This guarantees the icon can never visually overlap the field's
 * text, regardless of input height, line-height, or class-merge order.
 */
function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

const IconInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; hasError?: boolean }>(
  ({ icon, hasError, className, style, ...props }, ref) => (
    <div className="relative">
      <FieldIcon>{icon}</FieldIcon>
      <input
        ref={ref}
        className={cx(fieldBase, "py-2.5 pr-3", hasError ? "border-destructive focus:ring-destructive" : "border-input", className)}
        style={{ paddingLeft: ICON_COL, ...style }}
        aria-invalid={hasError || undefined}
        {...props}
      />
    </div>
  )
);
IconInput.displayName = "IconInput";

const IconSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { icon: ReactNode; hasError?: boolean }
>(({ icon, hasError, className, style, children, ...props }, ref) => (
  <div className="relative">
    <FieldIcon>{icon}</FieldIcon>
    <select
      ref={ref}
      className={cx(
        fieldBase,
        "appearance-none py-2.5 pr-9",
        hasError ? "border-destructive focus:ring-destructive" : "border-input",
        className
      )}
      style={{ paddingLeft: ICON_COL, ...style }}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
  </div>
));
IconSelect.displayName = "IconSelect";

const IconTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { icon: ReactNode; hasError?: boolean }
>(({ icon, hasError, className, style, ...props }, ref) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center text-muted-foreground">
      {icon}
    </span>
    <textarea
      ref={ref}
      className={cx(
        fieldBase,
        "min-h-[120px] resize-y py-2.5 pr-3",
        hasError ? "border-destructive focus:ring-destructive" : "border-input",
        className
      )}
      style={{ paddingLeft: ICON_COL, ...style }}
      aria-invalid={hasError || undefined}
      {...props}
    />
  </div>
));
IconTextarea.displayName = "IconTextarea";

/* ------------------------------------------------------------------ */
/* Support info sidebar                                                */
/* ------------------------------------------------------------------ */

function SupportInfoCard() {
  return (
    <aside
      aria-labelledby="support-heading"
      className="flex h-fit flex-col gap-6 rounded-2xl border border-border bg-foreground p-6 text-background shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Headset className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 id="support-heading" className="text-lg font-semibold">
          Customer Support
        </h2>
      </div>

      <p className="text-sm text-background/70">
        Have a quick question? Reach our team directly, or send us a message and we&apos;ll follow up by email.
      </p>

      <ul className="flex flex-col gap-4">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-background/50">Email</span>
            <a
              href="mailto:support@yourstore.com"
              className="text-sm font-medium text-background underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              support@yourstore.com
            </a>
          </div>
        </li>

        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10">
            <Phone className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-background/50">Phone</span>
            <a
              href="tel:+12345678900"
              className="text-sm font-medium text-background underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              +1 (234) 567-8900
            </a>
          </div>
        </li>

        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-background/50">Working hours</span>
            <span className="text-sm font-medium text-background">Monday – Saturday</span>
            <span className="text-sm text-background/70">9:00 AM – 6:00 PM</span>
          </div>
        </li>
      </ul>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Success state                                                       */
/* ------------------------------------------------------------------ */

function SuccessMessage({ onSendAnother }: { onSendAnother: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background px-6 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-foreground">Message sent</h3>
        <p className="text-sm text-muted-foreground">
          Thank you for contacting us! Our support team will get back to you within 24–48 hours.
        </p>
      </div>
      <button
        type="button"
        onClick={onSendAnother}
        className="mt-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Send another message
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact form                                                        */
/* ------------------------------------------------------------------ */

function ContactForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const selectedReason = watch("reason");

  const onSubmit = async (values: ContactFormValues) => {
    try {
      // Final reason sent to the API: if "Other" was picked, send the
      // free-text reason the user typed instead of the literal word "Other".
      const finalReason = values.reason === "Other" ? values.otherReason?.trim() || "Other" : values.reason;

      const formData = new FormData();
      formData.append("name", values.fullName);
      formData.append("email", values.email);
      formData.append("mobile", values.mobile);
      formData.append("reason", finalReason);
      formData.append("message", values.description);

      await AddToContactApi
      (formData);

      setIsSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again in a moment.");
    }
  };

  const handleReset = () => reset(defaultValues);

  if (isSuccess) {
    return (
      <SuccessMessage
        onSendAnother={() => {
          handleReset();
          setIsSuccess(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5" aria-describedby="contact-form-required-note">
      <p id="contact-form-required-note" className="text-xs text-muted-foreground">
        Fields marked <span className="text-destructive">*</span> are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="fullName" label="Full Name" required error={errors.fullName?.message}>
          <IconInput
            id="fullName"
            icon={<User className="h-4 w-4" aria-hidden="true" />}
            placeholder="Jordan Lee"
            autoComplete="name"
            hasError={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
        </FormField>

        <FormField id="email" label="Email Address" required error={errors.email?.message}>
          <IconInput
            id="email"
            type="email"
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            placeholder="you@example.com"
            autoComplete="email"
            hasError={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="mobile" label="Mobile Number" required error={errors.mobile?.message}>
          <IconInput
            id="mobile"
            type="tel"
            inputMode="numeric"
            icon={<Phone className="h-4 w-4" aria-hidden="true" />}
            placeholder="9876543210"
            autoComplete="tel"
            hasError={!!errors.mobile}
            aria-describedby={errors.mobile ? "mobile-error" : undefined}
            {...register("mobile")}
          />
        </FormField>

        <FormField id="reason" label="Reason for Contact" required error={errors.reason?.message}>
          <IconSelect
            id="reason"
            icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            defaultValue=""
            hasError={!!errors.reason}
            aria-describedby={errors.reason ? "reason-error" : undefined}
            {...register("reason")}
          >
            <option value="" disabled>
              Select a reason
            </option>
            {CONTACT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </IconSelect>
        </FormField>
      </div>

      {selectedReason === "Other" && (
        <FormField id="otherReason" label="Please specify your reason" required error={errors.otherReason?.message}>
          <IconInput
            id="otherReason"
            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            placeholder="Tell us briefly what this is about"
            hasError={!!errors.otherReason}
            aria-describedby={errors.otherReason ? "otherReason-error" : undefined}
            {...register("otherReason")}
          />
        </FormField>
      )}

      <FormField
        id="description"
        label="Description / Message"
        required
        error={errors.description?.message}
        hint="Minimum 20 characters — the more detail, the faster we can help."
      >
        <IconTextarea
          id="description"
          icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
          placeholder="Share your order number, issue details, or question..."
          hasError={!!errors.description}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
          {...register("description")}
        />
      </FormField>

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ContactUs() {
  return (
    <main className="bg-surface">
      <div className="container py-12 sm:py-16 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Questions about an order, a return, or anything else? Send us a message and our team will get back to you shortly.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
          <section aria-labelledby="contact-form-heading" className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 id="contact-form-heading" className="sr-only">
              Contact form
            </h2>
            <ContactForm />
          </section>

          {/* <SupportInfoCard /> */}
        </div>
      </div>
    </main>
  );
}