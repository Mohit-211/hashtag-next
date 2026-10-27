
import GalleryMain from '@/components/Gallery/GalleryMain'
import React from 'react'
import { publicPage } from "@/lib/seo";

export const metadata = publicPage({
  title: "Gallery",
  description: "Photos of custom apparel and products made by HashtagBillionaire.",
  path: "/gallery",
});

const GalleryPage = () => {
  return (
    <div>
     
      <GalleryMain/>

    </div>
  )
}

export default GalleryPage