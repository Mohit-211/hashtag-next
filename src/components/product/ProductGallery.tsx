
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
import { PLACEHOLDER_IMAGE, type GalleryAsset } from "@/lib/images";

interface Props {
  /** Existing gallery images (used when `assets` is not given) */
  attachments?: Array<string | { file_uri?: string; label?: string }>;

  /** Normalized supplier images; Front/Back are pinned at the bottom of the thumbnails. */
  assets?: GalleryAsset[] | null;

  badge?: string;
  onActiveChange?: (index: number) => void;
}

export default function ProductGallery({
  attachments = [],
  assets,
  onActiveChange,
}: Props) {
  const frontImage = assets?.find((a) => a.assetType === "Front")?.image;
  const backImage = assets?.find((a) => a.assetType === "Back")?.image;

  // Gallery images with an optional label shown under the thumbnail
  const galleryItems = (
    assets
      ? assets
          .filter((a) => a.assetType !== "Front" && a.assetType !== "Back")
          .map((a) => ({ src: a.image, label: a.label }))
      : attachments.map((item) =>
          typeof item === "string"
            ? { src: item, label: undefined }
            : { src: item?.file_uri, label: item?.label }
        )
  ).filter((item): item is { src: string; label: string | undefined } => Boolean(item.src));
  const galleryImages = galleryItems.map((item) => item.src);

  // Selection and zoom belong to the current variant's image set, so a
  // variant change starts again on the first image, unzoomed.
  const viewKey = [...galleryImages, frontImage ?? "", backImage ?? ""].join("|");
  const [selection, setSelection] = useState({ key: viewKey, index: 0, zoomed: false });
  const current = selection.key === viewKey ? selection : { key: viewKey, index: 0, zoomed: false };
  const activeIndex = current.index;
  const zoomed = current.zoomed;
  const setActive = useCallback(
    (update: number | ((a: number) => number)) =>
      setSelection((prev) => {
        const base = prev.key === viewKey ? prev.index : 0;
        return { key: viewKey, index: typeof update === "function" ? update(base) : update, zoomed: false };
      }),
    [viewKey]
  );
  const setZoomed = useCallback(
    (update: boolean | ((z: boolean) => boolean)) =>
      setSelection((prev) => {
        const cur = prev.key === viewKey ? prev : { key: viewKey, index: 0, zoomed: false };
        return { ...cur, zoomed: typeof update === "function" ? update(cur.zoomed) : update };
      }),
    [viewKey]
  );
  const [lightbox, setLightbox] = useState(false);

  // Add Front and Back images to gallery
  const images = [
    ...galleryImages,
    ...(frontImage ? [frontImage] : []),
    ...(backImage ? [backImage] : []),
  ];

  // Fallback image
  const finalImages =
    images.length > 0 ? images : [PLACEHOLDER_IMAGE];

  // Active image index
  const active =
    activeIndex < finalImages.length ? activeIndex : 0;
  const imageCount = finalImages.length;

  // Notify parent
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  const setActiveIndex = useCallback((index: number) => {
    setActive(index);
    setZoomed(false);
  }, [setActive, setZoomed]);

  // Previous image
  const prev = useCallback(() => {
    setActive((current) =>
      current <= 0
        ? imageCount - 1
        : current - 1
    );
    setZoomed(false);
  }, [imageCount, setActive, setZoomed]);

  // Next image
  const next = useCallback(() => {
    setActive((current) =>
      current >= imageCount - 1
        ? 0
        : current + 1
    );
    setZoomed(false);
  }, [imageCount, setActive, setZoomed]);

  // Front and Back indexes
  const frontIndex = galleryImages.length;
  const backIndex = galleryImages.length + (frontImage ? 1 : 0);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [lightbox, prev, next]);
console.log(finalImages,"finalImages")
  // One thumbnail tile; a label (e.g. "Front", "On Model Side") shows underneath when given.
  const renderThumb = (src: string, label: string | undefined, index: number) => (
    <button
      type="button"
      key={`${src}-${index}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex(index);
      }}
      aria-pressed={active === index}
      aria-label={label ?? `View ${index + 1}`}
      className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
    >
      <span
        className={`
          relative block w-[64px] h-[64px]
          rounded-xl overflow-hidden border-2
          transition-all duration-200
          ${
            active === index
              ? "border-foreground ring-2 ring-foreground/30 shadow-lg opacity-100 scale-105"
              : "border-border opacity-70 hover:opacity-100 hover:border-input"
          }
        `}
      >
        <ProxyImage
          src={src}
          alt={label ?? `View ${index + 1}`}
          fill
          className="object-contain p-1 pointer-events-none"
        />
        {active === index && (
          <span className="absolute left-0 inset-y-0 w-[3px] bg-foreground rounded-r-full" />
        )}
      </span>
      {label && (
        <span
          className={`w-[64px] text-center text-[9px] leading-tight font-bold uppercase tracking-wider ${
            active === index ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
  return (
    <>
      <div className="select-none">
        <div className="flex gap-3 w-full">

          {/* Vertical Thumbnails */}
          {(finalImages.length > 1 || frontImage || backImage) && (
            <div className="flex flex-col pt-2 gap-2 flex-shrink-0">
            {/* Scrollable gallery thumbnails; Front/Back stay pinned below. */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1 scrollbar-none">
              {galleryItems.map((item, i) => renderThumb(item.src, item.label, i))}
            </div>

            {/* Front / Back — labelled thumbnails pinned at the bottom of the column */}
            {frontImage && renderThumb(frontImage, "Front", frontIndex)}
            {backImage && renderThumb(backImage, "Back", backIndex)}
            </div>
          )}

          {/* Main Image */}
          <div className="relative flex-1 min-w-0 flex flex-col gap-3">
            <div
              className={`
                relative aspect-square rounded-2xl overflow-hidden
                bg-card group border border-border
                transition-all duration-300
                hover:shadow-xl hover:shadow-foreground/10
                ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}
              `}
              onClick={() => setZoomed((z) => !z)}
            >
              <ProxyImage
                src={finalImages[active]}
                alt="Product"
                fill
                priority
                className={`
                  object-contain transition-transform duration-500
                  ease-out p-3
                  ${
                    zoomed
                      ? "scale-150"
                      : "scale-100 group-hover:scale-[1.03]"
                  }
                `}
              />

              {/* Subtle vignette */}
              <div className="absolute inset-0 shadow-[inset_0_0_60px_color-mix(in_srgb,var(--color-foreground)_4%,transparent)] pointer-events-none rounded-2xl" />

              {/* Previous / Next arrows */}
              {finalImages.length > 1 && (
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
              {finalImages.length > 1 && (
                <div className="absolute bottom-3.5 right-3.5 bg-card/80 backdrop-blur-sm text-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider border border-border shadow-sm">
                  {active + 1} / {finalImages.length}
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
            {finalImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {finalImages.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`
                      rounded-full transition-all duration-250
                      ${
                        active === i
                          ? "w-6 h-1.5 bg-foreground"
                          : "w-1.5 h-1.5 bg-border hover:bg-foreground/50"
                      }
                    `}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
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
            {active + 1} / {finalImages.length}
          </div>

          {/* Previous */}
          {finalImages.length > 1 && (
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

          {/* Fullscreen Image */}
          <div
            className="relative w-[88vw] h-[88vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={finalImages[active]}
              unoptimized={process.env.NODE_ENV === "development"}
              crossOrigin="anonymous"
              alt="Product fullscreen"
              fill
              className="object-contain"
            />
          </div>

          {/* Next */}
          {finalImages.length > 1 && (
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
          {finalImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 bg-card/10 backdrop-blur-sm rounded-2xl border border-card/10">
              {finalImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  className={`
                    relative w-11 h-11 rounded-xl overflow-hidden
                    border-2 transition-all duration-200 flex-shrink-0
                    ${
                      active === i
                        ? "border-card opacity-100 scale-110"
                        : "border-transparent opacity-40 hover:opacity-75"
                    }
                  `}
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
