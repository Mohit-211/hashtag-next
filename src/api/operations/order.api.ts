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

export const GetAllOrderApi =
  (options?: RequestOptions) => {
    return client.get(
      ORDER.GET_ALL,
      options
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