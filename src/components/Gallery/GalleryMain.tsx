"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ─── DATA ────────────────────────────────────────────────────────────────────
interface Photo { id: number; name: string; src: string; }

const PHOTOS: Photo[] = [
  { id: 1, name: "bags", src: "/assets/GalleryImage/bags.png" },
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

// Deliberate bento pattern (cycle of 8) — not decorative randomness, a fixed rhythm
const SPAN_PATTERN = [
  "col-span-2 row-span-2",
  "row-span-1",
  "row-span-2",
  "row-span-1",
  "col-span-2 row-span-1",
  "row-span-1",
  "row-span-2",
  "row-span-1",
];
function getSpan(i: number) {
  return SPAN_PATTERN[i % SPAN_PATTERN.length];
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
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-foreground flex items-center justify-center">
          <span className="text-primary font-heading font-bold text-lg leading-none">H</span>
        </div>
        <div className="font-heading font-bold text-foreground text-lg leading-tight tracking-tight">
          HashtagBillionaire
        </div>
      </div>
      <div className="w-48 h-px bg-border overflow-hidden">
        <motion.div className="h-full bg-primary" style={{ width: `${count}%` }} />
      </div>
      <p className="mt-3 text-muted-foreground text-xs font-medium tabular-nums">{count}%</p>
    </motion.div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const preview = PHOTOS.slice(0, 4);
  return (
    <section className="relative bg-background border-b border-border">
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="relative container grid lg:grid-cols-[1.3fr_1fr] gap-12 py-20 md:py-28 items-center">
        <div>
          <h1 className="font-heading font-bold text-foreground text-[clamp(2.1rem,4.6vw,3.75rem)] leading-[1.08] tracking-tight max-w-xl">
            Every piece we&apos;ve printed, stitched, and shipped
          </h1>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
            A running archive from the HashtagBillionaire floor — custom apparel,
            headwear, and accessories, sample by sample.
          </p>
          <a
            href="#archive"
            className="mt-8 inline-flex items-center gap-2 text-foreground font-medium border-b border-foreground pb-0.5 hover:border-primary hover:text-primary transition-colors duration-200"
          >
            Browse the archive
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 6L7 10L11 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div className="border border-border bg-card p-6 md:p-7">
          <div className="flex items-baseline gap-2.5">
            <span className="font-heading font-bold text-foreground text-5xl md:text-6xl tabular-nums">
              {PHOTOS.length}
            </span>
            <span className="text-muted-foreground text-sm">pieces archived</span>
          </div>
          <div className="mt-6 h-px bg-border" />
          <div className="mt-6 grid grid-cols-4 gap-2">
            {preview.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden border border-border">
                <Image src={p.src} alt={p.name} fill unoptimized sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Updated continuously as new work leaves the floor.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function MarqueeSection() {
  const items = ["Premium merchandise", "Custom caps", "Race-ready bibs", "Branded hoodies", "Team uniforms", "Bespoke bags", "Accessories"];
  const doubled = [...items, ...items];
  return (
    <div className="bg-foreground py-3 overflow-hidden">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-xs font-medium text-background/70 tracking-wide flex items-center gap-10">
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── GALLERY CARD ─────────────────────────────────────────────────────────────
function GalleryCard({ photo, index, onClick }: { photo: Photo; index: number; onClick: (p: Photo) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={`group relative flex flex-col border border-border bg-card overflow-hidden cursor-pointer transition-colors duration-300 hover:border-primary ${getSpan(index)}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay: (index % 8) * 0.035 }}
      onClick={() => onClick(photo)}
    >
      <div className="relative flex-1 overflow-hidden bg-muted">
        <Image
          src={photo.src}
          alt={photo.name}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 shrink-0 bg-card">
        {/* <span className="font-heading text-sm font-medium text-foreground truncate">{photo.name}</span> */}
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {String(photo.id).padStart(2, "0")}
        </span>
      </div>
    </motion.div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, resultCount }: { value: string; onChange: (v: string) => void; resultCount: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <p className="text-muted-foreground text-sm">
        Showing <span className="text-foreground font-semibold">{resultCount}</span> item{resultCount === 1 ? "" : "s"}
      </p>

      <div className="relative w-full sm:w-64">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search the archive"
          className="w-full bg-background border border-border pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-200"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── GALLERY GRID ─────────────────────────────────────────────────────────────
function GalleryGrid({ onOpen }: { onOpen: (p: Photo) => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHOTOS;
    return PHOTOS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <section id="archive" className="bg-background container py-14">
      {/* <SearchBar value={query} onChange={setQuery} resultCount={filtered.length} /> */}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border">
          <p className="text-foreground font-heading font-semibold text-lg mb-1">Nothing matches &quot;{query}&quot;</p>
          <p className="text-muted-foreground text-sm">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[140px] sm:auto-rows-[160px] lg:auto-rows-[190px] gap-3 [grid-auto-flow:dense]">
          {filtered.map((photo, i) => (
            <GalleryCard key={photo.id} photo={photo} index={i} onClick={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── MODAL (spec-sheet viewer) ────────────────────────────────────────────────
function GalleryModal({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const [current, setCurrent] = useState<Photo | null>(null);

  useEffect(() => { setCurrent(photo); }, [photo]);

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
    setCurrent(PHOTOS[(idx + dir + PHOTOS.length) % PHOTOS.length]);
  };

  const currentIndex = current ? PHOTOS.findIndex((p) => p.id === current.id) : -1;

  return (
    <AnimatePresence>
      {photo && current && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 w-full max-w-5xl bg-background border border-border shadow-2xl md:flex md:h-[78vh]"
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image pane */}
            <div className="relative flex-1 bg-muted flex items-center justify-center overflow-hidden min-h-[45vh] md:min-h-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.src}
                  alt={current.name}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              <button
                onClick={() => navigate(-1)}
                aria-label="Previous"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => navigate(1)}
                aria-label="Next"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-colors duration-150"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M5 1L11 7L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Spec panel */}
            <div className="md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-border flex flex-col">
              <div className="p-5 border-b border-border">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-heading font-semibold text-foreground text-lg truncate">{current.name}</h2>
                  <span className="text-muted-foreground text-sm tabular-nums shrink-0">
                    {String(currentIndex + 1).padStart(2, "0")}/{String(PHOTOS.length).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Use ← → to browse, Esc to close</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 md:grid-cols-3 gap-2 content-start">
                {PHOTOS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrent(p)}
                    className={`relative aspect-square overflow-hidden border transition-colors duration-150 ${
                      p.id === current.id ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                    }`}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-foreground border border-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 9L7 3L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GalleryMain() {
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Photo | null>(null);

  return (
    <>
      <AnimatePresence>
        {!loaded && <AnimatedLoader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <motion.main
          className="bg-background min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <HeroSection />
          <MarqueeSection />
          <GalleryGrid onOpen={setModal} />
          <GalleryModal photo={modal} onClose={() => setModal(null)} />
          <BackToTop />
        </motion.main>
      )}
    </>
  );
}