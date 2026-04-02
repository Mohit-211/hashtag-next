import client from "../client";
import { PRODUCT_ENDPOINTS } from "../endpoints";


export const AllProductsApi = (params?: any) =>
  client.get(PRODUCT_ENDPOINTS.PRODUCT, { params });
export const ProductDetailApi = (id: string) => client.get(PRODUCT_ENDPOINTS.PRODUCT_DETAIL(id))
export const ProductCategoryApi = () => client.get(PRODUCT_ENDPOINTS.PRODUCT_CATEGORY)
export const ProductVariantApi = (payload: any) =>
  client.post(PRODUCT_ENDPOINTS.PRODUCT_VARIANT, payload);

