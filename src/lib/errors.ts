import { isAxiosError } from "axios";

/** The API's own message for a failed request (`{ message }` / `{ error }` body), if any. */
export function apiMessage(err: unknown): string | undefined {
  if (!isAxiosError(err)) return undefined;
  const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
  const msg = data?.message ?? data?.error;
  return typeof msg === "string" && msg ? msg : undefined;
}

/** Best human-readable message for anything thrown: API message, then Error.message, then `fallback`. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  return apiMessage(err) || (err instanceof Error && err.message) || fallback;
}
