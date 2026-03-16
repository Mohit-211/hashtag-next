export type Section =
  | "profile"
  | "addresses"
  | "password"
  | "orders"
  | "saved"
  | "logout";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
