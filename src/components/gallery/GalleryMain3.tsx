"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";

// ─── DATA ────────────────────────────────────────────────────────────────────
interface Photo { id: number; name: string; src: string; }

const PHOTOS: Photo[] = [
  { id: 1,  name: "bags",     src: "/assets/GalleryImage/bags.png"     },
  { id: 2,  name: "IMG_0357", src: "/assets/GalleryImage/IMG_0357.jpg" },
  { id: 3,  name: "IMG_0395", src: "/assets/GalleryImage/IMG_0395.jpg" },
  { id: 4,  name: "IMG_0450", src: "/assets/GalleryImage/IMG_0450.jpg" },
  { id: 5,  name: "IMG_0480", src: "/assets/GalleryImage/IMG_0480.jpg" },
  { id: 6,  name: "IMG_0493", src: "/assets/GalleryImage/IMG_0493.jpg" },
  { id: 7,  name: "IMG_0559", src: "/assets/GalleryImage/IMG_0559.jpg" },
  { id: 8,  name: "IMG_0596", src: "/assets/GalleryImage/IMG_0596.jpg" },
  { id: 9,  name: "IMG_0597", src: "/assets/GalleryImage/IMG_0597.jpg" },
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

// Repeating size pattern for masonry visual variety
const SIZE_PATTERN = ["large", "small", "small", "medium", "large", "small", "medium", "small", "small", "large"];
const withSize = PHOTOS.map((p, i) => ({ ...p, size: SIZE_PATTERN[i % SIZE_PATTERN.length] }));

// ─── LOADER ──────────────────────────────────────────────────────────────────
function AnimatedLoader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(onComplete, 300); return 100; }
        return p + 3;
      });
    }, 18);
    return () => clearInterval(iv);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
    >
      <motion.div
        className="mb-10 flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-11 h-11 bg-[#1a1a1a] flex items-center justify-center rounded-sm">
          <span className="text-[#F5C518] font-black text-xl leading-none">H</span>
        </div>
        <div>
          <div className="font-black text-[#1a1a1a] text-xl leading-tight tracking-tight">HASHTAG</div>
          <div className="font-black text-[#F5C518] text-xl leading-tight tracking-tight">BILLIONAIRE</div>
        </div>
      </motion.div>
      <div className="w-52 h-[2px] bg-gray-100 rounded-full overflow-hidden">
        <motion.div className="h-full bg-[#F5C518]" style={{ width: `${count}%` }} />
      </div>
      <p className="mt-3 text-gray-400 text-[11px] tracking-widest font-semibold tabular-nums">{count}%</p>
    </motion.div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section ref={ref} className="relative h-[80vh] min-h-[520px] flex flex-col items-center justify-center bg-[#f8f8f6] overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#e0e0e0 1px,transparent 1px),linear-gradient(90deg,#e0e0e0 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-[#F5C518] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div style={{ y: bgY }} className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-black text-[17vw] text-black/[0.04] leading-none whitespace-nowrap tracking-tight">GALLERY</span>
      </motion.div>

      <motion.div style={{ opacity: fadeOut }} className="relative z-10 text-center px-6">
        <motion.p
          className="text-[#F5C518] text-[11px] tracking-[0.55em] uppercase mb-5 font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Premium Merchandise —  Collection
        </motion.p>

        <h1 className="font-black text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[0.93] text-[#1a1a1a] tracking-tight">
          {["Creative", "Merchandise", "Gallery"].map((word, wi) => (
            <div key={wi} className="overflow-hidden block">
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.2 + wi * 0.1, duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
              >
                {wi === 1
                  ? <span>Merch<span className="text-[#F5C518]">andise</span></span>
                  : word}
              </motion.div>
            </div>
          ))}
        </h1>

        <motion.p
          className="mt-5 text-gray-400 text-sm max-w-xs mx-auto leading-relaxed font-medium"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          Crafted with precision. Worn with intention.
        </motion.p>

        <motion.div
          className="mt-7 inline-flex items-center gap-2 text-gray-400 text-[11px] tracking-widest uppercase font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <span>Scroll to explore</span>
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>↓</motion.span>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function MarqueeSection() {
  const items = ["Premium Merchandise", "Custom Caps", "Race Ready Bibs", "Branded Hoodies", "Team Uniforms", "Bespoke Bags", "Accessories"];
  const doubled = [...items, ...items];
  return (
    <div className="bg-[#1a1a1a] py-3.5 overflow-hidden border-y border-black/10">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-[11px] font-bold text-white/60 tracking-[0.25em] uppercase flex items-center gap-10">
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] inline-block flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── GALLERY CARD ─────────────────────────────────────────────────────────────
function GalleryCard({ photo, index, onClick }: { photo: Photo & { size: string }; index: number; onClick: (p: Photo) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hov, setHov] = useState(false);

  const heights: Record<string, string> = { large: "h-[460px]", medium: "h-[340px]", small: "h-[240px]" };

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden cursor-pointer rounded-sm bg-gray-100 ${heights[photo.size] || "h-[300px]"}`}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.4, 0, 0.2, 1] }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onClick={() => onClick(photo)}
      whileTap={{ scale: 0.99 }}
    >
      {/* Image */}
      <motion.img
        src={photo.src}
        alt={photo.name}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: hov ? 1.05 : 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ filter: hov ? "grayscale(0%)" : "grayscale(10%)", transition: "filter 0.4s ease" }}
      />

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* Yellow top accent on hover */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px] bg-[#F5C518] origin-left"
        animate={{ scaleX: hov ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Title + view */}
      <div className="absolute bottom-0 left-0 right-0 p-4 overflow-hidden">
        <motion.h3
          className="font-bold text-white text-base leading-tight tracking-tight"
          animate={{ y: hov ? 0 : 3, opacity: hov ? 1 : 0.8 }}
          transition={{ duration: 0.25 }}
        >
          {photo.name}
        </motion.h3>
        <motion.div
          className="flex items-center gap-1.5 mt-1"
          animate={{ opacity: hov ? 1 : 0, y: hov ? 0 : 5 }}
          transition={{ duration: 0.22 }}
        >
          <div className="w-3 h-[2px] bg-[#F5C518]" />
          <span className="text-white/70 text-[10px] tracking-widest uppercase font-semibold">View</span>
        </motion.div>
      </div>

      {/* ID watermark */}
      <div className="absolute top-3 right-3 text-white/20 font-black text-xs tabular-nums">
        {String(photo.id).padStart(2, "0")}
      </div>
    </motion.div>
  );
}

// ─── GALLERY GRID ─────────────────────────────────────────────────────────────
function GalleryGrid({ onOpen }: { onOpen: (p: Photo) => void }) {
  return (
    <section className="bg-white px-4 md:px-10 pb-20">
      {/* Count */}
      <p className="text-center text-gray-400 text-xs tracking-widest uppercase font-semibold pt-10 mb-8">
        Showing <span className="text-[#1a1a1a] font-black">{PHOTOS.length}</span> items
      </p>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
        {withSize.map((photo, i) => (
          <div key={photo.id} className="break-inside-avoid mb-3">
            <GalleryCard photo={photo} index={i} onClick={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function GalleryModal({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const [current, setCurrent] = useState<Photo | null>(null);

  useEffect(() => { setCurrent(photo); }, [photo]);

  useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  const navigate = (dir: number) => {
    if (!current) return;
    const idx = PHOTOS.findIndex(p => p.id === current.id);
    setCurrent(PHOTOS[(idx + dir + PHOTOS.length) % PHOTOS.length]);
  };

  return (
    <AnimatePresence>
      {photo && current && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 max-w-3xl w-full bg-white rounded-sm overflow-hidden shadow-2xl"
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Yellow bar */}
            <div className="h-1 bg-[#F5C518]" />

            {/* Image */}
            <div className="relative bg-gray-50">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.src}
                  alt={current.name}
                  className="w-full object-contain max-h-[62vh]"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-sm flex items-center justify-center text-[#1a1a1a] hover:bg-[#F5C518] transition-colors duration-150 shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              {/* Prev */}
              <button
                onClick={() => navigate(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-sm flex items-center justify-center hover:bg-[#F5C518] transition-colors duration-150 shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Next */}
              <button
                onClick={() => navigate(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-sm flex items-center justify-center hover:bg-[#F5C518] transition-colors duration-150 shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M5 1L11 7L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Info bar */}
            <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100">
              <h2 className="font-black text-[#1a1a1a] text-lg tracking-tight">{current.name}</h2>
              <span className="text-gray-200 font-black text-4xl leading-none select-none tabular-nums">
                {String(current.id).padStart(2, "0")}
              </span>
            </div>

            {/* Keyboard hint */}
            <div className="px-5 pb-3 flex items-center gap-1 text-gray-300 text-[10px] font-medium">
              <span>← → arrow keys to navigate</span>
              <span className="mx-1">·</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#1a1a1a] px-8 py-12 md:px-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#F5C518] flex items-center justify-center rounded-sm">
              <span className="text-[#1a1a1a] font-black text-lg leading-none">H</span>
            </div>
            <div>
              <div className="font-black text-white text-lg leading-tight tracking-tight">HASHTAG</div>
              <div className="font-black text-[#F5C518] text-lg leading-tight tracking-tight">BILLIONAIRE</div>
            </div>
          </div>
          <p className="text-white/30 text-xs tracking-widest font-semibold">Premium Merchandise & Apparel</p>
        </div>
        <div className="flex gap-6 text-white/40 text-xs tracking-widest uppercase font-bold">
          {["Instagram", "Behance", "LinkedIn"].map(s => (
            <a key={s} href="#" className="hover:text-[#F5C518] transition-colors duration-200">{s}</a>
          ))}
        </div>
        <p className="text-white/20 text-[11px] tracking-widest font-semibold">© 2024 Hashtag Billionaire</p>
      </div>
    </footer>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GalleryMain2() {
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<Photo | null>(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #F5C518; border-radius: 2px; }
        html { scroll-behavior: smooth; }
        body { background: #f8f8f6; margin: 0; padding: 0; }
      `}</style>

      <AnimatePresence>
        {!loaded && <AnimatedLoader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <motion.main
          className="bg-[#f8f8f6] min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <HeroSection />
          <MarqueeSection />
          <GalleryGrid onOpen={setModal} />
          {/* <Footer /> */}
          <GalleryModal photo={modal} onClose={() => setModal(null)} />
        </motion.main>
      )}
    </>
  );
}