import client from "../client";
import { AUTH_ENDPOINTS } from "../endpoints";

// Auth
export const loginApi = (payload) => client.post(AUTH_ENDPOINTS.LOGIN, payload);
export const registerApi = (payload) => client.post(AUTH_ENDPOINTS.REGISTER, payload);
export const logoutApi = () => client.get(AUTH_ENDPOINTS.LOGOUT);

// OTP
export const sendOtpApi = (payload) => client.post(AUTH_ENDPOINTS.SEND_OTP, payload);
export const verifyOtpApi = (payload) => client.post(AUTH_ENDPOINTS.VERIFY_OTP, payload);

// Password 
export const forgotPasswordApi = (payload) => client.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, payload);
export const resetPasswordApi = (payload) => client.post(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
export const changePasswordApi = (payload) => client.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, payload);
