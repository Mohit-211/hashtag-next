import client from "../client";
import { ORDER } from "../endpoints";

// Checkout shows the error itself. The API prices the chosen service itself
// and answers with the final figures.
export const CreateOrderApi = (payload: {
  address_id: number;
  selected_service_code: string;
}) => {
  return client.post(ORDER.CREATE, payload, { skipErrorToast: true });
};
// Pass { skipErrorToast: true } when the screen shows the error itself.
type RequestOptions = { skipErrorToast?: boolean };

/** One page of the customer's orders, newest first: { data, pagination: { total, page, limit, totalPages } }. */
export const GetAllOrderApi =
  ({ page, limit, ...options }: RequestOptions & { page?: number; limit?: number } = {}) => {
    return client.get(
      ORDER.GET_ALL,
      { ...options, params: { page, limit } }
    );
  };

export const GetOrderDetailApi = (
  id: string | number,
  options?: RequestOptions
) => {
  return client.get(
    ORDER.GET_DETAIL(id),
    options
  );
};

export const CancelOrderApi = (id: string | number) => {
  return client.patch(ORDER.CANCEL(id));
}