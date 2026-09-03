"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ─── DATA ────────────────────────────────────────────────────────────────────
interface Photo { id: number; name: string; src: string; }

const LOADED_CACHE_KEY = "gallery-loaded-images";
let loadedImagesCache: Set<string> | null = null;
function getLoadedCache(): Set<string> {
  if (loadedImagesCache) return loadedImagesCache;
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(LOADED_CACHE_KEY);
    loadedImagesCache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    loadedImagesCache = new Set();
  }
  return loadedImagesCache;
}
function markImageLoaded(src: string) {
  const cache = getLoadedCache();
  if (cache.has(src)) return;
  cache.add(src);
  try {
    sessionStorage.setItem(LOADED_CACHE_KEY, JSON.stringify([...cache]));
  } catch {
    // sessionStorage unavailable — in-memory cache still covers this page load
  }
}
function sku(id: number) {
  return `HB${String(id).padStart(4, "0")}`;
}

const PHOTOS: Photo[] = [
  { id: 1, name: "bags", src: "/assets/GalleryImage/bags.jpg" },
  { id: 2, name: "IMG_0357", src: "/assets/GalleryImage/IMG_0357.jpg" },
  { id: 3, name: "IMG_0395", src: "/assets/GalleryImage/IMG_0395.jpg" },
  { id: 4, name: "IMG_0450", src: "/assets/GalleryImage/IMG_0450.jpg" },
  { id: 5, name: "IMG_0480", src: "/assets/GalleryImage/IMG_0480.jpg" },
  { id: 6, name: "IMG_0493", src: "/assets/GalleryImage/IMG_0493.jpg" },
  { id: 7, name: "IMG_0559", src: "/assets/GalleryImage/IMG_0559.jpg" },
  { id: 8, name: "IMG_0596", src: "/assets/GalleryImage/IMG_0596.jpg" },
  { id: 9, name: "IMG_0597", src: "/assets/GalleryImage/IMG_0597.jpg" },
  { id: 10, name: "IMG_0598", src: "/assets/GalleryImage/IMG_0598.jpg" },
  { id: 11, name: "IMG_0599", src: "/assets/GalleryImage/IMG_0599.jpg" },
  { id: 12, name: "IMG_0615", src: "/assets/GalleryImage/IMG_0615.jpg" },
  { id: 13, name: "IMG_1193", src: "/assets/GalleryImage/IMG_1193.jpg" },
  { id: 14, name: "IMG_2241", src: "/assets/GalleryImage/IMG_2241.jpg" },
  { id: 15, name: "IMG_2244", src: "/assets/GalleryImage/IMG_2244.jpg" },
  { id: 16, name: "IMG_2518", src: "/assets/GalleryImage/IMG_2518.jpg" },
  { id: 17, name: "IMG_2532", src: "/assets/GalleryImage/IMG_2532.jpg" },
  { id: 18, name: "IMG_2876", src: "/assets/GalleryImage/IMG_2876.jpg" },
  { id: 19, name: "IMG_3527", src: "/assets/GalleryImage/IMG_3527.jpg" },
  { id: 20, name: "IMG_3590", src: "/assets/GalleryImage/IMG_3590.jpg" },
  { id: 21, name: "IMG_4039", src: "/assets/GalleryImage/IMG_4039.jpg" },
  { id: 22, name: "IMG_4086", src: "/assets/GalleryImage/IMG_4086.jpg" },
  { id: 23, name: "IMG_4140", src: "/assets/GalleryImage/IMG_4140.jpg" },
  { id: 24, name: "IMG_4151", src: "/assets/GalleryImage/IMG_4151.jpg" },
  { id: 25, name: "IMG_4152", src: "/assets/GalleryImage/IMG_4152.jpg" },
  { id: 26, name: "IMG_4218", src: "/assets/GalleryImage/IMG_4218.jpg" },
  { id: 27, name: "IMG_4262", src: "/assets/GalleryImage/IMG_4262.jpg" },
  { id: 28, name: "IMG_8167", src: "/assets/GalleryImage/IMG_8167.jpg" },
  { id: 29, name: "IMG_8978", src: "/assets/GalleryImage/IMG_8978.jpg" },
  { id: 30, name: "IMG_9251", src: "/assets/GalleryImage/IMG_9251.jpg" },
  { id: 31, name: "IMG_9398", src: "/assets/GalleryImage/IMG_9398.jpg" },
  { id: 32, name: "IMG_9524", src: "/assets/GalleryImage/IMG_9524.jpg" },
  { id: 33, name: "IMG_9544", src: "/assets/GalleryImage/IMG_9544.jpg" },
  { id: 34, name: "IMG_9545", src: "/assets/GalleryImage/IMG_9545.jpg" },
  { id: 35, name: "IMG_9826", src: "/assets/GalleryImage/IMG_9826.jpg" },
];

// ─── TEXTURE / PERFORATION ────────────────────────────────────────────────────
function PaperGrain() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[60] h-full w-full opacity-[0.035] mix-blend-multiply" aria-hidden="true">
      <filter id="paperGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paperGrain)" />
    </svg>
  );
}

// A row of little punch-holes, the way a perforated tear-line runs across a tag
function Perforation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-border) 1.2px, transparent 1.2px)",
        backgroundSize: "9px 1px",
        backgroundRepeat: "repeat-x",
      }}
      aria-hidden="true"
    />
  );
}

// The die-cut hole every swing tag has, punched through the top edge
function TagHole({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-4 ${className}`} aria-hidden="true">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-background border border-border" />
    </div>
  );
}

// ─── LOADER ──────────────────────────────────────────────────────────────────
function AnimatedLoader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(onComplete, 300);
          return 100;
        }
        return p + 4;
      });
    }, 16);
    return () => clearInterval(iv);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
    >
      <div className="relative w-16 h-20 flex flex-col items-center">
        <div className="w-3 h-3 rounded-full border-2 border-foreground mb-1" />
        <div
          className="flex-1 w-full flex items-center justify-center bg-foreground"
          style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 15%)" }}
        >
          <span className="text-xs font-bold tracking-wide text-primary">HB</span>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Loading the archive
      </p>
      <div className="mt-3 w-40 h-[3px] bg-border">
        <motion.div className="h-full bg-primary" style={{ width: `${count}%` }} />
      </div>
    </motion.div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function HeroSection({ loaded }: { loaded: boolean }) {
  const count = useCountUp(PHOTOS.length, loaded);

  return (
    <section className="relative bg-background">
      <div className="container py-16 md:py-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
          <div className="max-w-2xl">
            <h1
              className="font-heading font-bold uppercase leading-[0.92] tracking-tight text-foreground"
              style={{ fontSize: "clamp(2.6rem,7vw,5.5rem)" }}
            >
              Printed. Stitched.
              <br />Shipped.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Every custom piece that has left the HashtagBillionaire floor,
              kept here exactly as it shipped — one tag per piece.
            </p>
            <a
              href="#archive"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium pb-1 border-b border-foreground text-foreground hover:text-primary hover:border-primary transition-colors duration-200"
            >
              View the archive
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="translate-y-px">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* the tag */}
          <div
            className="relative w-full max-w-[210px] justify-self-start lg:justify-self-end"
            style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.14))" }}
          >
            <svg className="absolute -top-9 left-1/2 -translate-x-1/2 text-border" width="30" height="40" viewBox="0 0 30 40" fill="none">
              <path d="M15 0C15 0 4 10 4 20C4 26 9 30 15 30C21 30 26 26 26 20C26 10 15 0 15 0Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="pt-9 pb-5 px-5 border border-border bg-card">
              <div className="flex justify-center mb-4">
                <div className="w-3 h-3 rounded-full border border-border" />
              </div>
              <div className="flex items-baseline justify-center">
                <span className="font-heading font-bold tabular-nums text-foreground" style={{ fontSize: "2.75rem", lineHeight: 1 }}>
                  {count}
                </span>
              </div>
              <p className="text-center text-sm mt-1.5 text-muted-foreground">
                pieces produced
              </p>
              <Perforation className="my-4" />
              <p className="text-center text-xs font-mono text-muted-foreground">
                {sku(PHOTOS.length)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Perforation />
    </section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function MarqueeSection() {
  const items = ["Premium merchandise", "Custom caps", "Race-ready bibs", "Branded hoodies", "Team uniforms", "Bespoke bags", "Accessories"];
  const doubled = [...items, ...items];
  return (
    <div className="py-2.5 overflow-hidden bg-foreground">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-xs flex items-center gap-8 text-background/70">
            {item}
            <span className="w-1 h-1 rounded-full inline-block flex-shrink-0 bg-primary" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── GALLERY CARD (swing tag) ─────────────────────────────────────────────────
function GalleryCard({ photo, onClick }: { photo: Photo; onClick: (p: Photo) => void }) {
  const [imgLoaded, setImgLoaded] = useState(() => getLoadedCache().has(photo.src));
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      className="group relative flex flex-col border border-border bg-card cursor-pointer"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(photo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(photo); }}
    >
      <TagHole />
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {!imgLoaded && !imgError && <div className="absolute inset-0 animate-pulse bg-muted" />}
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 16L8.5 10.5L13 15L16 12L21 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={photo.src}
            alt={photo.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => { setImgLoaded(true); markImageLoaded(photo.src); }}
            onError={() => setImgError(true)}
            className={`object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div
          className="absolute top-2.5 right-2.5 px-1.5 py-0.5 border border-primary/60 text-primary text-[10px] font-mono leading-none -rotate-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-hidden="true"
        >
          SAMPLE
        </div>
      </div>

      <Perforation />

      <div className="px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading font-semibold text-sm truncate text-foreground">{photo.name}</span>
          <span className="text-xs font-mono shrink-0 text-muted-foreground">{sku(photo.id)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TOOLBAR ──────────────────────────────────────────────────────────────────
function Toolbar({
  value, onChange, resultCount, compact, onToggleCompact,
}: { value: string; onChange: (v: string) => void; resultCount: number; compact: boolean; onToggleCompact: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-4 border-b border-border">
      <div>
        <p className="text-sm text-muted-foreground">In the archive</p>
        <p className="text-2xl font-heading font-bold tabular-nums text-foreground">
          {String(resultCount).padStart(2, "0")} <span className="text-sm font-normal text-muted-foreground">pieces</span>
        </p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search by name or SKU"
            className="w-full bg-background border border-border pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200"
          />
          {value && (
            <button onClick={() => onChange("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          )}
        </div>

        <button
          onClick={onToggleCompact}
          aria-pressed={compact}
          title={compact ? "Loose grid" : "Tight grid"}
          className="shrink-0 w-9 h-9 flex items-center justify-center border border-border text-foreground hover:border-primary hover:text-primary transition-colors duration-150"
        >
          {compact ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.8" /><rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.8" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.8" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── GALLERY GRID ─────────────────────────────────────────────────────────────
function GalleryGrid({ onOpen }: { onOpen: (p: Photo) => void }) {
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHOTOS;
    return PHOTOS.filter((p) => p.name.toLowerCase().includes(q) || sku(p.id).toLowerCase().includes(q));
  }, [query]);

  return (
    <section id="archive" className="container py-14 bg-background">
      <Toolbar value={query} onChange={setQuery} resultCount={filtered.length} compact={compact} onToggleCompact={() => setCompact((c) => !c)} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border">
          <p className="font-heading font-bold text-lg mb-1 text-foreground">Nothing matches &quot;{query}&quot;</p>
          <p className="text-sm text-muted-foreground">Try a different name or SKU.</p>
        </div>
      ) : (
        <motion.div layout className={`grid gap-4 ${compact ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
          {filtered.map((photo) => (
            <GalleryCard key={photo.id} photo={photo} onClick={onOpen} />
          ))}
        </motion.div>
      )}
    </section>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function GalleryModal({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const [current, setCurrent] = useState<Photo | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => { setCurrent(photo); setZoomed(false); }, [photo]);
  useEffect(() => {
    document.body.style.overflow = photo ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [photo]);
  useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const navigate = (dir: number) => {
    if (!current) return;
    const idx = PHOTOS.findIndex((p) => p.id === current.id);
    setZoomed(false);
    setCurrent(PHOTOS[(idx + dir + PHOTOS.length) % PHOTOS.length]);
  };
  const currentIndex = current ? PHOTOS.findIndex((p) => p.id === current.id) : -1;

  return (
    <AnimatePresence>
      {photo && current && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 w-full max-w-5xl border border-border bg-background shadow-2xl md:flex md:h-[78vh]"
            initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative flex-1 bg-muted flex items-center justify-center overflow-hidden min-h-[45vh] md:min-h-0"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(dx) > 60) navigate(dx > 0 ? -1 : 1);
                touchStartX.current = null;
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.src}
                  alt={current.name}
                  onClick={() => setZoomed((z) => !z)}
                  className={`max-w-full max-h-full transition-transform duration-300 ease-out cursor-zoom-in ${zoomed ? "scale-150 cursor-zoom-out" : "object-contain"}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
              <button onClick={() => navigate(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => navigate(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 1L11 7L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            <div className="md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-border flex flex-col">
              <div className="p-5 border-b border-border">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-heading font-bold text-lg truncate text-foreground">{current.name}</h2>
                  <span className="text-sm font-mono tabular-nums shrink-0 text-muted-foreground">
                    {String(currentIndex + 1).padStart(2, "0")}/{String(PHOTOS.length).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1 text-xs font-mono text-primary">{sku(current.id)}</p>
                <p className="mt-2 text-xs text-muted-foreground">Use ← → to browse, click the image to zoom, or press Esc to close.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 md:grid-cols-3 gap-2 content-start">
                {PHOTOS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setCurrent(p); setZoomed(false); }}
                    aria-label={`View ${p.name}`}
                    className={`relative aspect-square overflow-hidden border transition-colors duration-150 ${p.id === current.id ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}
                  >
                    <Image src={p.src} alt={p.name} fill unoptimized sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── BACK TO TOP ──────────────────────────────────────────────────────────────
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-foreground border border-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 9L7 3L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-foreground">
      <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-heading font-bold text-sm text-background">HashtagBillionaire</span>
        <p className="text-xs text-background/50">
          Every piece here shipped from our floor
        </p>
      </div>
    </footer>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GalleryMain() {
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Photo | null>(null);

  return (
    <>
      <PaperGrain />
      <AnimatePresence>{!loaded && <AnimatedLoader onComplete={() => setLoaded(true)} />}</AnimatePresence>

      {loaded && (
        <motion.main className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          <HeroSection loaded={loaded} />
          <MarqueeSection />
          <GalleryGrid onOpen={setModal} />
          <Footer />
          <GalleryModal photo={modal} onClose={() => setModal(null)} />
          <BackToTop />
        </motion.main>
      )}
    </>
  );
}