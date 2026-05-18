import client from "../client";
import { SHIPPING_ENDPOINTS } from "../endpoints";

// 📥 Get Shipping Rates
// shipping.api.ts

export const GetShippingRatesApi = (payload: { address_id: string | number; }) => {
  return client.post(SHIPPING_ENDPOINTS.GET_RATES, payload);
};


