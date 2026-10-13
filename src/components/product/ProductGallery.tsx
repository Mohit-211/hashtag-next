"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import ProxyImage from "../ProxyImage";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

interface Props {
  /** Image URLs, or API attachment rows carrying a `file_uri`. */
  attachments?: Array<string | { file_uri?: string }>;
  badge?: string;
  onActiveChange?: (index: number) => void;
}

export default function ProductGallery({
  attachments = [],

  onActiveChange,
}: Props) {
  const [activeIndex, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const images =
    attachments.length > 0
      ? attachments.map((item) =>
          typeof item === "string" ? item : `${item?.file_uri}`
        )
      : [PLACEHOLDER_IMAGE];
  // A shorter image list (e.g. after a variant change) falls back to the first image.
  const active = activeIndex < images.length ? activeIndex : 0;

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);


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
            <div className="flex flex-col pt-2 gap-2 overflow-y-auto max-h-[520px] flex-shrink-0 pr-1 scrollbar-none">
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
                        ? "border-foreground ring-2 ring-foreground/30 shadow-lg opacity-100 scale-105"
                        : "border-border opacity-70 hover:opacity-100 hover:border-input"
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
                    <span className="absolute left-0 inset-y-0 w-[3px] bg-foreground rounded-r-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 min-w-0 flex flex-col gap-3">
            <div
            className={`
  relative aspect-square rounded-2xl overflow-hidden bg-card group
  border border-border
  transition-all duration-300

  hover:shadow-xl hover:shadow-foreground/10
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
              <div className="absolute inset-0 shadow-[inset_0_0_60px_color-mix(in_srgb,var(--color-foreground)_4%,transparent)] pointer-events-none rounded-2xl" />

          

              {/* Fullscreen button */}
              {/* <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(true);
                }}
                className="absolute top-3.5 right-3.5 bg-card/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-card hover:shadow-md z-10"
                title="View fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-foreground" />
              </button> */}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-card hover:shadow-md z-10"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-sm rounded-xl p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-card hover:shadow-md z-10"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </>
              )}

              {/* Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3.5 right-3.5 bg-card/80 backdrop-blur-sm text-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider border border-border shadow-sm">
                  {active + 1} / {images.length}
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3.5 left-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-border shadow-sm">
                  {zoomed ? (
                    <ZoomOut className="w-3 h-3 text-foreground" />
                  ) : (
                    <ZoomIn className="w-3 h-3 text-foreground" />
                  )}

                  <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">
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
                        ? "w-6 h-1.5 bg-foreground"
                        : "w-1.5 h-1.5 bg-border hover:bg-border"
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
          className="fixed inset-0 z-50 bg-foreground/95 backdrop-blur-md flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-5 right-5 bg-card/10 hover:bg-card/20 text-background rounded-xl p-2.5 transition-all duration-200 hover:scale-110 z-10 border border-card/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-card/10 text-background text-xs px-4 py-2 rounded-full backdrop-blur-sm font-medium border border-card/10">
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
              className="absolute left-5 top-1/2 -translate-y-1/2 bg-card/10 hover:bg-card/20 text-background rounded-xl p-3 transition-all duration-200 hover:scale-110 z-10 border border-card/10"
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
              className="absolute right-5 top-1/2 -translate-y-1/2 bg-card/10 hover:bg-card/20 text-background rounded-xl p-3 transition-all duration-200 hover:scale-110 z-10 border border-card/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 bg-card/10 backdrop-blur-sm rounded-2xl border border-card/10">
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
                      ? "border-card opacity-100 scale-110"
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