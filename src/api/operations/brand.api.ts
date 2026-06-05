import client from "../client";
import { BRAND_ENDPOINTS } from "../endpoints";

/* Get All Brands */
export const GetAllBrandsApi = () => {
  return client.get(BRAND_ENDPOINTS.GET_ALL);
};