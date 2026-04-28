import { message } from "antd";
import errorMessages from "./errorMessages";

export const handleApiError = (error) => {
  if (!error.response) {
    message.error(errorMessages.NETWORK_ERROR || "Network error. Please check your connection.");
    return Promise.reject(error);
  }

  const { status, data } = error.response;
  const serverMessage = data?.message || data?.error || null;


  // ✅ Handle JWT expiration globally
  // if (serverMessage && serverMessage.toLowerCase().includes("jwt expired")) {
  //   message.error("Session expired. Please log in again.");
  //   localStorage.removeItem("book_publish_token");
  //   window.location.href = "/login";
  //   return Promise.reject(error);
  // }

  switch (status) {
    case 400:
      message.error(serverMessage || "Bad request.");
      break;
    case 401:
      message.error(serverMessage || "Unauthorized. Please login again.");
      localStorage.removeItem("book_publish_token");
      window.location.href = "/login";
      break;
    case 403:
      message.error(serverMessage || "You don’t have permission to do this.");
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
