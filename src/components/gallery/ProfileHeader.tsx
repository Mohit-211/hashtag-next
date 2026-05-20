"use client";

import { Heart, Bookmark } from "lucide-react";
import "./gallery-animations.css";

export default function ProfileHeader() {
  return (
    <div
      className="anim-header-enter max-w-7xl mx-auto px-8 pt-7 pb-2 flex items-center gap-4"
      style={{ animationDelay: "0.08s" }}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 border-2 border-white shadow-sm flex items-center justify-center text-[13px] font-semibold text-stone-600 select-none shrink-0 transition-transform duration-200 hover:scale-105">
        TC
      </div>

      {/* Name */}
      <div>
        <p className="text-[15px] font-semibold text-stone-900 leading-tight">
          Todd Coleman
        </p>
        <p className="text-[12px] text-stone-400 mt-0.5">Product Gallery</p>
      </div>

      {/* Actions */}
      <div className="ml-auto flex gap-2">
        <ActionBtn aria-label="Liked">
          <Heart size={14} strokeWidth={1.7} />
        </ActionBtn>
        <ActionBtn aria-label="Bookmarked">
          <Bookmark size={14} strokeWidth={1.7} />
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
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all duration-150 hover:border-stone-300 hover:text-rose-500 hover:scale-110 active:scale-95"
    >
      {children}
    </button>
  );
}
