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

export default client;
