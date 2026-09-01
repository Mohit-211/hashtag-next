// ─────────────────────────────────────────────────────────────────────────
// Centralized, reusable input-validation building blocks (Zod). Forms that
// already use react-hook-form + zodResolver (see ConatctUs.tsx) should build
// their schema out of these primitives; forms that still manage plain
// useState should call `zodErrors(schema, values)` on submit/blur and render
// the returned per-field messages the same way ConatctUs.tsx does.
// ─────────────────────────────────────────────────────────────────────────
import { z } from "zod";

export const EMAIL_MAX_LENGTH = 254;
export const NAME_MAX_LENGTH = 80;
export const PASSWORD_MAX_LENGTH = 128;
export const TEXT_MAX_LENGTH = 2000;

export const MOBILE_10_REGEX = /^[0-9]{10}$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
export const POSTAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/;
export const OTP_REGEX = /^\d{4,6}$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(EMAIL_MAX_LENGTH, "Email is too long.")
  .email("Enter a valid email address.");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .min(2, "Full name must be at least 2 characters.")
  .max(NAME_MAX_LENGTH, `Full name must be under ${NAME_MAX_LENGTH} characters.`);

// Strict 10-digit mobile number (matches the format already used at signup).
export const mobileSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required.")
  .regex(MOBILE_10_REGEX, "Enter a valid 10-digit mobile number.");

// Looser phone format for contact/address forms that may receive numbers
// with country codes, spaces, or dashes.
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .regex(PHONE_REGEX, "Enter a valid phone number (7–20 digits).");

export const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
  .max(PASSWORD_MAX_LENGTH, `Password must be under ${PASSWORD_MAX_LENGTH} characters.`)
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const otpSchema = z
  .string()
  .trim()
  .regex(OTP_REGEX, "Enter a valid OTP.");

export const urlSchema = z.string().trim().max(2048, "URL is too long.").url("Enter a valid URL.");

/** Guards an `href`/`src` sourced from an API or database (order tracking
 * links, carrier URLs, etc.) before handing it to the DOM. Rejects
 * javascript:, data:, vbscript:, and any other non-http(s) scheme, which is
 * the main way untrusted "just a URL" data becomes script execution when
 * rendered as a real anchor/link instead of static app-controlled text. */
export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value, typeof window !== "undefined" ? window.location.origin : undefined);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const postalCodeSchema = z
  .string()
  .trim()
  .min(3, "Enter a valid postal code.")
  .max(12, "Postal code is too long.")
  .regex(POSTAL_CODE_REGEX, "Enter a valid postal code.");

export const addressLineSchema = z
  .string()
  .trim()
  .min(3, "Address must be at least 3 characters.")
  .max(200, "Address must be under 200 characters.");

export const stateOrCitySchema = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(100, "Must be under 100 characters.");

/** A free-text field (message/description/company/etc.) with sane bounds. */
export function textSchema(opts: { required?: boolean; min?: number; max?: number } = {}) {
  const { required = true, min = required ? 1 : 0, max = TEXT_MAX_LENGTH } = opts;
  let schema = z.string().trim().max(max, `Must be under ${max} characters.`);
  if (min > 0) {
    schema = schema.min(min, required && min === 1 ? "This field is required." : `Please enter at least ${min} characters.`);
  }
  return schema;
}

/** Runs a zod schema against plain form state and returns a flat
 * `{ fieldName: message }` map — one message per field, first error wins —
 * for forms that render their own `<p className="...error">` per field
 * instead of going through react-hook-form's `formState.errors`. */
export function zodErrors<T>(schema: z.ZodType<T>, data: unknown): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
