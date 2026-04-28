"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import ProxyImage from "../Proxyimage";

interface Props {
  attachments?: any[];
  badge?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductGallery({
  attachments = [],
  badge = "New Arrival",
}: Props) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const images =
    attachments.length > 0
      ? attachments.map((item: any) =>
          typeof item === "string" ? item : `${item?.file_uri}`
        )
      : ["/assets/placeholder.jpg"];

  const prev = useCallback(() =>
    setActive((a) => (a === 0 ? images.length - 1 : a - 1)),
    [images.length]
  );

  const next = useCallback(() =>
    setActive((a) => (a === images.length - 1 ? 0 : a + 1)),
    [images.length]
  );

  return (
    <>
     <div className="lg:sticky lg:top-6 select-none">
  <div className="flex gap-3 w-full">

          {/* Vertical Thumbnails */}
          {images.length > 1 && (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`
                    relative flex-shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden
                    border-2 transition-all duration-200 group/thumb
                    ${active === i
                      ? "border-[#2d4a35] ring-2 ring-[#2d4a35]/20 opacity-100 scale-[1.03]"
                      : "border-transparent opacity-50 hover:opacity-85 hover:border-[#8fa989] hover:scale-[1.02]"
                    }
                  `}
                >
                  <ProxyImage
                    src={img}
                    // unoptimized={process.env.NODE_ENV === "development"}
                    // crossOrigin="anonymous"
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                  />
                  {/* Active indicator line */}
                  {active === i && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#2d4a35] rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
             <div className="relative flex-1 min-w-0 flex flex-col gap-2">
            <div
              className={`
                relative aspect-square rounded-2xl overflow-hidden bg-[#f0ede8] group
                shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300
                hover:shadow-[0_8px_40px_rgba(0,0,0,0.13)]
                ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}
              `}
              onClick={() => setZoomed((z) => !z)}
            >
              <ProxyImage
                src={images[active]}
                // unoptimized={process.env.NODE_ENV === "development"}
                // crossOrigin="anonymous"
                alt="Product"
                fill
                priority
                className={`object-cover transition-transform duration-500 ease-out ${
                  zoomed
                    ? "scale-150 group-hover:scale-[1.6]"
                    : "scale-100 group-hover:scale-[1.04]"
                }`}
              />

              {/* Gradient overlay bottom */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

              {/* Badge */}
              {badge && (
                <span className="absolute top-3 left-3 bg-[#2d4a35] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full z-10 shadow-md">
                  {badge}
                </span>
              )}

              {/* Zoom + Lightbox controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox(true);
                  }}
                  className="bg-white/85 backdrop-blur-sm rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
                  title="Open fullscreen"
                >
                  <ZoomIn className="w-4 h-4 text-[#2d4a35]" />
                </button>
              </div>

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 z-10"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#2d4a35]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 z-10"
                  >
                    <ChevronRight className="w-4 h-4 text-[#2d4a35]" />
                  </button>
                </>
              )}

              {/* Image counter pill */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm tracking-wide">
                  {active + 1} / {images.length}
                </div>
              )}

              {/* Zoom indicator */}
              <div className="absolute bottom-3 right-3 bg-white/75 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {zoomed
                  ? <ZoomOut className="w-3.5 h-3.5 text-[#2d4a35]" />
                  : <ZoomIn className="w-3.5 h-3.5 text-[#2d4a35]" />
                }
              </div>
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all duration-200 ${
                      active === i
                        ? "w-5 h-1.5 bg-[#2d4a35]"
                        : "w-1.5 h-1.5 bg-[#c5c2bb] hover:bg-[#8fa989]"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all duration-200 hover:scale-110 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main lightbox image */}
          <div
            className="relative w-[90vw] h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active]}
              unoptimized={process.env.NODE_ENV === "development"}
              crossOrigin="anonymous"
              alt="Product fullscreen"
              fill
              className="object-contain"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Lightbox thumbnails strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-2xl">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    active === i
                      ? "border-white opacity-100 scale-110"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img}
                    unoptimized={process.env.NODE_ENV === "development"}
                    crossOrigin="anonymous"
                    alt={`Thumb ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}