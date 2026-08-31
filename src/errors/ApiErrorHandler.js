import { message } from "antd";
import errorMessages from "./errorMessages";

const TOKEN_KEY = "hastagBillionaire";

let sessionExpiredHandled = false;

export const handleApiError = (error) => {
  if (!error.response) {
    message.error(errorMessages.NETWORK_ERROR || "Network error. Please check your connection.");
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
        message.error(errorMessages.UNAUTHORIZED || "Session expired. Please log in again.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }

  switch (status) {
    case 400:
      message.error(serverMessage || "Bad request.");
      break;
    case 401:
      // Reaches here only when hadToken is false (no session to expire) —
      // an anonymous 401, e.g. wrong-password login. Let the caller handle it.
      break;
    case 403:
      message.error(serverMessage || "You don't have permission to do this.");
      break;
    case 404:
      message.error(serverMessage || "Resource not found.");
      break;
    case 422:
      if (data?.errors) {
        const first = Object.values(data.errors)[0];
        message.error(first?.[0] || serverMessage || "Validation error.");
      } else {
        message.error(serverMessage || "Validation error.");
      }
      break;
    case 500:
      message.error(serverMessage || "Server error. Please try again later.");
      break;
    default:
      message.error(serverMessage || errorMessages.UNKNOWN || "Something went wrong.");
      break;
  }

  return Promise.reject(error);
};