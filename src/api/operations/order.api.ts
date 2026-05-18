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

export const GetAllOrderApi = () => {
  return client.get(ORDER.GET_ALL);
};

export const GetOrderDetailApi = (id: string | number) => {
  return client.get(ORDER.GET_DETAIL(id));
};

export const CreateShipmentLabelApi = (payload: { order_id: number }) => {
  return client.post(ORDER.CREATE_SHIPMENT_LABEL, payload);
};