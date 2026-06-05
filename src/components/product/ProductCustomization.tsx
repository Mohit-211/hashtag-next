"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Upload,
  RotateCw,
  RotateCcw,
  X,
  Download,
  Sparkles,
  Eye,
  ImageDown,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Type,
  Image as ImageIcon,
  Trash2,
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronUp,
  Table2,
  Check,
  Circle,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import AddToCartModal from "@/components/common/AddToCartModal";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Props {
  productId: number;
  variantId: number;
  price: number;
  name: string;
  productImage?: string | null;
  is_in_cart?: boolean;
  is_in_wishlist?: boolean;
  wishlist_id?: number | null;
  onReload?: () => void;
  initialQuantity?: number;
}

const CANVAS_SIZE = 500;

const PRINT_LOCATIONS = [
  { id: "left-chest", label: "Left Chest", icon: "◧", category: "embroidery", pricingKey: "left_chest" },
  { id: "right-chest", label: "Right Chest", icon: "◨", category: "embroidery", pricingKey: "right_chest" },
  { id: "sleeve", label: "Sleeve", icon: "▷", category: "embroidery", pricingKey: "sleeve" },
  { id: "hat-front", label: "Hat Front", icon: "🧢", category: "embroidery", pricingKey: "hat_front" },
  { id: "hat-side", label: "Hat Side", icon: "◧", category: "embroidery", pricingKey: "hat_side" },
  { id: "hat-back", label: "Hat Back (Arch)", icon: "◨", category: "embroidery", pricingKey: "hat_back_arch" },
  { id: "full-back-standard", label: "Full Back (Standard)", icon: "⬛", category: "embroidery", pricingKey: "full_back_standard" },
  { id: "full-back-large", label: "Full Back (Large)", icon: "⬛", category: "embroidery", pricingKey: "full_back_large" },
  { id: "oversized", label: "Oversized Back", icon: "⬛", category: "embroidery", pricingKey: "oversized_back", quoteOnly: true },
  { id: "front-regular", label: "Front Regular", icon: "⬛", category: "dtg", pricingKey: "front_regular" },
  { id: "oversized-front", label: "Oversized Front", icon: "⬛", category: "dtg", pricingKey: "oversized_front" },
  { id: "front-back-regular", label: "Front & Back Regular", icon: "⬛", category: "dtg", pricingKey: "front_back_regular" },
  { id: "front-back-oversized", label: "Front & Back Oversized", icon: "⬛", category: "dtg", pricingKey: "front_back_oversized" },
];

type MaterialId = "embroidery" | "dtf" | "screenprint" | "dtg";

interface Material {
  id: MaterialId;
  label: string;
  boldDesc: string;
  bestFor: string;
  minLabel: string;
  badge: string;
  iconUrl: string;
}

const MATERIALS: Material[] = [
  {
    id: "embroidery",
    label: "Embroidery",
    boldDesc: "Premium, durable, thread-stitched branding.",
    bestFor: "Polos, jackets, uniforms",
    minLabel: "No minimums",
    badge: "All Fabrics",
    iconUrl: "/icons/embroidery.png",
  },
  {
    id: "dtf",
    label: "DTF Print",
    boldDesc: "Full-color Direct-to-Film transfers.",
    bestFor: "Small runs, multi-color logos",
    minLabel: "No minimums",
    badge: "No Minimum",
    iconUrl: "/icons/dtf.png",
  },
  {
    id: "screenprint",
    label: "Screen Print",
    boldDesc: "Bold, solid colors for bulk orders.",
    bestFor: "Tees, hoodies, bulk orders",
    minLabel: "50 pcs",
    badge: "Min 50 pcs",
    iconUrl: "/icons/screenprint.png",
  },
  {
    id: "dtg",
    label: "DTG Print",
    boldDesc: "Photo-quality prints on cotton garments.",
    bestFor: "100% cotton tees",
    minLabel: "No minimums",
    badge: "Cotton Only",
    iconUrl: "/icons/dtg.png",
  },
];

const MATERIAL_EMOJIS: Record<MaterialId, string> = {
  embroidery: "🧵", dtf: "🖨️", screenprint: "🎨", dtg: "👕",
};

const EMB_TIERS = [
  { label: "1–11", min: 1, max: 11 },
  { label: "12–23", min: 12, max: 23 },
  { label: "24–35", min: 24, max: 35 },
  { label: "36–71", min: 36, max: 71 },
  { label: "72–95", min: 72, max: 95 },
  { label: "96–143", min: 96, max: 143 },
  { label: "144+", min: 144, max: Infinity },
];

const EMB_ROWS: { label: string; key: string; prices: (number | "quote")[] }[] = [
  { label: "Left Chest", key: "left-chest", prices: [12, 11, 10, 9, 8, 7, 6] },
  { label: "Right Chest", key: "right-chest", prices: [12, 11, 10, 9, 8, 7, 6] },
  { label: "Sleeve", key: "sleeve-left", prices: [12, 11, 10, 9, 8, 7, 6] },
  { label: "Hat Front", key: "hat-front", prices: [15, 14, 12, 11, 10, 9, 8] },
  { label: "Hat Side", key: "hat-side", prices: [10, 9, 8, 7, 6, 5, 5] },
  { label: "Hat Back (Arch)", key: "hat-back", prices: [10, 9, 8, 7, 6, 5, 5] },
  { label: "Full Back (Std)", key: "full-back-standard", prices: [18, 16, 14, 13, 12, 11, 10] },
  { label: "Full Back (Large)", key: "full-back-large", prices: [22, 20, 18, 16, 15, 14, 12] },
  { label: "Oversized Back", key: "oversized", prices: ["quote", "quote", "quote", "quote", "quote", "quote", "quote"] },
];

const EMB_PRICES: Record<string, number[]> = {
  "left-chest": [12, 11, 10, 9, 8, 7, 6],
  "right-chest": [12, 11, 10, 9, 8, 7, 6],
  "sleeve-left": [12, 11, 10, 9, 8, 7, 6],
  "sleeve-right": [12, 11, 10, 9, 8, 7, 6],
  "hat-front": [15, 14, 12, 11, 10, 9, 8],
  "hat-side": [10, 9, 8, 7, 6, 5, 5],
  "hat-back": [10, 9, 8, 7, 6, 5, 5],
  "full-back-standard": [18, 16, 14, 13, 12, 11, 10],
  "full-back-large": [22, 20, 18, 16, 15, 14, 12],
  "oversized": [0, 0, 0, 0, 0, 0, 0],
};

/* ─── FIX: DTF tiers use reduce() so 144+ always resolves correctly ── */
const DTF_TIER_LABELS = ["1–11", "12–23", "24–35", "36–71", "72–95", "96–143", "144+"];
const DTF_TIERS       = [1,       12,      24,      36,      72,      96,       144];
const DTF_PRICES      = [15,      12,      10,      9,       7,       5,        5];

const SP_TIERS = [{ label: "50–99", min: 50 }, { label: "100+", min: 100 }];
const SP_PRICES: Record<string, number[]> = {
  "1 Color": [6.58, 4.40],
  "2 Color": [9.43, 7.98],
  "3 Color": [11.55, 9.54],
};

const DTG_TIERS = [
  { label: "1–23", min: 1 },
  { label: "24–47", min: 24 },
  { label: "48–99", min: 48 },
  { label: "100+", min: 100 },
];
const DTG_PRICES: Record<string, number[]> = {
  "Front Regular": [15, 12, 11, 9],
  "Oversized": [20, 17, 16, 14],
  "Front & Back Regular": [30, 24, 22, 18],
  "Front & Back Oversized": [40, 34, 32, 28],
};

const FONTS = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const PRESET_COLORS = [
  "#1a1a1a", "#ffffff", "#F5C400", "#e05555",
  "#2d7dd2", "#f5a623", "#9b59b6", "#1abc9c",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const toBase64ViaSameOrigin = async (url: string): Promise<string> => {
  try {
    const proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxied);
    if (!response.ok) throw new Error("Proxy failed");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error(err);
    return url;
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/* ─── Draw Function ──────────────────────────────────────────────────────── */
interface DrawParams {
  ctx: CanvasRenderingContext2D;
  size: number;
  productImg: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  logoPos: { x: number; y: number };
  logoSize: number;
  logoRotation: number;
  logoOpacity: number;
  text: string;
  textPos: { x: number; y: number };
  textSize: number;
  textColor: string;
  textRotation: number;
  fontFamily: string;
  textBold: boolean;
  textItalic: boolean;
  textShadow: boolean;
  textOpacity: number;
}

function drawAll({ ctx, size, productImg, logo, logoPos, logoSize, logoRotation, logoOpacity, text, textPos, textSize, textColor, textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity }: DrawParams) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  if (productImg) {
    const scale = Math.min(size / productImg.naturalWidth, size / productImg.naturalHeight);
    const drawW = productImg.naturalWidth * scale;
    const drawH = productImg.naturalHeight * scale;
    ctx.drawImage(productImg, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  }
  if (logo) {
    ctx.save();
    ctx.globalAlpha = logoOpacity;
    const cx = logoPos.x + logoSize / 2;
    const cy = logoPos.y + logoSize / 2;
    ctx.translate(cx, cy);
    ctx.rotate((logoRotation * Math.PI) / 180);
    ctx.drawImage(logo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    ctx.restore();
  }
  if (text.trim()) {
    ctx.save();
    ctx.globalAlpha = textOpacity;
    const weight = textBold ? "bold" : "normal";
    const style = textItalic ? "italic" : "normal";
    ctx.font = `${style} ${weight} ${textSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    if (textShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = textSize;
    ctx.translate(textPos.x + tw / 2, textPos.y - th / 2);
    ctx.rotate((textRotation * Math.PI) / 180);
    ctx.fillText(text, -tw / 2, th / 2);
    ctx.restore();
  }
}

/* ─── Slider ─────────────────────────────────────────────────────────────── */
function Slider({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs font-bold text-[#F5C400] tabular-nums bg-[#F5C400]/10 px-2 py-0.5 rounded-md">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-[#F5C400] cursor-pointer"
        style={{ accentColor: "#F5C400" }}
      />
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────── */
function SectionHeader({ step, title, subtitle, status }: {
  step: number; title: string; subtitle: string;
  status: "required" | "done" | "optional";
  doneLabel?: string;
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all",
        status === "done" ? "bg-[#F5C400] text-black" : "bg-gray-900 text-white"
      )}>
        {status === "done" ? <Check size={14} /> : step}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {status === "required" && (
        <span className="flex-shrink-0 text-[11px] font-bold text-[#e05555] bg-[#e05555]/8 border border-[#e05555]/25 px-2.5 py-1 rounded-full">
          Required
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRICING TABLE COMPONENTS
══════════════════════════════════════════════════════════════════════════ */
function EmbroideryPricingTable({ activeLocations }: { activeLocations: string[] }) {
  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Table2 size={13} className="text-[#F5C400]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Embroidery — Price per Location</p>
        <span className="ml-auto text-[10px] text-gray-400">+$35 digitizing fee (1–11 pcs)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-36">Location</th>
              {EMB_TIERS.map((t) => (
                <th key={t.label} className="px-2 py-2 font-bold text-gray-500 border-r border-gray-100 text-center whitespace-nowrap">{t.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMB_ROWS.map((row, i) => {
              const isActive = activeLocations.includes(row.key) || (activeLocations.includes("sleeve-right") && row.key === "sleeve-left");
              return (
                <tr key={row.key} className={cn("border-b border-gray-100 transition-colors", isActive ? "bg-[#F5C400]/8" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className={cn("px-3 py-2 font-semibold border-r border-gray-200 flex items-center gap-1.5", isActive ? "text-[#b89000]" : "text-gray-600")}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] flex-shrink-0" />}
                    {row.label}
                  </td>
                  {row.prices.map((p, j) => (
                    <td key={j} className={cn("px-2 py-2 text-center border-r border-gray-100 font-medium", p === "quote" ? "text-[#e05555] text-[10px]" : isActive ? "text-[#b89000] font-bold" : "text-gray-500")}>
                      {p === "quote" ? "Quote" : `$${p}`}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">Each location priced separately · Oversized Back requires a custom quote</p>
      </div>
    </div>
  );
}

/* ─── FIX: DTFPricingTable — removed bogus "More/Inquiry" column,
         activeTier now uses reduce() so 144+ always highlights correctly ── */
function DTFPricingTable({ qty }: { qty: number }) {
  const activeTier = DTF_TIERS.reduce((found, t, i) => (qty >= t ? i : found), 0);

  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Table2 size={13} className="text-[#F5C400]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">DTF Print Pricing</p>
        <span className="ml-auto text-[10px] text-gray-400">No minimum order</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[480px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-20">Method</th>
              {DTF_TIER_LABELS.map((lbl, i) => (
                <th key={lbl} className={cn(
                  "px-2 py-2 font-bold border-r border-gray-100 text-center whitespace-nowrap",
                  activeTier === i ? "text-[#b89000] bg-[#F5C400]/8" : "text-gray-500"
                )}>
                  {activeTier === i && (
                    <span className="block w-1 h-1 rounded-full bg-[#F5C400] mx-auto mb-0.5" />
                  )}
                  {lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 font-bold text-[#b89000] border-r border-gray-200">DTF</td>
              {DTF_PRICES.map((p, i) => (
                <td key={i} className={cn(
                  "px-2 py-3 text-center border-r border-gray-100 font-medium",
                  activeTier === i
                    ? "text-[#b89000] font-bold text-sm bg-[#F5C400]/5"
                    : "text-gray-500"
                )}>
                  ${p}.00
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">
          Prices per piece · Your current quantity ({qty}) is highlighted ·{" "}
          <span className="font-semibold text-[#b89000]">
            ${DTF_PRICES[activeTier]}.00/pc
          </span>
        </p>
      </div>
    </div>
  );
}

function ScreenPrintPricingTable({ qty, activeColor }: { qty: number; activeColor: string }) {
  const activeTier = qty >= 100 ? 1 : qty >= 50 ? 0 : -1;
  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Table2 size={13} className="text-[#F5C400]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Screen Print Pricing</p>
        <span className="ml-auto text-[10px] text-gray-400">50 piece minimum</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[360px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-28">Colors</th>
              {SP_TIERS.map((t, i) => (
                <th key={t.label} className={cn("px-3 py-2 font-bold border-r border-gray-100 text-center", activeTier === i ? "text-[#b89000] bg-[#F5C400]/8" : "text-gray-500")}>
                  {activeTier === i && <span className="block w-1 h-1 rounded-full bg-[#F5C400] mx-auto mb-0.5" />}
                  {t.label}
                </th>
              ))}
              <th className="px-3 py-2 font-bold text-gray-400 text-center">More</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SP_PRICES).map(([colorKey, prices], i) => {
              const isActiveColor = activeColor === colorKey;
              return (
                <tr key={colorKey} className={cn("border-b border-gray-100", isActiveColor ? "bg-[#F5C400]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className={cn("px-3 py-2.5 font-semibold border-r border-gray-200", isActiveColor ? "text-[#b89000]" : "text-gray-600")}>
                    {isActiveColor && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F5C400] mr-1.5 mb-0.5" />}
                    {colorKey}
                  </td>
                  {prices.map((p, j) => (
                    <td key={j} className={cn("px-3 py-2.5 text-center border-r border-gray-100 font-medium", activeTier === j && isActiveColor ? "text-[#b89000] font-bold text-sm" : "text-gray-500")}>${p.toFixed(2)}</td>
                  ))}
                  <td className="px-3 py-2.5 text-center text-[#e05555] text-[10px] font-semibold">Inquiry</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">
          Prices per piece · Min 50 pcs · {qty < 50 ? `You need ${50 - qty} more pieces to qualify` : `Your qty (${qty}) qualifies`}
        </p>
      </div>
    </div>
  );
}

function DTGPricingTable({ qty, activeStyle }: { qty: number; activeStyle: string }) {
  const activeTier = DTG_TIERS.reduce(
    (found, t, i) => (qty >= t.min ? i : found),
    0
  );
  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Table2 size={13} className="text-[#F5C400]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700">DTG Print Pricing</p>
        <span className="ml-auto text-[10px] text-gray-400">100% cotton only</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[420px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-40">Print Area</th>
              {DTG_TIERS.map((t, i) => (
                <th key={t.label} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center", activeTier === i ? "text-[#b89000] bg-[#F5C400]/8" : "text-gray-500")}>
                  {activeTier === i && <span className="block w-1 h-1 rounded-full bg-[#F5C400] mx-auto mb-0.5" />}
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DTG_PRICES).map(([styleKey, prices], i) => {
              const isActive = activeStyle === styleKey;
              return (
                <tr key={styleKey} className={cn("border-b border-gray-100", isActive ? "bg-[#F5C400]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                  <td className={cn("px-3 py-2.5 font-semibold border-r border-gray-200", isActive ? "text-[#b89000]" : "text-gray-600")}>
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F5C400] mr-1.5 mb-0.5" />}
                    {styleKey}
                  </td>
                  {prices.map((p, j) => (
                    <td key={j} className={cn("px-2 py-2.5 text-center border-r border-gray-100 font-medium", activeTier === j && isActive ? "text-[#b89000] font-bold text-sm" : "text-gray-500")}>${p}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">Prices per piece · Your current quantity ({qty}) is highlighted</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ProductCustomization({
  productId, variantId, price, name, productImage, is_in_cart = false, onReload,
}: Props) {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!localStorage.getItem("hastagBillionaire");
  const requireLogin = () => { if (!isLoggedIn) { setShowLoginModal(true); return true; } return false; };

  const { refreshCart } = useCart();
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const wishlistItem = wishlist.find((item) => item.product_id === productId && item.variant_id === variantId);
  const inWishlist = !!wishlistItem;
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlist = async () => {
    if (requireLogin()) return;
    try {
      setWishlistLoading(true);
      if (inWishlist && wishlistItem) { await removeItem(wishlistItem.id); }
      else { await addToWishlist({ product_id: productId, variant_id: variantId, name, price, image: productImage || "" }); }
      await fetchWishlist();
      onReload?.();
    } catch (err) { console.error("Wishlist error:", err); }
    finally { setWishlistLoading(false); }
  };

  const [inCart, setInCart] = useState(is_in_cart);
  const [showCartModal, setShowCartModal] = useState(false);
  const [canvasBlob, setCanvasBlob] = useState<Blob | null>(null);
  const [customizationJson, setCustomizationJson] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showValidationShake, setShowValidationShake] = useState(false);

  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const toggleLocation = (id: string) =>
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId | null>(null);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [spColorCount, setSpColorCount] = useState<"1 Color" | "2 Color" | "3 Color">("1 Color");
  const [dtgStyle, setDtgStyle] = useState<keyof typeof DTG_PRICES>("Front Regular");

  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(120);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [logoPos, setLogoPos] = useState({ x: 190, y: 190 });

  const [customText, setCustomText] = useState("");
  const [textSize, setTextSize] = useState(36);
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [textRotation, setTextRotation] = useState(0);
  const [fontFamily, setFontFamily] = useState("Georgia, serif");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textShadow, setTextShadow] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [textPos, setTextPos] = useState({ x: 80, y: 300 });

  const [dragging, setDragging] = useState<"logo" | "text" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const decreaseQuantity = () => setQuantity((p) => Math.max(1, p - 1));
  const increaseQuantity = () => setQuantity((p) => p + 1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getMissingRequirements = useCallback(() => {
    const missing: string[] = [];
    if (selectedLocations.length === 0) missing.push("a print location");
    if (!selectedMaterial) missing.push("a print method");
    if (quantity < 1) missing.push("a valid quantity");
    return missing;
  }, [selectedLocations, selectedMaterial, quantity]);

  const REQUIREMENTS = [
    { key: "loc", label: "Print location", done: selectedLocations.length > 0 },
    { key: "mat", label: "Print method", done: !!selectedMaterial },
    { key: "qty", label: "Quantity", done: quantity >= 1 },
  ];

  useEffect(() => {
    if (!productImage) return;
    let cancelled = false;
    (async () => {
      try {
        const base64 = await toBase64ViaSameOrigin(productImage);
        if (cancelled) return;
        const img = await loadImage(base64);
        if (!cancelled) setProductImg(img);
      } catch (err) { console.error(err); }
    })();
    return () => { cancelled = true; };
  }, [productImage]);

  useEffect(() => {
    if (!logoSrc) { setLogoImg(null); return; }
    let cancelled = false;
    loadImage(logoSrc).then((img) => { if (!cancelled) setLogoImg(img); });
    return () => { cancelled = true; };
  }, [logoSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAll({ ctx, size: CANVAS_SIZE, productImg, logo: logoImg, logoPos, logoSize, logoRotation, logoOpacity, text: customText, textPos, textSize, textColor, textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity });
  }, [productImg, logoImg, logoPos, logoSize, logoRotation, logoOpacity, customText, textPos, textSize, textColor, textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (requireLogin()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoSrc(reader.result as string);
      setLogoPos({ x: 190, y: 190 });
      setLogoRotation(0);
      setLogoSize(120);
    };
    reader.readAsDataURL(file);
  };

  const getCanvasPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_SIZE / rect.height),
    };
  };

  const isOverLogo = (pt: { x: number; y: number }) =>
    !!(logoImg && pt.x >= logoPos.x && pt.x <= logoPos.x + logoSize && pt.y >= logoPos.y && pt.y <= logoPos.y + logoSize);

  const isOverText = (pt: { x: number; y: number }) => {
    if (!customText.trim()) return false;
    return pt.x >= textPos.x && pt.x <= textPos.x + textSize * customText.length * 0.65 && pt.y >= textPos.y - textSize && pt.y <= textPos.y + 8;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);
    if (isOverLogo(pt)) { setDragging("logo"); setDragOffset({ x: pt.x - logoPos.x, y: pt.y - logoPos.y }); }
    else if (isOverText(pt)) { setDragging("text"); setDragOffset({ x: pt.x - textPos.x, y: pt.y - textPos.y }); }
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getCanvasPoint(e);
    if (dragging === "logo") {
      setLogoPos({
        x: Math.max(0, Math.min(CANVAS_SIZE - logoSize, pt.x - dragOffset.x)),
        y: Math.max(0, Math.min(CANVAS_SIZE - logoSize, pt.y - dragOffset.y)),
      });
    } else if (dragging === "text") {
      setTextPos({
        x: Math.max(0, Math.min(CANVAS_SIZE - 40, pt.x - dragOffset.x)),
        y: Math.max(textSize, Math.min(CANVAS_SIZE, pt.y - dragOffset.y)),
      });
    }
  }, [dragging, dragOffset, logoSize, textSize]);

  const stopDrag = () => setDragging(null);

  const handleOpenPreview = () => {
    if (requireLogin()) return;
    setPreviewError(false);
    setShowPreviewModal(true);
    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = CANVAS_SIZE * 2;
      offscreen.height = CANVAS_SIZE * 2;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      drawAll({ ctx, size: CANVAS_SIZE, productImg, logo: logoImg, logoPos, logoSize, logoRotation, logoOpacity, text: customText, textPos, textSize, textColor, textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity });
      setPreviewDataUrl(offscreen.toDataURL("image/png", 1));
    } catch (err) { console.error(err); setPreviewError(true); }
  };

  const handleConfirmDownload = () => {
    if (!previewDataUrl) return;
    const link = document.createElement("a");
    link.href = previewDataUrl;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-customized.png`;
    link.click();
    setShowPreviewModal(false);
  };

  const getCursor = () => {
    if (dragging) return "grabbing";
    if (logoImg || customText.trim()) return "grab";
    return "default";
  };

  /* ─── FIX: getPrintPrice uses reduce() for DTF so tier is always correct ── */
  const getPrintPrice = (): number | null => {
    if (!selectedMaterial) return null;

    if (selectedMaterial === "embroidery") {
      if (selectedLocations.length === 0 || selectedLocations.includes("oversized")) return null;
      const tierIdx = EMB_TIERS.findIndex((t) => quantity >= t.min && quantity <= t.max);
      let total = 0;
      for (const locId of selectedLocations) {
        const row = EMB_PRICES[locId];
        if (!row) return null;
        total += (tierIdx >= 0 ? row[tierIdx] : row[row.length - 1]) * quantity;
      }
      return total + (quantity <= 11 ? 35 : 0);
    }

    if (selectedMaterial === "dtf") {
      if (selectedLocations.length === 0) return null;
      /* FIX: reduce guarantees a valid index even for qty >= 144 */
      const tierIdx = DTF_TIERS.reduce((found, t, i) => (quantity >= t ? i : found), 0);
      return DTF_PRICES[tierIdx] * quantity * selectedLocations.length;
    }

    if (selectedMaterial === "screenprint") {
      if (quantity < 50 || selectedLocations.length === 0) return null;
      return SP_PRICES[spColorCount][quantity >= 100 ? 1 : 0] * quantity * selectedLocations.length;
    }

    if (selectedMaterial === "dtg") {
      if (selectedLocations.length === 0) return null;
      /* FIX: reduce for consistency */
      const tierIdx = DTG_TIERS.reduce((found, t, i) => (quantity >= t.min ? i : found), 0);
      return DTG_PRICES[dtgStyle][tierIdx] * quantity * selectedLocations.length;
    }

    return null;
  };

  const printPrice = getPrintPrice();

  const getCanvasBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });

  const buildCustomizationPayload = (): string => {
    const payload: Record<string, unknown> = {
      print_method: selectedMaterial?.toUpperCase() ?? null,
      locations: selectedLocations.map((id) => ({ location: id })),
    };
    if (selectedMaterial === "screenprint") payload.color_count = spColorCount;
    if (selectedMaterial === "dtg") payload.print_area = dtgStyle;
    if (customText.trim()) payload.custom_text = customText.trim();
    return JSON.stringify(payload);
  };

  const handleAddToCart = async () => {
    if (requireLogin()) return;
    const missing = getMissingRequirements();
    if (missing.length > 0) {
      setValidationError(`Please select ${missing.join(", ")} before adding to cart.`);
      setShowValidationShake(true);
      setTimeout(() => setShowValidationShake(false), 600);
      return;
    }
    setValidationError(null);
    const blob = await getCanvasBlob();
    const json = buildCustomizationPayload();
    setCanvasBlob(blob);
    setCustomizationJson(json);
    setShowCartModal(true);
  };

  useEffect(() => {
    if (validationError && getMissingRequirements().length === 0) setValidationError(null);
  }, [selectedLocations, selectedMaterial, quantity, validationError, getMissingRequirements]);

  const handleSelectMaterial = (id: MaterialId) => {
    setSelectedMaterial(id);
    setShowPriceTable(true);
  };

  const allRequirementsMet = selectedLocations.length > 0 && !!selectedMaterial && quantity >= 1;

  const QTY_PRESETS = [
    { q: 1, hint: "Sample" },
    { q: 12, hint: "−8%" },
    { q: 24, hint: "−17%" },
    { q: 36, hint: "−25%" },
    { q: 50, hint: "SP min", accent: true },
    { q: 72, hint: "−42%" },
    { q: 100, hint: "Best" },
    { q: 144, hint: "Bulk" },
  ];

  const nextTierMsg = () => {
    if (selectedMaterial === "screenprint" && quantity < 50)
      return `Screen print needs at least 50 pieces — ${50 - quantity} more to qualify.`;
    if (quantity >= 144) return "Bulk rate unlocked — best price per piece.";
    const milestones = [12, 24, 36, 50, 72, 100, 144];
    for (const m of milestones) {
      if (quantity < m) return `${m - quantity} more pieces unlocks the ${m}-pc tier.`;
    }
    return "Maximum tier reached.";
  };

  return (
    <>
      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
                <X size={15} />
              </button>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">Login to customize products, save to wishlist, and add to cart.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => router.push("/login")} className="flex-1 h-11 rounded-xl bg-[#F5C400] text-black text-sm font-black hover:bg-[#e6b800] transition-colors">Sign In</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5C400] flex items-center justify-center">
                  <Eye size={15} className="text-black" />
                </div>
                <h3 className="font-black text-gray-900">Preview Design</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                <X size={15} />
              </button>
            </div>
            <div className="p-5">
              <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 overflow-hidden relative">
                {previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-500">
                    <AlertCircle size={40} />
                    <p className="text-sm">Failed to generate preview</p>
                  </div>
                ) : previewDataUrl ? (
                  <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#F5C400]" size={32} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowPreviewModal(false)} className="flex-1 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold text-gray-600 transition-colors">Cancel</button>
              <button onClick={handleConfirmDownload} disabled={!previewDataUrl}
                className={cn("flex-1 h-12 rounded-xl font-black flex items-center justify-center gap-2 transition-all",
                  previewDataUrl ? "bg-[#F5C400] text-black hover:bg-[#e6b800]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}>
                <ImageDown size={17} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           SECTION 1 — PRINT LOCATION
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
        <SectionHeader
          step={1}
          title="Choose Print Location"
          subtitle="Where should we print on the garment? Tap to select multiple."
          status={selectedLocations.length > 0 ? "done" : "required"}
        />
        <div className="p-5">
          {/* T-shirt SVG diagram */}
          <div className="relative mx-auto mb-4" style={{ maxWidth: 300 }}>
            <svg viewBox="0 0 320 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-sm">
              <path d="M100 40 L60 80 L20 70 L10 130 L60 140 L60 320 L260 320 L260 140 L310 130 L300 70 L260 80 L220 40 Q180 65 160 65 Q140 65 100 40Z" fill="#f8f8f8" stroke="#e5e5e5" strokeWidth="1.5" />
              <path d="M100 40 Q130 80 160 82 Q190 80 220 40" fill="#f0f0f0" stroke="#ddd" strokeWidth="1" />
              {/* LEFT CHEST */}
              <circle cx="115" cy="145" r="24" onClick={() => toggleLocation("left-chest")} className="cursor-pointer transition-all duration-150"
                fill={selectedLocations.includes("left-chest") ? "#F5C400" : "#efefef"}
                stroke={selectedLocations.includes("left-chest") ? "#d4a800" : "#d5d5d5"} strokeWidth="1.5" />
              {selectedLocations.includes("left-chest") && <circle cx="115" cy="145" r="10" fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray="2 2" />}
              <text x="115" y="141" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("left-chest") ? "#000" : "#999"} fontWeight="700">Left</text>
              <text x="115" y="152" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("left-chest") ? "#000" : "#999"} fontWeight="700">Chest</text>
              {/* RIGHT CHEST */}
              <circle cx="205" cy="145" r="24" onClick={() => toggleLocation("right-chest")} className="cursor-pointer transition-all duration-150"
                fill={selectedLocations.includes("right-chest") ? "#F5C400" : "#efefef"}
                stroke={selectedLocations.includes("right-chest") ? "#d4a800" : "#d5d5d5"} strokeWidth="1.5" />
              {selectedLocations.includes("right-chest") && <circle cx="205" cy="145" r="10" fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray="2 2" />}
              <text x="205" y="141" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("right-chest") ? "#000" : "#999"} fontWeight="700">Right</text>
              <text x="205" y="152" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("right-chest") ? "#000" : "#999"} fontWeight="700">Chest</text>
              {/* FULL FRONT */}
              <rect x="122" y="178" width="76" height="58" rx="12" onClick={() => toggleLocation("full-front")} className="cursor-pointer transition-all duration-150"
                fill={selectedLocations.includes("full-front") ? "#F5C400" : "#efefef"}
                stroke={selectedLocations.includes("full-front") ? "#d4a800" : "#d5d5d5"} strokeWidth="1.5" />
              <text x="160" y="203" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("full-front") ? "#000" : "#999"} fontWeight="700">Full</text>
              <text x="160" y="215" textAnchor="middle" fontSize="8.5" fill={selectedLocations.includes("full-front") ? "#000" : "#999"} fontWeight="700">Front</text>
              {/* LEFT SLEEVE */}
              <ellipse cx="42" cy="110" rx="22" ry="28" onClick={() => toggleLocation("sleeve-left")} className="cursor-pointer transition-all duration-150"
                fill={selectedLocations.includes("sleeve-left") ? "#F5C400" : "#efefef"}
                stroke={selectedLocations.includes("sleeve-left") ? "#d4a800" : "#d5d5d5"} strokeWidth="1.5" />
              <text x="42" y="106" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-left") ? "#000" : "#999"} fontWeight="700">Left</text>
              <text x="42" y="117" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-left") ? "#000" : "#999"} fontWeight="700">Sleeve</text>
              {/* RIGHT SLEEVE */}
              <ellipse cx="278" cy="110" rx="22" ry="28" onClick={() => toggleLocation("sleeve-right")} className="cursor-pointer transition-all duration-150"
                fill={selectedLocations.includes("sleeve-right") ? "#F5C400" : "#efefef"}
                stroke={selectedLocations.includes("sleeve-right") ? "#d4a800" : "#d5d5d5"} strokeWidth="1.5" />
              <text x="278" y="106" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-right") ? "#000" : "#999"} fontWeight="700">Right</text>
              <text x="278" y="117" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-right") ? "#000" : "#999"} fontWeight="700">Sleeve</text>
            </svg>
            <p className="text-center text-[11px] text-gray-400 mt-2">Tap directly on the garment to select a location</p>
          </div>

          {/* Additional location buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {[
              { id: "full-back-standard", label: "Full Back (Standard)" },
              { id: "full-back-large", label: "Full Back (Large)" },
              { id: "oversized", label: "Oversized Back" },
              { id: "hat-front", label: "Hat Front" },
              { id: "hat-side", label: "Hat Side" },
              { id: "hat-back", label: "Hat Back (Arch)" },
            ].map((loc) => (
              <button key={loc.id} onClick={() => toggleLocation(loc.id)}
                className={cn(
                  "h-10 rounded-xl border-2 text-xs font-bold transition-all px-3 flex items-center justify-center gap-1.5",
                  selectedLocations.includes(loc.id)
                    ? "border-[#F5C400] bg-[#F5C400] text-black"
                    : "border-gray-200 text-gray-500 bg-white hover:border-[#F5C400]/50 hover:text-gray-900"
                )}>
                {selectedLocations.includes(loc.id) && <Check size={11} />}
                {loc.label}
              </button>
            ))}
          </div>

          {/* Selected tags */}
          {selectedLocations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F5C400]/5 rounded-xl border border-[#F5C400]/20">
              <span className="text-[11px] font-bold text-[#b89000] mr-1 self-center">Selected:</span>
              {selectedLocations.map((id) => {
                const loc = PRINT_LOCATIONS.find((l) => l.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-[#F5C400] text-black text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {loc?.label ?? id}
                    <button onClick={() => toggleLocation(id)} className="hover:opacity-60 transition-opacity ml-0.5"><X size={10} /></button>
                  </span>
                );
              })}
              {selectedLocations.length > 1 && (
                <button onClick={() => setSelectedLocations([])} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-white transition-colors">Clear all</button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Circle size={13} className="text-gray-300 flex-shrink-0" />
              <p className="text-xs text-gray-400">No location selected yet — tap the garment above or use the buttons</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 2 — DECORATION METHOD + QUANTITY
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
        <SectionHeader
          step={2}
          title="Choose Decoration Method & Quantity"
          subtitle="Pick a method on the left, set quantity on the right."
          status={selectedMaterial ? "done" : "required"}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gray-100">
          {/* ── LEFT: DECORATION METHOD ── */}
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Decoration method</p>
            <div className="space-y-2">
              {MATERIALS.map((mat) => {
                const isSelected = selectedMaterial === mat.id;
                return (
                  <button key={mat.id} onClick={() => handleSelectMaterial(mat.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 rounded-2xl border-2 p-3.5 transition-all duration-200 relative",
                      isSelected ? "border-[#F5C400] bg-[#FFFBEA]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F5C400] flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-black" />
                      </div>
                    )}
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all", isSelected ? "bg-[#F5C400]/20" : "bg-gray-100")}>
                      <img src={mat.iconUrl} alt={mat.label} className="w-5 h-5 object-contain"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          t.style.display = "none";
                          const p = t.parentElement;
                          if (p) p.innerHTML = `<span class="text-lg">${MATERIAL_EMOJIS[mat.id]}</span>`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-black leading-tight", isSelected ? "text-gray-900" : "text-gray-800")}>{mat.label}</p>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isSelected ? "bg-[#F5C400] text-black" : "bg-gray-100 text-gray-500")}>{mat.badge}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{mat.boldDesc}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mat.bestFor}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedMaterial === "screenprint" && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Number of Colours</p>
                <div className="flex gap-2">
                  {(["1 Color", "2 Color", "3 Color"] as const).map((c) => (
                    <button key={c} onClick={() => setSpColorCount(c)}
                      className={cn("flex-1 h-10 rounded-xl border-2 text-xs font-bold transition-all",
                        spColorCount === c ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Minimum 50 pieces required for screen print</p>
              </div>
            )}

            {(selectedMaterial === "dtg" || selectedMaterial === "dtf") && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Print Area</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DTG_PRICES) as (keyof typeof DTG_PRICES)[]).map((s) => (
                    <button key={s} onClick={() => setDtgStyle(s)}
                      className={cn("h-10 rounded-xl border-2 text-xs font-bold transition-all px-2",
                        dtgStyle === s ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: QUANTITY ── */}
          <div className="p-5 border-t border-gray-100 md:border-t-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Quantity</p>
                <p className="text-xs text-gray-500 mt-0.5">More pieces = lower price per piece</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-gray-900 leading-none">{quantity}</p>
                <p className="text-xs text-gray-400 mt-1">{quantity === 1 ? "piece" : "pieces"}</p>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden mb-3 focus-within:border-[#F5C400] transition-colors">
              <button onClick={decreaseQuantity} disabled={quantity <= 1}
                className={cn("w-14 h-14 flex items-center justify-center transition-all text-xl font-black flex-shrink-0",
                  quantity <= 1 ? "text-gray-300 cursor-not-allowed" : "text-[#F5C400] hover:bg-[#F5C400]/10 active:scale-95"
                )}>
                <Minus size={18} />
              </button>
              <input type="number" min={1} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center text-3xl font-black text-gray-900 border-0 outline-none bg-transparent py-3" />
              <button onClick={increaseQuantity}
                className="w-14 h-14 flex items-center justify-center text-[#F5C400] hover:bg-[#F5C400]/10 active:scale-95 transition-all flex-shrink-0">
                <Plus size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {QTY_PRESETS.map(({ q, hint, accent }) => {
                const isActive = quantity === q;
                return (
                  <button key={q} onClick={() => setQuantity(q)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 py-2.5 px-1 transition-all duration-150",
                      isActive ? "border-[#F5C400] bg-[#F5C400]"
                        : accent ? "border-[#F5C400]/40 bg-[#FFFBEA] hover:border-[#F5C400] hover:bg-[#FFF5C0]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}>
                    <span className={cn("text-sm font-black leading-none", isActive ? "text-black" : "text-gray-800")}>{q}</span>
                    <span className={cn("text-[9px] font-bold mt-1 leading-none text-center",
                      isActive ? "text-black/60" : accent ? "text-[#b89000]" : "text-gray-400"
                    )}>{hint}</span>
                  </button>
                );
              })}
            </div>

            {selectedMaterial === "screenprint" && quantity < 50 ? (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-amber-700 flex-1">Screen print needs at least 50 pieces — {50 - quantity} more.</p>
                <button onClick={() => setQuantity(50)} className="text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">Set 50</button>
              </div>
            ) : selectedMaterial && quantity < 144 ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                <Zap size={13} className="text-[#F5C400] flex-shrink-0" />
                <p className="text-xs text-gray-500 font-medium">{nextTierMsg()}</p>
              </div>
            ) : quantity >= 144 ? (
              <div className="flex items-center gap-2 bg-[#FFFBEA] border border-[#F5C400]/30 rounded-xl px-3.5 py-2.5">
                <TrendingUp size={13} className="text-[#F5C400] flex-shrink-0" />
                <p className="text-xs text-[#b89000] font-bold">Bulk rate unlocked — best price per piece.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                <Zap size={13} className="text-gray-300 flex-shrink-0" />
                <p className="text-xs text-gray-400">Select a decoration method to see pricing tiers.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PRICE TABLE TOGGLE ── */}
        {selectedMaterial && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <button onClick={() => setShowPriceTable((p) => !p)}
              className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Table2 size={14} className="text-[#F5C400]" />
                View Full Price Table
              </div>
              {showPriceTable ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
            </button>
            {showPriceTable && (
              <div>
                {selectedMaterial === "embroidery" && <EmbroideryPricingTable activeLocations={selectedLocations} />}
                {selectedMaterial === "dtf" && <DTFPricingTable qty={quantity} />}
                {selectedMaterial === "screenprint" && <ScreenPrintPricingTable qty={quantity} activeColor={spColorCount} />}
                {selectedMaterial === "dtg" && <DTGPricingTable qty={quantity} activeStyle={dtgStyle} />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 3 — DESIGN CUSTOMIZER
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
        <SectionHeader step={3} title="Upload Logo / Add Text" subtitle="Upload a logo or add custom text — drag to reposition on the canvas." status="optional" />
        <div className="p-5">
          <div className="flex flex-col xl:flex-row gap-5 items-start">
            {/* ── Canvas card ── */}
            <div className="w-full xl:w-[460px] xl:sticky xl:top-[72px] flex-shrink-0">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F5C400] flex items-center justify-center">
                      <Sparkles size={12} className="text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">Live Preview</p>
                      <p className="text-[10px] text-gray-400">Drag elements to reposition</p>
                    </div>
                  </div>
                  <button onClick={handleOpenPreview} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors">
                    <Download size={12} /> Export
                  </button>
                </div>
                <div className="p-3 bg-[#fafafa]">
                  <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
                    onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
                    onMouseUp={stopDrag} onMouseLeave={stopDrag}
                    className="w-full h-auto rounded-xl block border border-gray-200"
                    style={{ cursor: getCursor() }} />
                </div>

                {/* Pricing summary */}
                <div className="px-4 pb-4 pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 truncate max-w-[65%]">{name}</span>
                    <span className="text-sm font-black text-gray-900">${price.toFixed(2)} / pc</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Garment ({quantity} pcs)</span>
                      <span className="font-bold text-gray-900">${(price * quantity).toFixed(2)}</span>
                    </div>
                    {printPrice !== null && !selectedLocations.includes("oversized") && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          Decoration{selectedMaterial === "embroidery" && quantity <= 11 ? " (incl. $35 digitizing)" : selectedLocations.length > 1 ? ` (${selectedLocations.length} loc.)` : ""}
                        </span>
                        <span className="font-bold text-gray-900">${printPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedLocations.includes("oversized") && selectedMaterial === "embroidery" && (
                      <div className="flex justify-between items-center text-sm text-[#e05555]">
                        <span>Decoration (Oversized)</span>
                        <span className="font-bold">Quote required</span>
                      </div>
                    )}
                    {selectedMaterial === "screenprint" && quantity < 50 && (
                      <p className="text-[10px] text-amber-500 font-bold">⚠ Screen print requires 50+ pieces</p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-900">Estimated Total</span>
                      <span className="text-lg font-black text-[#F5C400]">
                        {selectedLocations.includes("oversized") && selectedMaterial === "embroidery"
                          ? `$${(price * quantity).toFixed(2)} + quote`
                          : `$${(price * quantity + (printPrice ?? 0)).toFixed(2)}`}
                      </span>
                    </div>
                    {printPrice !== null && !selectedLocations.includes("oversized") && (
                      <p className="text-[10px] text-gray-400">
                        ${((price * quantity + printPrice) / quantity).toFixed(2)}/pc all-in · ${(printPrice / quantity).toFixed(2)}/pc decoration
                      </p>
                    )}
                  </div>

                  {/* Requirements checklist */}
                  <div className="flex flex-wrap gap-1.5">
                    {REQUIREMENTS.map(({ key, label, done }) => (
                      <span key={key} className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                        done ? "bg-[#F5C400]/10 text-[#b89000] border-[#F5C400]/30"
                          : showValidationShake ? "bg-[#e05555]/10 text-[#e05555] border-[#e05555]/25"
                            : "bg-gray-100 text-gray-400 border-gray-200"
                      )}>
                        {done ? <Check size={9} /> : <Circle size={9} className="opacity-40" />}
                        {label}
                      </span>
                    ))}
                  </div>

                  {validationError && (
                    <div className="flex items-start gap-2 bg-[#e05555]/8 border border-[#e05555]/20 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="text-[#e05555] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#e05555] leading-relaxed">{validationError}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2.5">
                    <button onClick={handleAddToCart}
                      className={cn(
                        "flex-1 h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200",
                        showValidationShake && "animate-[shake_0.4s_ease-in-out]",
                        !allRequirementsMet
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                          : inCart
                            ? "bg-[#F5C400]/10 text-[#b89000] border-2 border-[#F5C400]/40"
                            : "bg-[#F5C400] text-black hover:bg-[#e6b800] shadow-md shadow-[#F5C400]/20"
                      )}>
                      <ShoppingCart size={16} />
                      {inCart ? "Added to Cart" : "Add to Cart"}
                    </button>
                    <button onClick={handleWishlist} disabled={wishlistLoading}
                      title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                      className={cn(
                        "w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                        wishlistLoading ? "opacity-40 cursor-not-allowed border-gray-200"
                          : inWishlist ? "border-[#e05555]/40 bg-[#e05555]/8 hover:bg-[#e05555]/15"
                            : "border-gray-200 hover:border-[#e05555]/40 hover:bg-[#e05555]/8"
                      )}>
                      {wishlistLoading
                        ? <Loader2 size={16} className="animate-spin text-gray-400" />
                        : <Heart size={16} fill={inWishlist ? "#e05555" : "none"} className={inWishlist ? "text-[#e05555]" : "text-gray-400"} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AddToCartModal */}
            <AddToCartModal
              open={showCartModal}
              onClose={() => setShowCartModal(false)}
              productId={productId}
              variantId={variantId}
              price={price}
              name={name}
              initialQuantity={quantity}
              printPricePerPiece={
                printPrice
                  ? (selectedMaterial === "embroidery" && quantity <= 11
                    ? (printPrice - 35) / quantity
                    : printPrice / quantity)
                  : 0
              }
              digitizingFee={selectedMaterial === "embroidery" && quantity <= 11 ? 35 : 0}
              customization={customizationJson}
              canvasBlob={canvasBlob}
              onSuccess={() => { setInCart(true); refreshCart(); onReload?.(); }}
            />

            {/* ── Controls panel ── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {([
                    { key: "image", icon: ImageIcon, label: "Upload Logo" },
                    { key: "text", icon: Type, label: "Custom Text" },
                  ] as const).map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => { if (requireLogin()) return; setActiveTab(key); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-12 text-sm font-bold transition-all border-b-2",
                        activeTab === key ? "text-gray-900 border-[#F5C400] bg-[#FFFBEA]" : "text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-600"
                      )}>
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-5">
                  {/* IMAGE TAB */}
                  {activeTab === "image" && (
                    <div className="space-y-4">
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                      {!logoImg ? (
                        <div onClick={() => { if (requireLogin()) return; fileRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#F5C400]/60 hover:bg-[#FFFBEA] transition-all group">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:border-[#F5C400]/40 group-hover:bg-[#F5C400]/10 transition-all">
                            <Upload size={22} className="text-gray-400 group-hover:text-[#F5C400] transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-gray-900 text-sm">Click to upload logo</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — max 10MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
                            <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white overflow-hidden flex-shrink-0">
                              <img src={logoSrc!} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900">Logo uploaded</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Drag on canvas to reposition</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"><Upload size={13} /></button>
                              <button onClick={() => { setLogoSrc(null); setLogoImg(null); }} className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 transition-colors text-[#e05555]"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <div className="p-4 space-y-4">
                            <Slider label="Size" value={logoSize} min={40} max={280} unit="px" onChange={setLogoSize} />
                            <Slider label="Rotation" value={logoRotation} min={0} max={360} unit="°" onChange={setLogoRotation} />
                            <Slider label="Opacity" value={Math.round(logoOpacity * 100)} min={10} max={100} unit="%" onChange={(v) => setLogoOpacity(v / 100)} />
                            <div className="flex gap-2">
                              <button onClick={() => setLogoRotation((p) => (p - 15 + 360) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"><RotateCcw size={13} /> Left</button>
                              <button onClick={() => setLogoRotation((p) => (p + 15) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"><RotateCw size={13} /> Right</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEXT TAB */}
                  {activeTab === "text" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Text</p>
                        <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Type something..."
                          className="w-full h-11 rounded-xl border-2 border-gray-200 px-4 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#F5C400] transition-all" />
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Font</p>
                        <div className="grid grid-cols-2 gap-2">
                          {FONTS.map((f) => (
                            <button key={f.value} onClick={() => setFontFamily(f.value)} style={{ fontFamily: f.value }}
                              className={cn("h-10 rounded-xl border-2 text-sm transition-all px-3 text-left truncate",
                                fontFamily === f.value ? "border-[#F5C400] bg-[#FFFBEA] text-[#b89000] font-bold" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                              )}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Style</p>
                        <div className="flex gap-2">
                          {([
                            { key: "bold", label: "B", active: textBold, toggle: () => setTextBold((p) => !p), cls: "font-black" },
                            { key: "italic", label: "I", active: textItalic, toggle: () => setTextItalic((p) => !p), cls: "italic" },
                            { key: "shadow", label: "Shadow", active: textShadow, toggle: () => setTextShadow((p) => !p), cls: "" },
                          ] as const).map(({ key, label, active, toggle, cls }) => (
                            <button key={key} onClick={toggle}
                              className={cn("h-10 px-4 rounded-xl border-2 text-sm transition-all", cls,
                                active ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-gray-200 text-gray-600 hover:border-gray-300"
                              )}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Color</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {PRESET_COLORS.map((c) => (
                            <button key={c} onClick={() => setTextColor(c)} style={{ background: c }}
                              className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0",
                                textColor === c ? "border-[#F5C400] scale-110 ring-2 ring-[#F5C400]/30" : "border-gray-200 shadow-sm"
                              )} />
                          ))}
                          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                            className="w-8 h-8 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white ml-auto" />
                        </div>
                      </div>
                      <div className="h-px bg-gray-100" />
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Adjustments</p>
                        <Slider label="Font Size" value={textSize} min={12} max={96} unit="px" onChange={setTextSize} />
                        <Slider label="Rotation" value={textRotation} min={0} max={360} unit="°" onChange={setTextRotation} />
                        <Slider label="Opacity" value={Math.round(textOpacity * 100)} min={10} max={100} unit="%" onChange={(v) => setTextOpacity(v / 100)} />
                        <div className="flex gap-2">
                          <button onClick={() => setTextRotation((p) => (p - 15 + 360) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"><RotateCcw size={13} /> Left</button>
                          <button onClick={() => setTextRotation((p) => (p + 15) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"><RotateCw size={13} /> Right</button>
                        </div>
                      </div>
                      {customText.trim() && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preview</p>
                          <p style={{ fontFamily, fontSize: Math.min(textSize, 28), color: textColor, fontWeight: textBold ? 700 : 400, fontStyle: textItalic ? "italic" : "normal", textShadow: textShadow ? "2px 2px 4px rgba(0,0,0,0.3)" : "none", opacity: textOpacity, lineHeight: 1.4, wordBreak: "break-all" }}>
                            {customText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </>
  );
}