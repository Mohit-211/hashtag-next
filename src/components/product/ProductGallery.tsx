"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface Props {
  attachments?: any[];
  badge?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductGallery({ attachments = [], badge = "New Arrival" }: Props) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const images =
    attachments.length > 0
      ? attachments.map((item: any) =>
          typeof item === "string"
            ? item
            : `${item?.file_uri}`
        )
      : ["/assets/placeholder.jpg"];

  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-[#e9e5dd] group cursor-zoom-in"
        onClick={() => setZoomed(!zoomed)}
      >
        <Image
          src={images[active]}
          unoptimized={process.env.NODE_ENV === "development"}
          crossOrigin="anonymous"
          alt="Product"
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Badge */}
        {badge && (
          <span className="absolute top-3 left-3 bg-[#2d4a35] text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full z-10">
            {badge}
          </span>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ZoomIn className="w-4 h-4 text-[#2d4a35]" />
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#c5c2bb]">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                active === i
                  ? "border-[#2d4a35] opacity-100 ring-2 ring-[#2d4a35]/20"
                  : "border-transparent opacity-55 hover:opacity-90 hover:border-[#8fa989]"
              }`}
            >
              <Image
                src={img}
                unoptimized={process.env.NODE_ENV === "development"}
                crossOrigin="anonymous"
                alt={`View ${i + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}