"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from "lucide-react";

import ProxyImage from "../Proxyimage";

interface Props {
  attachments?: any[];
  badge?: string;
  onActiveChange?: (index: number) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ProductGallery({
  attachments = [],
  badge = "New Arrival",
  onActiveChange,
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

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Prevent invalid active index only
  useEffect(() => {
    if (active >= images.length) {
      setActive(0);
    }
  }, [images.length, active]);

  const setActiveIndex = useCallback((index: number) => {
    setActive(index);
  }, []);

  const prev = useCallback(
    () => setActive((a) => (a === 0 ? images.length - 1 : a - 1)),
    [images.length]
  );

  const next = useCallback(
    () => setActive((a) => (a === images.length - 1 ? 0 : a + 1)),
    [images.length]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  return (
    <>
      <div className="select-none">
        <div className="flex gap-3 w-full">
          {/* Vertical Thumbnails */}
          {images.length > 1 && (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] flex-shrink-0 pr-1 scrollbar-none">
              {images.map((img, i) => (
                <button
                  type="button"
                  key={`${img}-${i}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className={`
                    relative flex-shrink-0 w-[64px] h-[64px] rounded-xl overflow-hidden
                    border-2 transition-all duration-200 cursor-pointer
                    ${
                      active === i
                        ? "border-[#2d4a35] ring-2 ring-[#2d4a35]/30 shadow-lg opacity-100 scale-105"
                        : "border-[#e8e4df] opacity-70 hover:opacity-100 hover:border-[#8fa989]"
                    }
                  `}
                >
                  <ProxyImage
                    src={img}
                    alt={`View ${i + 1}`}
                    fill
                    className="object-contain p-1 pointer-events-none"
                  />

                  {active === i && (
                    <span className="absolute left-0 inset-y-0 w-[3px] bg-[#2d4a35] rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 min-w-0 flex flex-col gap-3">
            <div
            className={`
  relative aspect-square rounded-2xl overflow-hidden bg-white group
  border border-[#ece8e2]
  transition-all duration-300

  hover:shadow-[0_12px_48px_rgba(45,74,53,0.12)]
  ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}
`}
              onClick={() => setZoomed((z) => !z)}
            >
              <ProxyImage
                src={images[active]}
                alt="Product"
                fill
                priority
                className={`object-contain transition-transform duration-500 ease-out p-3 ${
                  zoomed
                    ? "scale-150"
                    : "scale-100 group-hover:scale-[1.03]"
                }`}
              />

              {/* Subtle vignette */}
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.04)] pointer-events-none rounded-2xl" />

              {/* Badge */}
              {badge && (
                <span className="absolute top-3.5 left-3.5 bg-[#2d4a35] text-white text-[9px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full z-10 shadow-lg">
                  {badge}
                </span>
              )}

              {/* Fullscreen button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(true);
                }}
                className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:shadow-md z-10"
                title="View fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#2d4a35]" />
              </button>

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:shadow-md z-10"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#2d4a35]" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:shadow-md z-10"
                  >
                    <ChevronRight className="w-4 h-4 text-[#2d4a35]" />
                  </button>
                </>
              )}

              {/* Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3.5 right-3.5 bg-white/80 backdrop-blur-sm text-[#2d4a35] text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider border border-[#dde8df] shadow-sm">
                  {active + 1} / {images.length}
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3.5 left-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-[#dde8df] shadow-sm">
                  {zoomed ? (
                    <ZoomOut className="w-3 h-3 text-[#4a7a58]" />
                  ) : (
                    <ZoomIn className="w-3 h-3 text-[#4a7a58]" />
                  )}

                  <span className="text-[9px] font-bold text-[#4a7a58] uppercase tracking-widest">
                    {zoomed ? "Zoom out" : "Zoom in"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`rounded-full transition-all duration-250 ${
                      active === i
                        ? "w-6 h-1.5 bg-[#2d4a35]"
                        : "w-1.5 h-1.5 bg-[#c5c2bb] hover:bg-[#8fa989]"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white rounded-xl p-2.5 transition-all duration-200 hover:scale-110 z-10 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm font-medium border border-white/10">
            {active + 1} / {images.length}
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition-all duration-200 hover:scale-110 z-10 border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            className="relative w-[88vw] h-[88vh] max-w-4xl"
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition-all duration-200 hover:scale-110 z-10 border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
              {images.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    active === i
                      ? "border-white opacity-100 scale-110"
                      : "border-transparent opacity-40 hover:opacity-75"
                  }`}
                >
                  <Image
                    src={img}
                    unoptimized={process.env.NODE_ENV === "development"}
                    crossOrigin="anonymous"
                    alt={`Thumb ${i + 1}`}
                    fill
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}