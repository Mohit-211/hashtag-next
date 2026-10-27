import client from "../client";
import { ORDER } from "../endpoints";

export const CreateOrderApi = (payload: {
  address_id: number;
  selected_service_code: string;
  selected_carrier_code: string;
  shipping_amount: number;
}) => {
  return client.post(ORDER.CREATE, payload);
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

export const CreateShipmentLabelApi = (payload: { order_id: number }) => {
  return client.post(ORDER.CREATE_SHIPMENT_LABEL, payload);
};
export const CancelOrderApi = (id: string | number) => {
  return client.patch(ORDER.CANCEL(id));
}