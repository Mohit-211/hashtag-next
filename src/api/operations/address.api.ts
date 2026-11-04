import client from "../client";
import { ADDRESS_ENDPOINTS } from "../endpoints";

/** Address body as the API expects it (see `toPayload` in hooks/useAddresses). */
export interface AddressPayload {
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  country_id: number;
  state_id: number;
  city_id: number;
  is_default: 0 | 1;
}

// Pass { skipErrorToast: true } when the screen shows the error itself.
type RequestOptions = { skipErrorToast?: boolean };

// ➕ Add Address
export const AddAddressApi = (payload: AddressPayload, options?: RequestOptions) =>
  client.post(ADDRESS_ENDPOINTS.ADD, payload, options);

// 📥 Get All Addresses
export const GetAddressApi = () =>
  client.get(ADDRESS_ENDPOINTS.GET);

// ✏️ Update Address
// 
export const UpdateAddressApi = (payload: AddressPayload & { id: number }, options?: RequestOptions) =>
  client.put(ADDRESS_ENDPOINTS.UPDATE, payload, options);

// ❌ Delete (ID inside payload)
export const DeleteAddressApi = (id: number) =>
  client.delete(`${ADDRESS_ENDPOINTS.DELETE}/${id}`);