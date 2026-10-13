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

// ➕ Add Address
export const AddAddressApi = (payload: AddressPayload) =>
  client.post(ADDRESS_ENDPOINTS.ADD, payload);

// 📥 Get All Addresses
export const GetAddressApi = () =>
  client.get(ADDRESS_ENDPOINTS.GET);

// ✏️ Update Address
// 
export const UpdateAddressApi = (payload: AddressPayload & { id: number }) =>
  client.put(ADDRESS_ENDPOINTS.UPDATE, payload);

// ❌ Delete (ID inside payload)
export const DeleteAddressApi = (id: number) =>
  client.delete(`${ADDRESS_ENDPOINTS.DELETE}/${id}`);