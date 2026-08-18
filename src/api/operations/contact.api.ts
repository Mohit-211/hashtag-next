import client from "../client";
import { CONTACT_ENDPOINTS } from "../endpoints";

// ➕ Add to contact
// contact.api.ts

export const AddToContactApi = (formData: FormData) => {
  return client.post(CONTACT_ENDPOINTS.ADD, formData, {
    headers: { "Content-Type": undefined },
  });
};
export const AddToSourcingRequestApi = (formData: FormData) => {
  return client.post(CONTACT_ENDPOINTS.SOURCING_REQUEST, formData, {
    headers: { "Content-Type": undefined },
  });
};

