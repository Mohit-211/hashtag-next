"use client";

import { MapPin, Calendar, Images } from "lucide-react";
import "./gallery-animations.css";

interface HeroSectionProps {
  totalPhotos?: number;
}

export default function HeroSection({ totalPhotos = 35 }: HeroSectionProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-8 pt-10 pb-8 overflow-hidden">

      {/* ── Background decorative blobs ───────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(214,211,209,0.35) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 right-40 w-40 h-40 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168,162,158,0.15) 0%, transparent 70%)",
        }}
      />

      {/* ── Badge ─────────────────────────────────────────────── */}
      <div
        className="anim-fade-down inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-white mb-6"
        style={{ animationDelay: "0.05s" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-stone-500">
          Photo Gallery
        </span>
      </div>

      {/* ── Headline ──────────────────────────────────────────── */}
      <div
        className="anim-fade-down"
        style={{ animationDelay: "0.1s" }}
      >
        <h1 className="text-[52px] sm:text-[64px] font-black leading-[0.95] tracking-tight text-stone-900 mb-0">
          Visual
        </h1>
        <h1
          className="text-[52px] sm:text-[64px] font-black leading-[0.95] tracking-tight mb-6"
          style={{ color: "#c4bdb6" }}
        >
          Archive.
        </h1>
      </div>

      {/* ── Description ───────────────────────────────────────── */}
      <p
        className="anim-fade-down text-[14.5px] text-stone-500 leading-relaxed max-w-sm mb-8"
        style={{ animationDelay: "0.18s" }}
      >
        A decade of architecture, travel, street life, and portraits — collected
        across cities, borders, and moments in between.
      </p>

      {/* ── Meta chips ────────────────────────────────────────── */}
      <div
        className="anim-fade-down flex flex-wrap items-center gap-2"
        style={{ animationDelay: "0.25s" }}
      >
        <MetaChip icon={<MapPin size={11} strokeWidth={1.8} />} label="Global" />
        <MetaChip icon={<Calendar size={11} strokeWidth={1.8} />} label="2012 – 2019" />
        <MetaChip
          icon={<Images size={11} strokeWidth={1.8} />}
          label={`${totalPhotos} Photos`}
          highlight
        />
      </div>

      {/* ── Decorative rule ───────────────────────────────────── */}
      <div
        className="anim-fade-down mt-10 flex items-center gap-3"
        style={{ animationDelay: "0.32s" }}
      >
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[10px] tracking-widest uppercase text-stone-300 font-medium">
          Collection
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
    </section>
  );
}

function MetaChip({
  icon,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium",
        "transition-all duration-150 hover:scale-105 cursor-default",
        highlight
          ? "bg-stone-900 text-stone-50 border-stone-900"
          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300",
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  );
}
