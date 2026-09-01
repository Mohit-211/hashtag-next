import { toast } from "sonner";
import errorMessages from "./errorMessages";

const TOKEN_KEY = "hastagBillionaire";

let sessionExpiredHandled = false;

// Centralized API error notifications: this is the ONE place that toasts an
// HTTP-level failure (4xx/5xx/network). Callers should NOT show their own
// toast.error for the same rejection — that duplicates this message. The one
// deliberate exception is an anonymous 401 (no session token, e.g. a wrong
// password on login) — this handler stays silent for that case so the
// caller can show a form-specific message instead.
export const handleApiError = (error) => {
  if (!error.response) {
    toast.error(errorMessages.NETWORK_ERROR || "Network error. Please check your connection.");
    return Promise.reject(error);
  }

  const { status, data } = error.response;
  const serverMessage = data?.message || data?.error || null;

  const hadToken = typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY);
  const isJwtExpired =
    hadToken &&
    (status === 401 || (serverMessage && /jwt expired|invalid token|token expired|jwt malformed/i.test(serverMessage)));

  if (isJwtExpired) {
    if (!sessionExpiredHandled && typeof window !== "undefined") {
      sessionExpiredHandled = true;
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        toast.error(errorMessages.UNAUTHORIZED || "Session expired. Please log in again.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }

  switch (status) {
    case 400:
      toast.error(serverMessage || "Bad request.");
      break;
    case 401:
      // Reaches here only when hadToken is false (no session to expire) —
      // an anonymous 401, e.g. wrong-password login. Let the caller handle it.
      break;
    case 403:
      toast.error(serverMessage || "You don't have permission to do this.");
      break;
    case 404:
      toast.error(serverMessage || "Resource not found.");
      break;
    case 422:
      if (data?.errors) {
        const first = Object.values(data.errors)[0];
        toast.error(first?.[0] || serverMessage || "Validation error.");
      } else {
        toast.error(serverMessage || "Validation error.");
      }
      break;
    case 500:
      toast.error(serverMessage || "Server error. Please try again later.");
      break;
    default:
      toast.error(serverMessage || errorMessages.UNKNOWN || "Something went wrong.");
      break;
  }

  return Promise.reject(error);
};