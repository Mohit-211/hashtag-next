"use client";

import Image from "next/image";
import { Check, Pencil, MoreHorizontal, Tag } from "lucide-react";
import { useState } from "react";
import { Photo } from "./Gallerydata";
import "./gallery-animations.css";

interface PhotoListRowProps {
  photo: Photo;
  index?: number;
}

export default function PhotoListRow({ photo, index = 0 }: PhotoListRowProps) {
  const [selected, setSelected] = useState(false);
  const [imgError, setImgError] = useState(false);

  const delay = `${(index % 15) * 0.03}s`;

  return (
    <div
      className={[
        "anim-row-enter group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border bg-white",
        "transition-all duration-200 ease-out cursor-pointer",
        selected
          ? "border-blue-300 ring-1 ring-blue-100 bg-blue-50/30"
          : "border-stone-200 hover:border-stone-300 hover:shadow-sm hover:bg-stone-50/60",
      ].join(" ")}
      style={{ animationDelay: delay }}
    >
      {/* Select */}
      <button
        onClick={() => setSelected((s) => !s)}
        aria-label="Select photo"
        className={[
          "w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-[1.5px] transition-all duration-200",
          selected
            ? "bg-blue-500 border-blue-500 scale-110"
            : "border-stone-300 bg-white group-hover:border-stone-400 hover:scale-110",
        ].join(" ")}
      >
        {selected && (
          <Check size={9} strokeWidth={3} color="white" className="anim-check-in" />
        )}
      </button>

      {/* Thumb */}
      <div className="relative w-11 h-8 rounded-lg overflow-hidden bg-stone-100 shrink-0">
        {!imgError ? (
          <Image
            src={photo.src}
            alt={photo.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <svg width="14" height="14" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-[12.5px] font-medium text-stone-700 truncate leading-none">
        {photo.name}
      </span>

      {/* Category badge */}
      <span className="shrink-0 flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 transition-colors duration-150 group-hover:bg-stone-200/70">
        <Tag size={9} strokeWidth={1.8} />
        {photo.category}
      </span>

      {/* Hover actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200">
        <ActionBtn aria-label="Rename">
          <Pencil size={12} strokeWidth={1.6} />
        </ActionBtn>
        <ActionBtn aria-label="More">
          <MoreHorizontal size={12} strokeWidth={1.6} />
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className="w-6 h-6 flex items-center justify-center rounded-md text-stone-400 border border-transparent hover:text-stone-700 hover:border-stone-200 hover:bg-white transition-all duration-150 hover:scale-110 active:scale-95"
    >
      {children}
    </button>
  );
}
