import { toast } from "sonner";
import errorMessages from "./errorMessages";

const TOKEN_KEY = "hastagBillionaire";

let sessionExpiredHandled = false;

// Centralized API error notifications: this is the ONE place that toasts an
// HTTP-level failure (4xx/5xx/network). Callers should NOT show their own
// toast.error for the same rejection — that duplicates this message. The one
// deliberate exceptions: an anonymous 401 (no session token, e.g. a wrong
// password on login), and requests sent with `skipErrorToast` — their screens
// show the API's message inline instead.
//
// A 401 on a signed-in call always means "signed out" (expired, revoked or
// invalid token): the token is cleared and the shopper sent to log in.
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
      const { pathname, search } = window.location;
      if (!pathname.startsWith("/login")) {
        toast.error(errorMessages.UNAUTHORIZED || "Session expired. Please log in again.");
        window.location.href = `/login?returnTo=${encodeURIComponent(pathname + search)}`;
      }
    }
    return Promise.reject(error);
  }

  if (error.config?.skipErrorToast) return Promise.reject(error);

  switch (status) {
    case 429:
      // Rate limited — show the API's message; never retry automatically.
      toast.error(serverMessage || "Too many attempts. Please wait a few minutes and try again.");
      break;
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