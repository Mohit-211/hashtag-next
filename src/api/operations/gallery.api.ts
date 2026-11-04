import client from "../client";
import { GALLERY_ENDPOINTS } from "../endpoints";

/** A photo the team manages in the admin, in display order. */
export interface GalleryPhoto {
  id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

// The page falls back to its built-in photos, so a failure needs no toast.
export const GalleryApi = () => client.get(GALLERY_ENDPOINTS.GET, { skipErrorToast: true });
