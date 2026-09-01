"use client";

import Image from "next/image";
import { Check, MoreVertical } from "lucide-react";
import { useState } from "react";
import { Photo } from "./Gallerydata";
import "./gallery-animations.css";

interface PhotoCardProps {
  photo: Photo;
  index?: number;
}

export default function PhotoCard({ photo, index = 0 }: PhotoCardProps) {
  const [selected, setSelected] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const delay = `${(index % 20) * 0.04}s`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "anim-card-enter group rounded-xl overflow-hidden cursor-pointer",
        "border bg-white transition-all duration-300 ease-out",
        selected
          ? "border-blue-400 ring-2 ring-blue-100 shadow-md -translate-y-0.5"
          : hovered
          ? "border-stone-300 shadow-lg -translate-y-1"
          : "border-stone-200 shadow-none translate-y-0",
      ].join(" ")}
      style={{ animationDelay: delay }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {!imgError ? (
          <Image
            src={photo.src}
            alt={photo.name}
            fill
            unoptimized
            className={[
              "object-cover transition-transform duration-500 ease-out",
              hovered ? "scale-110" : "scale-100",
            ].join(" ")}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <svg width="28" height="28" fill="none" stroke="#a8a29e" strokeWidth="1.4" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className={[
            "absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent transition-opacity duration-300",
            hovered || selected ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* Top actions */}
        <div
          className={[
            "absolute top-2 left-2 right-2 flex justify-between items-center transition-all duration-200",
            hovered || selected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
          ].join(" ")}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setSelected((s) => !s); }}
            aria-label="Select photo"
            className={[
              "w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-200",
              selected
                ? "bg-blue-500 border-blue-500 scale-110"
                : "bg-white/90 border-white/70 hover:scale-110",
            ].join(" ")}
          >
            {selected && (
              <Check size={10} strokeWidth={3} color="white" className="anim-check-pop" />
            )}
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
            className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-stone-700 hover:scale-110 transition-transform duration-150"
          >
            <MoreVertical size={12} strokeWidth={1.8} />
          </button>
        </div>

        {/* Category badge */}
        <div
          className={[
            "absolute bottom-2 left-2 transition-all duration-200",
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
          ].join(" ")}
        >
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm">
            {photo.category}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-[11.5px] text-stone-500 truncate leading-none">
          {photo.name}
        </span>
        {selected && (
          <span className="anim-dot-pulse ml-2 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
        )}
      </div>
    </div>
  );
}
