import client from "../client";
import { PRODUCT_ENDPOINTS } from "../endpoints";


export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number | string;
  brand_id?: number | string;
  grand_category_id?: number | string;
}

export const AllProductsApi = (params?: ProductQueryParams) => {
  return client.get(PRODUCT_ENDPOINTS.PRODUCT, {
    params,
  });
};
export const ProductsByGrandCategoryApi = (
  params?: ProductQueryParams
) => {
  return client.get(PRODUCT_ENDPOINTS.PRODUCT_GRAND_CATEGORY, {
    params,
  });
};
export const ProductsByParentCategoryApi = (params?: ProductQueryParams) => {
  return client.get(PRODUCT_ENDPOINTS.PRODUCT, {
    params,
  });
};
export const ProductDetailApi = (id: string) => client.get(PRODUCT_ENDPOINTS.PRODUCT_DETAIL(id))
export const ProductDetailGuestApi = (id: string) => client.get(PRODUCT_ENDPOINTS.PRODUCT_DETAIL_GUEST(id))

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

export const ProductVariantByIdApi = (id: number | string) =>
  client.get(PRODUCT_ENDPOINTS.PRODUCT_VARIANT_DETAIL(id));
export interface IndustryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
export const IndustryApi = (params?: IndustryQueryParams) => {
  return client.get(PRODUCT_ENDPOINTS.INDUSTRY, {
    params,
  });
};

export const ProductsByUseCaseApi = (
  useCaseId: string | number | Array<string | number>,
  params?: ProductQueryParams
) => {
  const use_case_ids = Array.isArray(useCaseId) ? useCaseId.join(",") : useCaseId;
  return client.get(PRODUCT_ENDPOINTS.USE_CASE_PRODUCTS, {
    params: { ...params, use_case_ids },
  });
};