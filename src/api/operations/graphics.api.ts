import client from "../client";
import { GRAPHICS_ENDPOINTS } from "../endpoints";

/** A file the customer has uploaded, stored exactly as it came. */
export interface SavedGraphic {
  id: number;
  /** Opening this directly downloads the file. */
  file_url: string;
  original_name: string;
  mime_type: string | null;
  file_size: number;
  /** True until an order with this graphic has been paid. */
  is_new: boolean;
  created_at: string;
}

// Saved by being uploaded: the same file again answers with the same id. The
// screens show why an upload failed, so the global toast stays out of it.
export const UploadGraphicApi = (file: File) => {
  const formData = new FormData();
  formData.append("graphic", file, file.name);
  return client.post(GRAPHICS_ENDPOINTS.BASE, formData, {
    headers: { "Content-Type": undefined },
    skipErrorToast: true,
  });
};

export const GetGraphicsApi = (params: { page: number; limit: number }) =>
  client.get(GRAPHICS_ENDPOINTS.BASE, { params, skipErrorToast: true });
