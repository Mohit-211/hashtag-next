"use client";

import { Search, Upload } from "lucide-react";
import "./gallery-animations.css";

export default function TopBar() {
  return (
    <nav
      className="anim-nav-enter sticky top-0 z-50 h-14 flex items-center justify-between px-8 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/70"
    >
     

      <div
        className="anim-fade-down flex items-center gap-2"
        style={{ animationDelay: "0.12s" }}
      >
        <IconButton aria-label="Search">
          <Search size={14} strokeWidth={1.7} />
        </IconButton>
        <IconButton aria-label="Upload">
          <Upload size={14} strokeWidth={1.7} />
        </IconButton>
        <button className="h-8 px-4 rounded-lg bg-stone-900 text-stone-50 text-[12.5px] font-medium tracking-wide transition-all duration-200 hover:bg-stone-700 hover:scale-[1.03] active:scale-[0.97]">
          Get in touch
        </button>
      </div>
    </nav>
  );
}

function IconButton({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all duration-150 hover:border-stone-300 hover:text-stone-800 hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}
