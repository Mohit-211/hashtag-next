// brand.api.ts
import client from "../client";
import { BRAND_ENDPOINTS } from "../endpoints";

/* Get All Brands */
export const GetAllBrandsApi = (
  page: number = 1,
  limit: number = 100
) => {
  return client.get(
    `${BRAND_ENDPOINTS.GET_ALL}?page=${page}&limit=${limit}`
  );
};