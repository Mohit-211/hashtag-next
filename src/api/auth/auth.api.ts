import client from "../client";
import { AUTH_ENDPOINTS } from "../endpoints";

// Calls whose screens show the API's message inline (403 "verify your email",
// 429 rate limits, invalid links) opt out of the global error toast.
const inline = { skipErrorToast: true } as const;

// Auth
export const loginApi = (payload: { email: string; password: string; role_id: number }) =>
  client.post(AUTH_ENDPOINTS.LOGIN, payload, inline);
export const registerApi = (payload: FormData) => client.post(AUTH_ENDPOINTS.REGISTER, payload);
export const logoutApi = () => client.get(AUTH_ENDPOINTS.LOGOUT);

// Email verification (link emailed after registration)
export const verifyEmailApi = (payload: { token: string }) =>
  client.post(AUTH_ENDPOINTS.VERIFY_EMAIL, payload, inline);
export const resendVerificationApi = (payload: { email: string }) =>
  client.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, payload, inline);

// Forgot password (link emailed, then a new password set on /reset-password)
export const requestPasswordResetApi = (payload: { email: string }) =>
  client.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload, inline);
export const resetPasswordWithTokenApi = (payload: { token: string; password: string; confirm_password: string }) =>
  client.post(AUTH_ENDPOINTS.FORGOT_PASSWORD_RESET, payload, inline);

// Signed-in password change. The response carries a new token for this device.
export const changePasswordApi = (payload: { old_password: string; new_password: string; confirm_password: string }) =>
  client.post(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
