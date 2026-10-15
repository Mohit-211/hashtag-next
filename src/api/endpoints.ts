export const AUTH_ENDPOINTS = {
  LOGIN: "user/auth/login",
  REGISTER: "user/auth/register",
  LOGOUT: "user/auth/logout",
  /** Emailed verification link → POST { token }. */
  VERIFY_EMAIL: "user/auth/verify-email",
  RESEND_VERIFICATION: "user/auth/verify-email/resend",
  /** Step 1: email a reset link → POST { email }. */
  FORGOT_PASSWORD: "user/auth/forgot-password",
  /** Step 2: from the emailed link → POST { token, password, confirm_password }. */
  FORGOT_PASSWORD_RESET: "user/auth/forgot-password/reset",
  /** Signed-in password change. */
  RESET_PASSWORD: "user/auth/reset-password",
};
export const USER_ENDPOINTS = {
  PROFILE: "user/profile",
};
export const CONTACT_ENDPOINTS = {
  ADD: "contactUs",
  SOURCING_REQUEST: "sourcing-requests/create"
};
export const PRODUCT_ENDPOINTS = {
  PRODUCT: "product",
  PRODUCT_DETAIL: (id: string) => `product/${id}`,
  PRODUCT_DETAIL_GUEST: (id: string) => `product/guest/${id}`,
  PRODUCT_CATEGORY: "product-category/get-grand-categories",
  PRODUCT_VARIANT_DETAIL: (id: string | number) => `product/variant/${id}`,
  INDUSTRY: "industry",
  USE_CASE_PRODUCTS: "industry/use-case/products",
  PRODUCT_ADDONS: (id: string | number) => `add-on/product/${id}/addons`,
  PRODUCT_CUSTOMIZATIONS: (id: string | number) => `customization-option/product/${id}/customizations`,
};
export const CART_ENDPOINTS = {
  ADD_TO_CART: "product/cart",
  GET_ALL: "product/cart/get",
  INCREMENT: "product/cart/increment",
  DECREMENT: "product/cart/decrement",
  UPDATE_QUANTITY: "product/cart",
  REMOVE_FROM_CART: (cart_id: string | number) => `product/cart/${cart_id}`,
};
export const SHIPPING_ENDPOINTS = {
  GET_RATES: "/order/shipping/rates",
};

// ✅ Base URL assumed already set in client
export const WISHLIST_ENDPOINTS = {
  ADD: "/product/wishlist",
  GET: "/product/wishlist/get",
  REMOVE: (id: string | number) => `/product/wishlist/${id}`,
  MOVE_TO_CART: "/product/wishlist/move",
};
export const ADDRESS_ENDPOINTS = {
  ADD: "/address",
  GET: "/address",
  UPDATE: "/address",
  DELETE: "/address",
};
export const ORDER = {
  CREATE: "/order",
  GET_ALL: "/order",
  GET_DETAIL: (id: string | number) => `/order/${id}`,
  CREATE_SHIPMENT_LABEL: "/order/create-shipment-label",
  CANCEL: (id: string | number) => `/order/${id}`,
};
export const PAYMENT_ENDPOINTS = {
  SQUARE_CONFIG: "/payment/square/config",
  CREATE_PAYMENT: "/payment/square/create-payment",
  PAYMENT_STATUS: "/payment/square/payment-status",
  PAYMENT_HISTORY: "/payment/history",
  PAYPAL_CREATE_ORDER: "/payment/paypal/create-order",
  PAYPAL_CAPTURE_ORDER: "/payment/paypal/capture-order",
};
export const BRAND_ENDPOINTS = {
  GET_ALL: "/brand/website-brands",
};