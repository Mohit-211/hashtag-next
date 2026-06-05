export const AUTH_ENDPOINTS = {
  LOGIN: "user/auth/login",
  REGISTER: "user/auth/register",
  LOGOUT: "user/auth/logout",
  SEND_OTP: "user/auth/otp",
  VERIFY_OTP: "user/auth/verify-otp",
  FORGOT_PASSWORD: "user/auth/forgot-password",
  RESET_PASSWORD: "user/auth/reset-password",
  // CHANGE_PASSWORD: "user/auth/change-password",
};
export const USER_ENDPOINTS = {
  PROFILE: "user/profile",
};
export const PRODUCT_ENDPOINTS = {
  PRODUCT: "product",
  PRODUCT_DETAIL: (id: string) => `product/${id}`,
  PRODUCT_DETAIL_GUEST: (id: string) => `product/guest/${id}`,
  PRODUCT_CATEGORY: "product-category/get-parent-categories",
  PRODUCT_VARIANT: "product/get-variant",
};
export const CART_ENDPOINTS = {
  CART: "cart",
  ADD_TO_CART: "product/cart",
  GET_ALL: "product/cart/get",
  INCREMENT: "product/cart/increment",
  DECREMENT: "product/cart/decrement",
  UPDATE_QUANTITY: "product/cart",
  REMOVE_FROM_CART: (cart_id: string) => `product/cart/${cart_id}`,
  MOVE_TO_WISHLIST: "product/cart/move",
 
};
export const SHIPPING_ENDPOINTS = {
  GET_RATES: "order/shipping/rates",
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
};
export const PAYMENT_ENDPOINTS = {
  SQUARE_CONFIG: "/payment/square/config",
  CREATE_PAYMENT: "/payment/square/create-payment",
  PAYMENT_HISTORY: "/payment/history",
};
export const BRAND_ENDPOINTS = {
  GET_ALL: "/brand/website-brands",
  
};