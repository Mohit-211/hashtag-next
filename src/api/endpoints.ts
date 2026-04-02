export const AUTH_ENDPOINTS = {
  LOGIN: "user/auth/login",
  REGISTER: "user/auth/register",
  LOGOUT: "user/auth/logout",
  SEND_OTP: "user/auth/otp",
  VERIFY_OTP: "user/auth/verify-otp",
  FORGOT_PASSWORD: "user/auth/forgot-password",
  RESET_PASSWORD: "user/auth/reset-password",
  CHANGE_PASSWORD: "user/auth/change-password",
};
export const USER_ENDPOINTS = {
  PROFILE: "user/profile",
};
export const PRODUCT_ENDPOINTS = {
  PRODUCT: "product",
  PRODUCT_DETAIL: (id: string) => `product/${id}`,
  PRODUCT_CATEGORY: "product/category",
  PRODUCT_VARIANT: "product/get-variant",
};