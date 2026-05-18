export interface Address {
  id: number;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export interface ShippingRate {
  label: string;
  service_code: string;
  carrier_code: string;
  price: number;
  delivery_days?: number;
  delivery_text?: string;
  trackable?: boolean;
}