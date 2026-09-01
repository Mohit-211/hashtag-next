"use client";

import { useState, useMemo, useCallback } from "react";
import TopBar from "./TopBar";
import HeroSection from "./HeroSection";
import FilterBar from "./FilterBar";
import PhotoListRow from "./PhotoListRow";
import PhotoCard from "./PhotoCard";
import { PhotoCategory, PHOTOS } from "./Gallerydata";
import { X, Download, Trash2 } from "lucide-react";
import "./gallery-animations.css";

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState<PhotoCategory>("All");
  const [viewMode, setViewMode]         = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [viewKey, setViewKey]           = useState(0);

  const filtered = useMemo(
    () =>
      activeFilter === "All"
        ? PHOTOS
        : PHOTOS.filter((p) => p.category === activeFilter),
    [activeFilter]
  );

  const handleFilter = useCallback((cat: PhotoCategory) => {
    setActiveFilter(cat);
    setViewKey((k) => k + 1);
    setSelectedIds(new Set());
  }, []);

  const handleViewChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    setViewKey((k) => k + 1);
  }, []);

  const clearSelection = () => setSelectedIds(new Set());
  const selCount = selectedIds.size;

  return (
    <main className="min-h-screen bg-stone-50 font-sans">
      {/* Top navigation bar */}
      {/* <TopBar /> */}

      {/* Hero / header section */}
      <HeroSection totalPhotos={PHOTOS.length} />

      {/* Filter + view toggle bar */}
      <FilterBar
        active={activeFilter}
        onFilter={handleFilter}
        viewMode={viewMode}
        onViewChange={handleViewChange}
      />

      {/* Section label */}
      <div className="max-w-7xl mx-auto px-8 mt-6 mb-3 flex items-center justify-between">
        <span className="text-[10.5px] font-semibold tracking-widest uppercase text-stone-400">
          {activeFilter === "All" ? "All Photos" : activeFilter}
        </span>
        <span key={filtered.length} className="anim-count-pop text-[11px] text-stone-400">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div
          key={`grid-${viewKey}`}
          className="max-w-7xl mx-auto px-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-24"
        >
          {filtered.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} index={i} />
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && filtered.length > 0 && (
        <div
          key={`list-${viewKey}`}
          className="max-w-7xl mx-auto px-8 flex flex-col gap-1.5 pb-24"
        >
          {filtered.map((photo, i) => (
            <PhotoListRow key={photo.id} photo={photo} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="anim-empty-in max-w-7xl mx-auto px-8 py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-stone-400 text-sm font-medium">No photos in this category</p>
          <button
            onClick={() => handleFilter("All")}
            className="mt-3 text-[12px] text-stone-500 underline underline-offset-2 hover:text-stone-800 transition-colors"
          >
            View all photos
          </button>
        </div>
      )}

      {/* Floating selection bar */}
      <div
        className={[
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-3 px-4 py-2.5 rounded-2xl",
          "bg-stone-900 text-white shadow-2xl shadow-stone-900/30",
          "transition-all duration-300 ease-out",
          selCount > 0
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <span className="text-[12.5px] font-medium tabular-nums">
          {selCount} selected
        </span>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <SelBarBtn icon={<Download size={13} />} label="Download" />
        <SelBarBtn icon={<Trash2 size={13} />} label="Delete" danger />
        <button
          onClick={clearSelection}
          aria-label="Clear selection"
          className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-150 hover:scale-110 active:scale-95"
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
    </main>
  );
}

function SelBarBtn({
  icon,
  label,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={[
        "flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium",
        "transition-all duration-150 hover:scale-105 active:scale-95",
        danger
          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
          : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
