import client from "../client";
import { ADDRESS_ENDPOINTS } from "../endpoints";

// ➕ Add Address
export const AddAddressApi = (payload: any) =>
  client.post(ADDRESS_ENDPOINTS.ADD, payload);

// 📥 Get All Addresses
export const GetAddressApi = () =>
  client.get(ADDRESS_ENDPOINTS.GET);

// ✏️ Update Address
// 
export const UpdateAddressApi = (payload: any) =>
  client.put(ADDRESS_ENDPOINTS.UPDATE, payload);

// ❌ Delete (ID inside payload)
export const DeleteAddressApi = (payload: any) =>
  client.post(ADDRESS_ENDPOINTS.DELETE, { data: payload });