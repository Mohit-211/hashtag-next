import client from "../client";
import { SHIPPING_ENDPOINTS } from "../endpoints";

// 📥 Get Shipping Rates
// shipping.api.ts

// Checkout shows why rates failed, so the global toast stays out of it.
export const GetShippingRatesApi = (payload: { address_id: string | number; }) => {
  return client.post(SHIPPING_ENDPOINTS.GET_RATES, payload, { skipErrorToast: true });
};


