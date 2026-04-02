import client from "../client";
import { AUTH_ENDPOINTS } from "../endpoints";
interface SendOtpPayload {
  email: string;
  type: string;
}
// Auth
export const loginApi = (payload: { email: string; password: string; }) => client.post(AUTH_ENDPOINTS.LOGIN, payload);
export const registerApi = (payload: FormData) => client.post(AUTH_ENDPOINTS.REGISTER, payload);
export const logoutApi = () => client.get(AUTH_ENDPOINTS.LOGOUT);

// OTP
export const sendOtpApi = (payload: SendOtpPayload) => client.post(AUTH_ENDPOINTS.SEND_OTP, payload);
export const verifyOtpApi = (payload: { email: string; otp: string; type: string; }) => client.post(AUTH_ENDPOINTS.VERIFY_OTP, payload);

// Password 
export const forgotPasswordApi = (payload: { email: string; password: string; confirm_password: string; token: string; }) => client.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
export const resetPasswordApi = (payload: any) => client.post(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
export const changePasswordApi = (payload: any) => client.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, payload);
