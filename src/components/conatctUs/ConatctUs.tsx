"use client";

import { useState, forwardRef, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useForm, FieldErrors } from "react-hook-form";
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
  ChevronDown,
} from "lucide-react";
import { AddToContactApi } from "@/api/operations/contact.api";

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

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const fieldBase =
  "w-full rounded-md border bg-background text-[14px] text-foreground placeholder:text-muted-foreground transition-all duration-150 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60";

const ICON_COL = "2.75rem";

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
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      <div className="grid transition-all" style={{ gridTemplateRows: error || hint ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          {hint && !error && <p className="pt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
          {error && (
            <p role="alert" className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldIcon({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cx(
        "pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
  hasError?: boolean;
};

type IconSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon: ReactNode;
  hasError?: boolean;
};

type IconTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  icon: ReactNode;
  hasError?: boolean;
};

const IconInput = forwardRef<HTMLInputElement, IconInputProps>((props, ref) => {
  const { icon, hasError, className, style, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <FieldIcon active={focused}>{icon}</FieldIcon>
      <input
        ref={ref}
        className={cx(
          fieldBase,
          "py-2.5 pr-3",
          hasError ? "border-destructive/70 focus:border-destructive focus:ring-destructive/20" : "border-border",
          className
        )}
        style={{ paddingLeft: ICON_COL, ...style }}
        aria-invalid={hasError || undefined}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
    </div>
  );
});
IconInput.displayName = "IconInput";

const IconSelect = forwardRef<HTMLSelectElement, IconSelectProps>((props, ref) => {
  const { icon, hasError, className, style, children, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <FieldIcon active={focused}>{icon}</FieldIcon>
      <select
        ref={ref}
        className={cx(
          fieldBase,
          "cursor-pointer appearance-none bg-background py-2.5 pr-9",
          hasError ? "border-destructive/70 focus:border-destructive focus:ring-destructive/20" : "border-border",
          className
        )}
        style={{ paddingLeft: ICON_COL, ...style }}
        aria-invalid={hasError || undefined}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </div>
  );
});
IconSelect.displayName = "IconSelect";

const IconTextarea = forwardRef<HTMLTextAreaElement, IconTextareaProps>((props, ref) => {
  const { icon, hasError, className, style, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <span
        className={cx(
          "pointer-events-none absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center transition-colors",
          focused ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <textarea
        ref={ref}
        className={cx(
          fieldBase,
          "min-h-[128px] resize-y py-2.5 pr-3",
          hasError ? "border-destructive/70 focus:border-destructive focus:ring-destructive/20" : "border-border",
          className
        )}
        style={{ paddingLeft: ICON_COL, ...style }}
        aria-invalid={hasError || undefined}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
    </div>
  );
});
IconTextarea.displayName = "IconTextarea";

function SuccessMessage({ onSendAnother }: { onSendAnother: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex animate-[fadeIn_0.4s_ease-out] flex-col items-center gap-4 px-6 py-16 text-center"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/70 bg-primary/10 text-primary">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-iteration-count:2]" aria-hidden="true" />
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-xl">Message sent</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Thank you for contacting us! Our support team will get back to you within 24–48 hours.
        </p>
      </div>
      <button
        type="button"
        onClick={onSendAnother}
        className="mt-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Send another message
      </button>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function ContactForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const selectedReason = watch("reason");
  const description = watch("description") || "";

  // Validation feedback is surfaced via toast only (one message at a time)
  // rather than inline per-field errors.
  const onInvalid = (fieldErrors: FieldErrors<ContactFormValues>) => {
    const firstError = Object.values(fieldErrors)[0] as { message?: string } | undefined;
    toast.error(firstError?.message ?? "Please check the form and try again.");
  };

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const finalReason = values.reason === "Other" ? values.otherReason?.trim() || "Other" : values.reason;

      const formData = new FormData();
      formData.append("name", values.fullName);
      formData.append("email", values.email);
      formData.append("mobile", values.mobile);
      formData.append("reason", finalReason);
      formData.append("message", values.description);

      await AddToContactApi(formData);

      setIsSuccess(true);
    } catch {
      // The axios response interceptor (see src/errors/ApiErrorHandler.js)
      // already toasts the failure — nothing more to show here.
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex flex-col gap-6" aria-describedby="contact-form-required-note">
      <p id="contact-form-required-note" className="text-[11px] text-muted-foreground">
        Fields marked <span className="text-primary">*</span> are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="fullName" label="Full Name" required>
          <IconInput
            id="fullName"
            icon={<User className="h-4 w-4" aria-hidden="true" />}
            placeholder="Jordan Lee"
            autoComplete="name"
            {...register("fullName")}
          />
        </FormField>

        <FormField id="email" label="Email Address" required>
          <IconInput
            id="email"
            type="email"
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="mobile" label="Mobile Number" required>
          <IconInput
            id="mobile"
            type="tel"
            inputMode="numeric"
            icon={<Phone className="h-4 w-4" aria-hidden="true" />}
            placeholder="9876543210"
            autoComplete="tel"
            {...register("mobile")}
          />
        </FormField>

        <FormField id="reason" label="Reason for Contact" required>
          <IconSelect
            id="reason"
            icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
            defaultValue=""
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
        <div className="animate-[fadeIn_0.25s_ease-out]">
          <FormField id="otherReason" label="Please specify your reason" required>
            <IconInput
              id="otherReason"
              icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
              placeholder="Tell us briefly what this is about"
              {...register("otherReason")}
            />
          </FormField>
        </div>
      )}

      <FormField
        id="description"
        label="Description / Message"
        required
        hint="Minimum 20 characters — the more detail, the faster we can help."
      >
        <div className="relative">
          <IconTextarea
            id="description"
            icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            placeholder="Share your order number, issue details, or question..."
            {...register("description")}
          />
          <span className="pointer-events-none absolute bottom-2.5 right-3 font-mono text-[10px] text-muted-foreground/70">
            {description.length}/2000
          </span>
        </div>
      </FormField>

      <div className="mt-1 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              Submit
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </form>
  );
}

export default function ContactUs() {
  return (
    <main className="bg-surface">
      <div className="container py-14 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            <span className="h-px w-4 bg-primary/60" aria-hidden="true" />
            Sourcing Desk · Contact
            <span className="h-px w-4 bg-primary/60" aria-hidden="true" />
          </p>
          <h1 className="text-3xl leading-[1.1] sm:text-4xl">Submit your sourcing request</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Questions about an order, a return, or anything else? Send us a message and our team will get back to you shortly.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <section
            aria-labelledby="contact-form-heading"
            className="relative overflow-hidden rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8"
          >
            <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0" aria-hidden="true" />
            <h2 id="contact-form-heading" className="sr-only">
              Contact form
            </h2>
            <ContactForm />
          </section>
        </div>
      </div>
    </main>
  );
}