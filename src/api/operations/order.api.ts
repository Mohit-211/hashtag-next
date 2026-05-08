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

export const GetAllOrderApi = () =>
  client.get(ORDER.GET_ALL);