import client from "../client";
import { PRODUCT_ENDPOINTS } from "../endpoints";


export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number | string;
}

export const AllProductsApi = (params?: ProductQueryParams) => {
  return client.get(PRODUCT_ENDPOINTS.PRODUCT, {
    params,
  });
};
export const ProductDetailApi = (id: string) => client.get(PRODUCT_ENDPOINTS.PRODUCT_DETAIL(id))
export const ProductCategoryApi = ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  return client.get(`${PRODUCT_ENDPOINTS.PRODUCT_CATEGORY}`, {
    params: { page, limit, search },
  });
};
export const ProductVariantApi = (payload: any) =>
  client.post(PRODUCT_ENDPOINTS.PRODUCT_VARIANT, payload);

