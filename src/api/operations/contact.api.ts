import client from "../client";
import { CONTACT_ENDPOINTS } from "../endpoints";

// ➕ Add to contact
// contact.api.ts

export const AddToContactApi = (formData: FormData) => {
  return client.post(CONTACT_ENDPOINTS.ADD, formData, {
    
  });
};