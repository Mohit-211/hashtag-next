import axios from "axios";
import config from "../constants/config";
import { handleApiError } from "../errors/ApiErrorHandler";

declare module "axios" {
  interface AxiosRequestConfig {
    /** The caller shows the error itself; skip the global toast. */
    skipErrorToast?: boolean;
  }
}

const client = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUT,
  headers: {
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    "Content-Type": "application/json",
    
  },
});

client.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("hastagBillionaire");
    if (token) {
      req.headers['x-access-token'] = `${token}`;
      // Ignored by the backend's security release, but the API deployed today
      // still requires it on cart/address/order/wishlist calls (500 without it).
      // Remove once that release is live.
      req.headers['role_id'] = 6;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (res) => res,
  (error) => handleApiError(error)
);

/**
 * Timeout for a request that uploads files (BUG-013). In the browser the
 * timeout also covers sending the body, and files go up to 100 MB, so the 20 s
 * default would cut off ordinary uploads. Allows the usual 20 s for the answer
 * plus the time to send the files at 1 Mbit/s (a slow mobile uplink), at most
 * 15 minutes: a 5 MB file gets about 62 s, a 100 MB file about 14 minutes.
 */
export const uploadTimeout = (body: FormData): number => {
  let bytes = 0;
  body.forEach((value) => {
    if (typeof value !== "string") bytes += value.size;
  });
  return Math.min(config.TIMEOUT + Math.ceil(bytes / 125), 15 * 60_000);
};

export default client;
