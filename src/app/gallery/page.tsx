
import GalleryMain from '@/components/Gallery/GalleryMain'
import React from 'react'
import { publicPage } from "@/lib/seo";
import { fetchPublicJson } from "@/lib/publicApi";
import type { GalleryPhoto } from "@/api/operations/gallery.api";

export const metadata = publicPage({
  title: "Gallery",
  description: "Photos of custom apparel and products made by HashtagBillionaire.",
  path: "/gallery",
});

// Fetched here (cached for 5 minutes) so the gallery's first paint and HTML already have the photos.
const GalleryPage = async () => {
  const res = await fetchPublicJson<{ data?: GalleryPhoto[] }>("gallery", 300);
  return (
    <div>
     
      <GalleryMain initialRows={Array.isArray(res?.data) ? res.data : null} />

    </div>
  )
}

export default GalleryPage