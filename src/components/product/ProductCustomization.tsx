// components/product/ProductCustomization.tsx

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

/* ─── Constants ──────────────────────────────────────────────────────────── */

const CANVAS_SIZE = 500;

/* ─── Print Locations ────────────────────────────────────────────────────── */

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

/* ─── Materials ──────────────────────────────────────────────────────────── */

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

/* ─── Pricing tables ─────────────────────────────────────────────────────── */

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
  { label: "Full Back (Standard)", key: "full-back-standard", prices: [18, 16, 14, 13, 12, 11, 10] },
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

const DTF_TIERS = [1, 12, 24, 36, 72, 96, 144];
const DTF_PRICES = [15, 12, 10, 9, 7, 5, 5];
const DTF_TIER_LABELS = ["1–11", "12–23", "24–35", "36–71", "72–95", "96–143", "144+"];

const SP_TIERS = [
  { label: "50–99", min: 50 },
  { label: "100+", min: 100 },
];
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
  "#1a1a1a", "#ffffff", "#e05555", "#2d7dd2",
  "#2d4a35", "#f5a623", "#9b59b6", "#1abc9c",
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

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

function drawAll({
  ctx, size, productImg, logo,
  logoPos, logoSize, logoRotation, logoOpacity,
  text, textPos, textSize, textColor, textRotation,
  fontFamily, textBold, textItalic, textShadow, textOpacity,
}: DrawParams) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  if (productImg) {
    const scale = Math.min(size / productImg.naturalWidth, size / productImg.naturalHeight);
    const drawW = productImg.naturalWidth * scale;
    const drawH = productImg.naturalHeight * scale;
    const offsetX = (size - drawW) / 2;
    const offsetY = (size - drawH) / 2;
    ctx.drawImage(productImg, offsetX, offsetY, drawW, drawH);
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
    const cx = textPos.x + tw / 2;
    const cy = textPos.y - th / 2;
    ctx.translate(cx, cy);
    ctx.rotate((textRotation * Math.PI) / 180);
    ctx.fillText(text, -tw / 2, th / 2);
    ctx.restore();
  }
}

/* ─── Slider ─────────────────────────────────────────────────────────────── */

function Slider({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[#6b7280]">{label}</span>
        <span className="text-xs font-semibold text-[#1a2e1e] tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#dde8df] accent-[#2d4a35] cursor-pointer"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRICING TABLE COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

function EmbroideryPricingTable({ activeLocations }: { activeLocations: string[] }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#dde8df] overflow-hidden">
      <div className="bg-[#1a2e1e] px-4 py-2.5 flex items-center gap-2">
        <Table2 size={13} className="text-[#8aaa90]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8aaa90]">Embroidery Price Per Location</p>
        <span className="ml-auto text-[10px] text-[#8aaa90]">+ $35 digitizing fee for 1–11 pcs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-[#e8f0ea]">
              <th className="text-left px-3 py-2 font-bold text-[#1a2e1e] border-b border-r border-[#d0e4d5] w-40">Location</th>
              {EMB_TIERS.map((t) => (
                <th key={t.label} className="px-2 py-2 font-bold text-[#1a2e1e] border-b border-r border-[#d0e4d5] text-center whitespace-nowrap">
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMB_ROWS.map((row, i) => {
              const isActive =
                activeLocations.includes(row.key) ||
                (activeLocations.includes("sleeve-right") && row.key === "sleeve-left");
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b border-[#edf4ef] transition-colors",
                    isActive ? "bg-[#2d4a35]/10" : i % 2 === 0 ? "bg-white" : "bg-[#f8fbf9]"
                  )}
                >
                  <td className={cn("px-3 py-2 font-semibold border-r border-[#edf4ef]", isActive ? "text-[#1a2e1e]" : "text-[#374151]")}>
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2d4a35] mr-1.5 mb-0.5" />}
                    {row.label}
                  </td>
                  {row.prices.map((p, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-2 py-2 text-center border-r border-[#edf4ef] font-medium",
                        p === "quote" ? "text-[#e05555] text-[10px]" : isActive ? "text-[#1a2e1e] font-bold" : "text-[#4a5568]"
                      )}
                    >
                      {p === "quote" ? "Quote" : `$${p}`}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-[#f4f9f5] px-4 py-2 border-t border-[#dde8df]">
        <p className="text-[10px] text-[#8fa989]">
          💡 Each location is priced separately and added together. &nbsp;|&nbsp; Oversized Back requires a custom quote.
        </p>
      </div>
    </div>
  );
}

function DTFPricingTable({ qty }: { qty: number }) {
  const activeTier = DTF_TIERS.findIndex((t, i) =>
    qty >= t && (i === DTF_TIERS.length - 1 || qty < DTF_TIERS[i + 1])
  );
  return (
    <div className="mt-4 rounded-2xl border border-[#dde8df] overflow-hidden">
      <div className="bg-[#1a2e1e] px-4 py-2.5 flex items-center gap-2">
        <Table2 size={13} className="text-[#8aaa90]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8aaa90]">DTF Print Pricing</p>
        <span className="ml-auto text-[10px] text-[#8aaa90]">No minimum order</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[480px]">
          <thead>
            <tr className="bg-[#e8f0ea]">
              <th className="text-left px-3 py-2 font-bold text-[#1a2e1e] border-b border-r border-[#d0e4d5] w-24">Method</th>
              {DTF_TIER_LABELS.map((lbl, i) => (
                <th
                  key={lbl}
                  className={cn(
                    "px-2 py-2 font-bold border-b border-r border-[#d0e4d5] text-center whitespace-nowrap",
                    activeTier === i ? "text-[#2d4a35] bg-[#2d4a35]/10" : "text-[#1a2e1e]"
                  )}
                >
                  {activeTier === i && <span className="block w-1 h-1 rounded-full bg-[#2d4a35] mx-auto mb-0.5" />}
                  {lbl}
                </th>
              ))}
              <th className="px-2 py-2 font-bold text-[#1a2e1e] border-b border-[#d0e4d5] text-center">More</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="px-3 py-3 font-bold text-[#1a2e1e] border-r border-[#edf4ef]">DTF</td>
              {DTF_PRICES.map((p, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-2 py-3 text-center border-r border-[#edf4ef] font-medium",
                    activeTier === i ? "text-[#2d4a35] font-bold text-sm bg-[#2d4a35]/5" : "text-[#4a5568]"
                  )}
                >
                  ${p}.00
                </td>
              ))}
              <td className="px-2 py-3 text-center text-[#e05555] text-[10px] font-semibold">Send Inquiry</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-[#f4f9f5] px-4 py-2 border-t border-[#dde8df]">
        <p className="text-[10px] text-[#8fa989]">
          💡 Prices are per piece. Your current quantity ({qty}) is highlighted above.
        </p>
      </div>
    </div>
  );
}

function ScreenPrintPricingTable({ qty, activeColor }: { qty: number; activeColor: string }) {
  const activeTier = qty >= 100 ? 1 : qty >= 50 ? 0 : -1;
  return (
    <div className="mt-4 rounded-2xl border border-[#dde8df] overflow-hidden">
      <div className="bg-[#1a2e1e] px-4 py-2.5 flex items-center gap-2">
        <Table2 size={13} className="text-[#8aaa90]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8aaa90]">Screen Print Pricing</p>
        <span className="ml-auto text-[10px] text-[#8aaa90]">Minimum 50 pieces</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[360px]">
          <thead>
            <tr className="bg-[#e8f0ea]">
              <th className="text-left px-3 py-2 font-bold text-[#1a2e1e] border-b border-r border-[#d0e4d5] w-28">Colors</th>
              {SP_TIERS.map((t, i) => (
                <th
                  key={t.label}
                  className={cn(
                    "px-3 py-2 font-bold border-b border-r border-[#d0e4d5] text-center",
                    activeTier === i ? "text-[#2d4a35] bg-[#2d4a35]/10" : "text-[#1a2e1e]"
                  )}
                >
                  {activeTier === i && <span className="block w-1 h-1 rounded-full bg-[#2d4a35] mx-auto mb-0.5" />}
                  {t.label}
                </th>
              ))}
              <th className="px-3 py-2 font-bold text-[#1a2e1e] border-b border-[#d0e4d5] text-center">More</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SP_PRICES).map(([colorKey, prices], i) => {
              const isActiveColor = activeColor === colorKey;
              return (
                <tr
                  key={colorKey}
                  className={cn(
                    "border-b border-[#edf4ef]",
                    isActiveColor ? "bg-[#2d4a35]/5" : i % 2 === 0 ? "bg-white" : "bg-[#f8fbf9]"
                  )}
                >
                  <td className={cn("px-3 py-2.5 font-semibold border-r border-[#edf4ef]", isActiveColor ? "text-[#1a2e1e]" : "text-[#374151]")}>
                    {isActiveColor && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2d4a35] mr-1.5 mb-0.5" />}
                    {colorKey}
                  </td>
                  {prices.map((p, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-2.5 text-center border-r border-[#edf4ef] font-medium",
                        activeTier === j && isActiveColor ? "text-[#2d4a35] font-bold text-sm" : "text-[#4a5568]"
                      )}
                    >
                      ${p.toFixed(2)}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center text-[#e05555] text-[10px] font-semibold">Send Inquiry</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-[#f4f9f5] px-4 py-2 border-t border-[#dde8df]">
        <p className="text-[10px] text-[#8fa989]">
          💡 Prices are per piece. Minimum 50 pcs.{" "}
          {qty < 50 ? `You need ${50 - qty} more pieces to qualify.` : `Your qty (${qty}) qualifies.`}
        </p>
      </div>
    </div>
  );
}

function DTGPricingTable({ qty, activeStyle }: { qty: number; activeStyle: string }) {
  const activeTier = DTG_TIERS.findIndex((t, i) =>
    qty >= t.min && (i === DTG_TIERS.length - 1 || qty < DTG_TIERS[i + 1].min)
  );
  return (
    <div className="mt-4 rounded-2xl border border-[#dde8df] overflow-hidden">
      <div className="bg-[#1a2e1e] px-4 py-2.5 flex items-center gap-2">
        <Table2 size={13} className="text-[#8aaa90]" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8aaa90]">DTG Print Pricing</p>
        <span className="ml-auto text-[10px] text-[#8aaa90]">100% cotton only</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[420px]">
          <thead>
            <tr className="bg-[#e8f0ea]">
              <th className="text-left px-3 py-2 font-bold text-[#1a2e1e] border-b border-r border-[#d0e4d5] w-40">Print Area</th>
              {DTG_TIERS.map((t, i) => (
                <th
                  key={t.label}
                  className={cn(
                    "px-2 py-2 font-bold border-b border-r border-[#d0e4d5] text-center",
                    activeTier === i ? "text-[#2d4a35] bg-[#2d4a35]/10" : "text-[#1a2e1e]"
                  )}
                >
                  {activeTier === i && <span className="block w-1 h-1 rounded-full bg-[#2d4a35] mx-auto mb-0.5" />}
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DTG_PRICES).map(([styleKey, prices], i) => {
              const isActive = activeStyle === styleKey;
              return (
                <tr
                  key={styleKey}
                  className={cn(
                    "border-b border-[#edf4ef]",
                    isActive ? "bg-[#2d4a35]/5" : i % 2 === 0 ? "bg-white" : "bg-[#f8fbf9]"
                  )}
                >
                  <td className={cn("px-3 py-2.5 font-semibold border-r border-[#edf4ef]", isActive ? "text-[#1a2e1e]" : "text-[#374151]")}>
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2d4a35] mr-1.5 mb-0.5" />}
                    {styleKey}
                  </td>
                  {prices.map((p, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-2 py-2.5 text-center border-r border-[#edf4ef] font-medium",
                        activeTier === j && isActive ? "text-[#2d4a35] font-bold text-sm" : "text-[#4a5568]"
                      )}
                    >
                      ${p}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-[#f4f9f5] px-4 py-2 border-t border-[#dde8df]">
        <p className="text-[10px] text-[#8fa989]">
          💡 Prices are per piece. Your current quantity ({qty}) is highlighted above.
        </p>
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProductCustomization({
  productId, variantId, price, name, productImage,
  is_in_cart = false, onReload,
}: Props) {
  const router = useRouter();

  /* ─── Auth ─── */
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!localStorage.getItem("hastagBillionaire");
  const requireLogin = () => {
    if (!isLoggedIn) { setShowLoginModal(true); return true; }
    return false;
  };

  /* ─── Cart context ─── */
  const { refreshCart } = useCart();

  /* ─── Wishlist ─── */
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const wishlistItem = wishlist.find(
    (item) => item.product_id === productId && item.variant_id === variantId
  );
  const inWishlist = !!wishlistItem;
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlist = async () => {
    if (requireLogin()) return;
    try {
      setWishlistLoading(true);
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id);
      } else {
        await addToWishlist({ product_id: productId, variant_id: variantId, name, price, image: productImage || "" });
      }
      await fetchWishlist();
      onReload?.();
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  /* ─── Cart ─── */
  const [inCart, setInCart] = useState(is_in_cart);
  const [showCartModal, setShowCartModal] = useState(false);

  /* ─── Canvas blob + customization JSON for cart submission ─── */
  const [canvasBlob, setCanvasBlob] = useState<Blob | null>(null);
  const [customizationJson, setCustomizationJson] = useState<string>("");

  /* ─── Validation ─── */
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showValidationShake, setShowValidationShake] = useState(false);

  /* ─── Selections ─── */
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  /* ─── Toggle a location on/off ─── */
  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId | null>(null);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [spColorCount, setSpColorCount] = useState<"1 Color" | "2 Color" | "3 Color">("1 Color");
  const [dtgStyle, setDtgStyle] = useState<keyof typeof DTG_PRICES>("Front Regular");

  /* ─── Tab ─── */
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");

  /* ─── Image state ─── */
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(120);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [logoPos, setLogoPos] = useState({ x: 190, y: 190 });

  /* ─── Text state ─── */
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

  /* ─── Drag ─── */
  const [dragging, setDragging] = useState<"logo" | "text" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  /* ─── Preview ─── */
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  /* ─── Quantity ─── */
  const [quantity, setQuantity] = useState(1);
  const decreaseQuantity = () => setQuantity((p) => Math.max(1, p - 1));
  const increaseQuantity = () => setQuantity((p) => p + 1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ─── Validation helper ─── */
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
    { key: "qty", label: "Item count", done: quantity >= 1 },
  ];

  /* ─── Load product image ─── */
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

  /* ─── Load logo ─── */
  useEffect(() => {
    if (!logoSrc) { setLogoImg(null); return; }
    let cancelled = false;
    loadImage(logoSrc).then((img) => { if (!cancelled) setLogoImg(img); });
    return () => { cancelled = true; };
  }, [logoSrc]);

  /* ─── Draw canvas ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAll({
      ctx, size: CANVAS_SIZE, productImg,
      logo: logoImg, logoPos, logoSize, logoRotation, logoOpacity,
      text: customText, textPos, textSize, textColor, textRotation,
      fontFamily, textBold, textItalic, textShadow, textOpacity,
    });
  }, [
    productImg, logoImg, logoPos, logoSize, logoRotation, logoOpacity,
    customText, textPos, textSize, textColor, textRotation,
    fontFamily, textBold, textItalic, textShadow, textOpacity,
  ]);

  /* ─── Upload ─── */
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

  /* ─── Canvas interaction ─── */
  const getCanvasPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_SIZE / rect.height),
    };
  };

  const isOverLogo = (pt: { x: number; y: number }) =>
    !!(logoImg && pt.x >= logoPos.x && pt.x <= logoPos.x + logoSize &&
      pt.y >= logoPos.y && pt.y <= logoPos.y + logoSize);

  const isOverText = (pt: { x: number; y: number }) => {
    if (!customText.trim()) return false;
    return (
      pt.x >= textPos.x &&
      pt.x <= textPos.x + textSize * customText.length * 0.65 &&
      pt.y >= textPos.y - textSize &&
      pt.y <= textPos.y + 8
    );
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);
    if (isOverLogo(pt)) {
      setDragging("logo");
      setDragOffset({ x: pt.x - logoPos.x, y: pt.y - logoPos.y });
    } else if (isOverText(pt)) {
      setDragging("text");
      setDragOffset({ x: pt.x - textPos.x, y: pt.y - textPos.y });
    }
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [dragging, dragOffset, logoSize, textSize]
  );

  const stopDrag = () => setDragging(null);

  /* ─── Preview ─── */
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
      drawAll({
        ctx, size: CANVAS_SIZE, productImg,
        logo: logoImg, logoPos, logoSize, logoRotation, logoOpacity,
        text: customText, textPos, textSize, textColor, textRotation,
        fontFamily, textBold, textItalic, textShadow, textOpacity,
      });
      setPreviewDataUrl(offscreen.toDataURL("image/png", 1));
    } catch (err) {
      console.error(err);
      setPreviewError(true);
    }
  };

  /* ─── Download only ─── */
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

  /* ─── Pricing helper ─── */
  const getPrintPrice = (): number | null => {
    if (!selectedMaterial) return null;

    if (selectedMaterial === "embroidery") {
      if (selectedLocations.length === 0) return null;
      // If any location is oversized (quote-only), return null
      if (selectedLocations.includes("oversized")) return null;
      const tierIdx = EMB_TIERS.findIndex((t) => quantity >= t.min && quantity <= t.max);
      let total = 0;
      for (const locId of selectedLocations) {
        const row = EMB_PRICES[locId];
        if (!row) return null;
        const base = tierIdx >= 0 ? row[tierIdx] : row[row.length - 1];
        total += base * quantity;
      }
      const digitizing = quantity <= 11 ? 35 : 0;
      return total + digitizing;
    }

    if (selectedMaterial === "dtf") {
      if (selectedLocations.length === 0) return null;
      const tierIdx = DTF_TIERS.findIndex((t, i) =>
        quantity >= t && (i === DTF_TIERS.length - 1 || quantity < DTF_TIERS[i + 1])
      );
      const unitPrice = tierIdx >= 0 ? DTF_PRICES[tierIdx] : DTF_PRICES[DTF_PRICES.length - 1];
      return unitPrice * quantity * selectedLocations.length;
    }

    if (selectedMaterial === "screenprint") {
      if (quantity < 50 || selectedLocations.length === 0) return null;
      const tierIdx = quantity >= 100 ? 1 : 0;
      return SP_PRICES[spColorCount][tierIdx] * quantity * selectedLocations.length;
    }

    if (selectedMaterial === "dtg") {
      if (selectedLocations.length === 0) return null;
      const tierIdx = DTG_TIERS.findIndex((t, i) =>
        quantity >= t.min && (i === DTG_TIERS.length - 1 || quantity < DTG_TIERS[i + 1].min)
      );
      const unitPrice = tierIdx >= 0 ? DTG_PRICES[dtgStyle][tierIdx] : DTG_PRICES[dtgStyle][DTG_PRICES[dtgStyle].length - 1];
      return unitPrice * quantity * selectedLocations.length;
    }

    return null;
  };

  const printPrice = getPrintPrice();

  /* ─── Export canvas as Blob ─── */
  const getCanvasBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });

  /* ─── Build customization JSON payload ─── */
  const buildCustomizationPayload = (): string => {
    const payload: Record<string, unknown> = {
      print_method: selectedMaterial?.toUpperCase() ?? null,
      locations: selectedLocations.map((id) => ({ location: id })),
    };
    if (selectedMaterial === "screenprint") {
      payload.color_count = spColorCount;
    }
    if (selectedMaterial === "dtg") {
      payload.print_area = dtgStyle;
    }
    if (customText.trim()) {
      payload.custom_text = customText.trim();
    }
    return JSON.stringify(payload);
  };


  /* ─── Add to cart ─── */
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

  /* ─── Clear validation when requirements met ─── */
  useEffect(() => {
    if (validationError && getMissingRequirements().length === 0) {
      setValidationError(null);
    }
  }, [selectedLocations, selectedMaterial, quantity, validationError, getMissingRequirements]);



  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-2">{children}</p>
  );
  const Divider = () => <div className="h-px bg-[#edf4ef] my-4" />;

  const handleSelectMaterial = (id: MaterialId) => {
    setSelectedMaterial(id);
    setShowPriceTable(true);
  };

  /* ─── All requirements satisfied ─── */
  const allRequirementsMet = selectedLocations.length > 0 && !!selectedMaterial && quantity >= 1;

  return (
    <>
      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl border border-[#e8e4df]">
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#e8f0ea] flex items-center justify-center mb-4">
                <span className="text-lg">🔒</span>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-[#8fa989] hover:text-[#2d4a35]">
                <X size={18} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#1a2e1f] mb-1.5">Sign in to continue</h2>
            <p className="text-sm text-[#8fa989] leading-relaxed mb-6">
              Login to customize products, save to wishlist, and add to cart.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 h-11 rounded-xl border border-[#dde8df] text-sm font-semibold text-[#6b8070] hover:bg-[#f0f6f1] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push("/login")}
                className="flex-1 h-11 rounded-xl bg-[#2d4a35] text-white text-sm font-bold hover:bg-[#1f3526] transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Eye size={18} />
                <h3 className="font-bold text-lg">Preview Design</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="w-full aspect-square rounded-2xl border border-[#e5ece7] bg-white overflow-hidden relative">
                {previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-500">
                    <AlertCircle size={40} />
                    <p>Failed to generate preview</p>
                  </div>
                ) : previewDataUrl ? (
                  <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 h-12 rounded-2xl border hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                disabled={!previewDataUrl}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2",
                  previewDataUrl ? "bg-[#1f3526] hover:bg-[#294832]" : "bg-gray-300 cursor-not-allowed"
                )}
              >
                <ImageDown size={18} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           SECTION 1 — PRINT LOCATION
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e2ece4] bg-white shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2d4a35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</div>
          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">Choose Print Location</p>
            <p className="text-[10px] text-[#8aaa90]">Where should we print on the garment?</p>
          </div>
          {selectedLocations.length > 0 ? (
            <span className="ml-auto text-xs font-semibold text-[#2d4a35] bg-[#e8f0ea] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check size={10} />
              {selectedLocations.length === 1
                ? PRINT_LOCATIONS.find((l) => l.id === selectedLocations[0])?.label
                : `${selectedLocations.length} locations`}
            </span>
          ) : (
            <span className="ml-auto text-xs font-semibold text-[#e05555] bg-[#fdf0f0] px-2.5 py-1 rounded-full">
              Required
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="relative mx-auto mb-5 mt-5" style={{ maxWidth: 320 }}>
            <svg viewBox="0 0 320 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path
                d="M100 40 L60 80 L20 70 L10 130 L60 140 L60 320 L260 320 L260 140 L310 130 L300 70 L260 80 L220 40 Q180 65 160 65 Q140 65 100 40Z"
                fill="#f0f5f1" stroke="#c5d9ca" strokeWidth="2"
              />
              <path d="M100 40 Q130 80 160 82 Q190 80 220 40" fill="#dde8df" stroke="#b5cebb" strokeWidth="1.5" />

              {/* LEFT CHEST */}
              <circle cx="115" cy="145" r="22"
                onClick={() => toggleLocation("left-chest")}
                className="cursor-pointer transition-all"
                fill={selectedLocations.includes("left-chest") ? "#2d4a35" : "#e8f0ea"}
                fillOpacity={selectedLocations.includes("left-chest") ? 0.9 : 0.7}
                stroke={selectedLocations.includes("left-chest") ? "#1a2e1e" : "#a3c5ab"} strokeWidth="1.5"
              />
              <text x="115" y="141" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("left-chest") ? "#fff" : "#2d4a35"} fontWeight="600">Left</text>
              <text x="115" y="152" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("left-chest") ? "#fff" : "#2d4a35"} fontWeight="600">Chest</text>

              {/* RIGHT CHEST */}
              <circle cx="205" cy="145" r="22"
                onClick={() => toggleLocation("right-chest")}
                className="cursor-pointer transition-all"
                fill={selectedLocations.includes("right-chest") ? "#2d4a35" : "#e8f0ea"}
                fillOpacity={selectedLocations.includes("right-chest") ? 0.9 : 0.7}
                stroke={selectedLocations.includes("right-chest") ? "#1a2e1e" : "#a3c5ab"} strokeWidth="1.5"
              />
              <text x="205" y="141" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("right-chest") ? "#fff" : "#2d4a35"} fontWeight="600">Right</text>
              <text x="205" y="152" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("right-chest") ? "#fff" : "#2d4a35"} fontWeight="600">Chest</text>

              {/* FULL FRONT */}
              <rect x="122" y="175" width="76" height="60" rx="10"
                onClick={() => toggleLocation("full-front")}
                className="cursor-pointer transition-all"
                fill={selectedLocations.includes("full-front") ? "#2d4a35" : "#e8f0ea"}
                fillOpacity={selectedLocations.includes("full-front") ? 0.9 : 0.7}
                stroke={selectedLocations.includes("full-front") ? "#1a2e1e" : "#a3c5ab"} strokeWidth="1.5"
              />
              <text x="160" y="200" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("full-front") ? "#fff" : "#2d4a35"} fontWeight="600">Full</text>
              <text x="160" y="213" textAnchor="middle" fontSize="9" fill={selectedLocations.includes("full-front") ? "#fff" : "#2d4a35"} fontWeight="600">Front</text>

              {/* LEFT SLEEVE */}
              <ellipse cx="42" cy="110" rx="20" ry="26"
                onClick={() => toggleLocation("sleeve-left")}
                className="cursor-pointer transition-all"
                fill={selectedLocations.includes("sleeve-left") ? "#2d4a35" : "#e8f0ea"}
                fillOpacity={selectedLocations.includes("sleeve-left") ? 0.9 : 0.7}
                stroke={selectedLocations.includes("sleeve-left") ? "#1a2e1e" : "#a3c5ab"} strokeWidth="1.5"
              />
              <text x="42" y="106" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-left") ? "#fff" : "#2d4a35"} fontWeight="600">Left</text>
              <text x="42" y="117" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-left") ? "#fff" : "#2d4a35"} fontWeight="600">Sleeve</text>

              {/* RIGHT SLEEVE */}
              <ellipse cx="278" cy="110" rx="20" ry="26"
                onClick={() => toggleLocation("sleeve-right")}
                className="cursor-pointer transition-all"
                fill={selectedLocations.includes("sleeve-right") ? "#2d4a35" : "#e8f0ea"}
                fillOpacity={selectedLocations.includes("sleeve-right") ? 0.9 : 0.7}
                stroke={selectedLocations.includes("sleeve-right") ? "#1a2e1e" : "#a3c5ab"} strokeWidth="1.5"
              />
              <text x="278" y="106" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-right") ? "#fff" : "#2d4a35"} fontWeight="600">Right</text>
              <text x="278" y="117" textAnchor="middle" fontSize="8" fill={selectedLocations.includes("sleeve-right") ? "#fff" : "#2d4a35"} fontWeight="600">Sleeve</text>
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "full-back-standard", label: "Full Back (Standard)" },
              { id: "full-back-large", label: "Full Back (Large)" },
              { id: "oversized", label: "Oversized Back" },
              { id: "hat-front", label: "Hat Front" },
              { id: "hat-side", label: "Hat Side" },
              { id: "hat-back", label: "Hat Back (Arch)" },
            ].map((loc) => (
              <button
                key={loc.id}
                onClick={() => toggleLocation(loc.id)}
                className={cn(
                  "h-10 rounded-xl border text-xs font-semibold transition-all px-3 flex items-center justify-center gap-1.5",
                  selectedLocations.includes(loc.id)
                    ? "border-[#2d4a35] bg-[#2d4a35] text-white"
                    : "border-[#dde8df] text-[#4a7a58] hover:border-[#2d4a35] hover:bg-[#f4f9f5]"
                )}
              >
                {selectedLocations.includes(loc.id) && <Check size={11} />}
                {loc.label}
              </button>
            ))}
          </div>

          {/* ── Multi-select hint ── */}
          <p className="text-xs text-[#b0c4b5] text-center mt-3">
            {selectedLocations.length === 0
              ? "Tap locations to select — you can choose multiple"
              : `${selectedLocations.length} location${selectedLocations.length > 1 ? "s" : ""} selected · tap again to deselect`}
          </p>

          {/* ── Selected location chips ── */}
          {selectedLocations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedLocations.map((id) => {
                const loc = PRINT_LOCATIONS.find((l) => l.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-[#2d4a35] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  >
                    {loc?.label ?? id}
                    <button
                      onClick={() => toggleLocation(id)}
                      className="ml-0.5 hover:opacity-70 transition-opacity"
                      aria-label={`Remove ${loc?.label}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
              {selectedLocations.length > 1 && (
                <button
                  onClick={() => setSelectedLocations([])}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#dde8df] text-[#8fa989] hover:bg-[#f4f9f5] transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 2 — PRINT METHOD + INLINE PRICING TABLE
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e2ece4] bg-white shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2d4a35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</div>
          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">Choose decoration Method</p>
            <p className="text-[10px] text-[#8aaa90]">Select the decoration technique</p>
          </div>
          {selectedMaterial ? (
            <span className="ml-auto text-xs font-semibold text-[#2d4a35] bg-[#e8f0ea] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check size={10} />
              {MATERIALS.find((m) => m.id === selectedMaterial)?.label}
            </span>
          ) : (
            <span className="ml-auto text-xs font-semibold text-[#e05555] bg-[#fdf0f0] px-2.5 py-1 rounded-full">
              Required
            </span>
          )}
        </div>

        {/* ── UPDATED MATERIAL CARDS ── */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MATERIALS.map((mat) => (
            <button
              key={mat.id}
              onClick={() => handleSelectMaterial(mat.id)}
              className={cn(
                "relative text-left rounded-2xl border-2 p-4 transition-all duration-200",
                selectedMaterial === mat.id
                  ? "border-[#2d4a35] bg-[#f4f9f5] shadow-sm"
                  : "border-[#e2ece4] bg-white hover:border-[#b5cebb] hover:bg-[#f8fbf9]"
              )}
            >
              {/* Header: icon + title */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={mat.iconUrl}
                    alt={mat.label}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-lg">${mat.id === "embroidery" ? "🧵"
                            : mat.id === "dtf" ? "🖨️"
                              : mat.id === "screenprint" ? "🎨"
                                : "👕"
                          }</span>`;
                      }
                    }}
                  />
                </div>
                <p className="text-sm font-bold text-[#1a2e1e]">{mat.label}</p>
              </div>

              {/* Bold description */}
              <p className="text-[12px] font-semibold text-[#2d4a35] leading-snug mb-2">
                {mat.boldDesc}
              </p>

              {/* Best for */}
              <p className="text-[11px] text-[#6b7280] leading-relaxed">
                <span className="font-semibold text-[#374151]">Best for:</span> {mat.bestFor}
              </p>

              {/* Min */}
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                <span className="font-semibold text-[#374151]">Min:</span> {mat.minLabel}
              </p>

              {/* Selected checkmark badge */}
              {selectedMaterial === mat.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2d4a35] flex items-center justify-center">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ── EMBROIDERY NOTES ── */}
        {selectedMaterial === "embroidery" && (
          <div className="px-5 pb-2">
            <div className="rounded-2xl border border-[#dde8df] bg-[#f8fbf9] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-2">Embroidery Notes</p>
              <ul className="space-y-1">
                <li className="text-[11px] text-[#4a7a58]">• Orders of 1–11 pieces include a <span className="font-semibold">$35 digitizing fee</span></li>
                <li className="text-[11px] text-[#4a7a58]">• Oversized back is <span className="font-semibold">quote only</span></li>
                <li className="text-[11px] text-[#4a7a58]">• Second location doubles the print cost</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── SCREEN PRINT COLOR COUNT ── */}
        {selectedMaterial === "screenprint" && (
          <div className="px-5 pb-2">
            <div className="rounded-2xl border border-[#dde8df] bg-[#f8fbf9] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-3">Number of Colours</p>
              <div className="flex gap-2">
                {(["1 Color", "2 Color", "3 Color"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSpColorCount(c)}
                    className={cn(
                      "flex-1 h-9 rounded-xl border text-xs font-semibold transition-all",
                      spColorCount === c
                        ? "border-[#2d4a35] bg-[#2d4a35] text-white"
                        : "border-[#dde8df] text-[#4a7a58] hover:border-[#2d4a35] hover:bg-[#f4f9f5]"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#b0c4b5] mt-2">Minimum order: 50 pieces</p>
            </div>
          </div>
        )}

        {/* ── DTG PRINT AREA ── */}
        {selectedMaterial === "dtg" && (
          <div className="px-5 pb-2">
            <div className="rounded-2xl border border-[#dde8df] bg-[#f8fbf9] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-3">Print Area</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DTG_PRICES) as (keyof typeof DTG_PRICES)[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setDtgStyle(s)}
                    className={cn(
                      "h-9 rounded-xl border text-xs font-semibold transition-all px-2",
                      dtgStyle === s
                        ? "border-[#2d4a35] bg-[#2d4a35] text-white"
                        : "border-[#dde8df] text-[#4a7a58] hover:border-[#2d4a35] hover:bg-[#f4f9f5]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#b0c4b5] mt-2">100% cotton garments only</p>
            </div>
          </div>
        )}

        {/* ── PRICE TABLE TOGGLE ── */}
        {selectedMaterial && (
          <div className="px-5 pb-5">
            <button
              onClick={() => setShowPriceTable((p) => !p)}
              className="w-full mt-2 flex items-center justify-between h-10 px-4 rounded-2xl border border-[#dde8df] bg-[#f4f9f5] hover:bg-[#eef5f0] transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#2d4a35]">
                <Table2 size={14} />
                View Full Price Table
              </div>
              {showPriceTable
                ? <ChevronUp size={15} className="text-[#2d4a35]" />
                : <ChevronDown size={15} className="text-[#2d4a35]" />
              }
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
           SECTION 3 — ITEM COUNT + PRICING SUMMARY
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e2ece4] bg-white shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2d4a35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</div>
          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">Choose Quantity</p>
            <p className="text-[10px] text-[#8aaa90]">How many pieces do you need?</p>
          </div>
          <span className="ml-auto text-xs font-bold text-[#1a2e1e] bg-[#e8f0ea] px-2.5 py-1 rounded-full flex items-center gap-1">
            <Check size={10} className="text-[#2d4a35]" />
            {quantity} {quantity === 1 ? "pc" : "pcs"}
          </span>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setQuantity((p) => Math.max(1, p - 1))}
              disabled={quantity <= 1}
              className={cn(
                "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all",
                quantity <= 1
                  ? "border-[#e2ece4] text-[#c5d9ca] cursor-not-allowed"
                  : "border-[#2d4a35] text-[#2d4a35] hover:bg-[#f4f9f5]"
              )}
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 text-center">
              <input
                type="number" min={1} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center text-3xl font-bold text-[#1a2e1e] border-0 outline-none bg-transparent"
              />
              <p className="text-[10px] text-[#8fa989] mt-0.5">pieces</p>
            </div>
            <button
              onClick={() => setQuantity((p) => p + 1)}
              className="w-12 h-12 rounded-2xl border-2 border-[#2d4a35] text-[#2d4a35] hover:bg-[#f4f9f5] flex items-center justify-center transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[1, 12, 24, 36, 50, 72, 100, 144].map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={cn(
                  "h-8 px-3 rounded-xl border text-xs font-semibold transition-all",
                  quantity === q
                    ? "border-[#2d4a35] bg-[#2d4a35] text-white"
                    : "border-[#dde8df] text-[#4a7a58] hover:border-[#2d4a35] hover:bg-[#f4f9f5]"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {selectedMaterial && (
            <div className="rounded-2xl border border-[#dde8df] bg-[#f8fbf9] p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-3">Estimated Print Cost</p>

              {selectedMaterial === "embroidery" && quantity <= 11 && !selectedLocations.includes("oversized") && selectedLocations.length > 0 && (
                <div className="flex justify-between text-xs text-[#8fa989]">
                  <span>Digitizing fee (1–11 pcs)</span>
                  <span className="font-semibold text-[#4a7a58]">+$35.00</span>
                </div>
              )}

              {selectedMaterial === "screenprint" && quantity < 50 && (
                <p className="text-xs text-amber-600 font-semibold">⚠️ Screen print requires a minimum of 50 pieces.</p>
              )}

              {selectedMaterial === "embroidery" && selectedLocations.includes("oversized") ? (
                <p className="text-xs text-[#2d4a35] font-semibold">Oversized back — please request a quote.</p>
              ) : printPrice !== null ? (
                <>
                  {selectedLocations.length > 1 && (
                    <div className="space-y-1 pb-2 border-b border-[#e2ece4]">
                      {selectedLocations.map((id) => {
                        const loc = PRINT_LOCATIONS.find((l) => l.id === id);
                        return (
                          <div key={id} className="flex justify-between text-xs text-[#6b7280]">
                            <span>{loc?.label ?? id}</span>
                            <span className="font-medium text-[#4a5568]">
                              {selectedMaterial === "embroidery" ? (() => {
                                const row = EMB_PRICES[id];
                                if (!row) return "—";
                                const tierIdx = EMB_TIERS.findIndex((t) => quantity >= t.min && quantity <= t.max);
                                const base = tierIdx >= 0 ? row[tierIdx] : row[row.length - 1];
                                return `$${(base * quantity).toFixed(2)}`;
                              })() : "included"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#6b7280]">
                      Print cost ({quantity} pcs{selectedLocations.length > 1 ? `, ${selectedLocations.length} locations` : ""})
                    </span>
                    <span className="text-lg font-bold text-[#1a2e1e]">${printPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8fa989] pt-1 border-t border-[#e2ece4]">
                    <span>Unit print price</span>
                    <span className="font-semibold text-[#4a7a58]">${(printPrice / quantity).toFixed(2)}/pc</span>
                  </div>
                  <p className="text-[10px] text-[#b0c4b5] pt-1">
                    * Garment cost is separate. Prices shown are for all {selectedLocations.length > 1 ? `${selectedLocations.length} selected locations` : "the selected location"} combined.
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#b0c4b5]">
                  {selectedLocations.length === 0
                    ? "Select a print location above to see pricing."
                    : selectedMaterial === "embroidery"
                      ? "Select a print location above to see embroidery pricing."
                      : "Select a method above to see pricing."}
                </p>
              )}
            </div>
          )}

          {!selectedMaterial && (
            <p className="text-xs text-[#b0c4b5] text-center">Select a print method above to see pricing</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 4 — DESIGN CUSTOMIZER
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-[#e2ece4] bg-white shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0] flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2d4a35] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">4</div>
          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">Design Your Product</p>
            <p className="text-[10px] text-[#8aaa90]">Upload a logo or add custom text · drag to reposition</p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col xl:flex-row gap-5 items-start">

            {/* ══ LEFT: Canvas ══ */}
            <div className="w-full xl:w-[480px] xl:sticky xl:top-[72px] flex-shrink-0">
              <div className="rounded-3xl border border-[#e2ece4] bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#2d4a35] flex items-center justify-center">
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1a2e1e]">Live Preview</p>
                      <p className="text-[10px] text-[#8aaa90]">Drag to reposition</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenPreview}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#1f3526] text-white text-xs font-semibold hover:bg-[#294832] transition-colors"
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>

                <div className="p-3 bg-[#f8faf9]">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE} height={CANVAS_SIZE}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={stopDrag}
                    onMouseLeave={stopDrag}
                    className="w-full h-auto rounded-2xl block border border-[#e2ece4]"
                    style={{ cursor: getCursor() }}
                  />
                </div>

                <div className="px-5 pb-5 pt-2 space-y-3 border-t border-[#edf4ef]">
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-[#6b7280] truncate max-w-[60%]">{name}</span>
                    <span className="font-bold text-[#1a2e1e]">${price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6b7280]">Quantity</span>
                    <div className="flex items-center rounded-xl border border-[#dde8df] bg-[#f8faf9] overflow-hidden">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className={cn(
                          "w-9 h-9 flex items-center justify-center transition-colors",
                          quantity <= 1 ? "text-[#c5d9ca] cursor-not-allowed" : "text-[#2d4a35] hover:bg-[#eef5f0]"
                        )}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[#1a2e1e] select-none">{quantity}</span>
                      <button
                        onClick={increaseQuantity}
                        className="w-9 h-9 flex items-center justify-center text-[#2d4a35] hover:bg-[#eef5f0] transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#edf4ef] space-y-1.5">
                    <div className="flex justify-between items-center text-sm text-[#6b7280]">
                      <span>Garment cost</span>
                      <span className="font-medium text-[#1a2e1e]">${(price * quantity).toFixed(2)}</span>
                    </div>
                    {printPrice !== null && !selectedLocations.includes("oversized") && (
                      <div className="flex justify-between items-center text-sm text-[#6b7280]">
                        <span>
                          Decoration
                          {selectedMaterial === "embroidery" && quantity <= 11
                            ? " (incl. $35 digitizing)"
                            : selectedLocations.length > 1
                            ? ` (${selectedLocations.length} locations)`
                            : ""}
                        </span>
                        <span className="font-medium text-[#1a2e1e]">${printPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedLocations.includes("oversized") && selectedMaterial === "embroidery" && (
                      <div className="flex justify-between items-center text-sm text-[#e05555]">
                        <span>Decoration (Oversized)</span>
                        <span className="font-medium">Quote required</span>
                      </div>
                    )}
                    {selectedMaterial === "screenprint" && quantity < 50 && (
                      <div className="text-[10px] text-amber-600 font-semibold">
                        ⚠ Screen print needs 50+ pcs
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-[#1a2e1e] pt-1.5 border-t border-[#edf4ef]">
                      <span className="text-sm">Estimated Total</span>
                      <span className="text-base">
                        {selectedLocations.includes("oversized") && selectedMaterial === "embroidery"
                          ? `$${(price * quantity).toFixed(2)} + quote`
                          : `$${(price * quantity + (printPrice ?? 0)).toFixed(2)}`}
                      </span>
                    </div>
                    {printPrice !== null && !selectedLocations.includes("oversized") && (
                      <p className="text-[10px] text-[#b0c4b5]">
                        ${(( price * quantity + printPrice) / quantity).toFixed(2)}/pc all-in · decoration only ${(printPrice / quantity).toFixed(2)}/pc
                      </p>
                    )}
                  </div>

                  {/* ── REQUIREMENTS BAR ── */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {REQUIREMENTS.map(({ key, label, done }) => (
                      <span
                        key={key}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all",
                          done
                            ? "bg-[#eaf3de] text-[#3b6d11] border-[#97c459]"
                            : showValidationShake
                              ? "bg-[#fdf0f0] text-[#e05555] border-[#f09595]"
                              : "bg-white text-[#8fa989] border-[#dde8df]"
                        )}
                      >
                        {done
                          ? <Check size={9} />
                          : <Circle size={9} className="opacity-50" />
                        }
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* ── VALIDATION ERROR MESSAGE ── */}
                  {validationError && (
                    <div className="flex items-start gap-2 bg-[#fdf0f0] border border-[#f5c5c5] rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="text-[#e05555] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#e05555] leading-relaxed">{validationError}</p>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    {/* ── ADD TO CART ── */}
                    <button
                      onClick={handleAddToCart}
                      className={cn(
                        "flex-1 h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                        showValidationShake && "animate-[shake_0.4s_ease-in-out]",
                        !allRequirementsMet
                          ? "bg-[#e8f0ea] text-[#8fa989] cursor-not-allowed"
                          : inCart
                            ? "bg-[#e8f0ea] text-[#4a7a58] border border-[#c5d9ca]"
                            : "bg-[#1f3526] text-white hover:bg-[#294832] shadow-md shadow-[#1f3526]/20"
                      )}
                    >
                      <ShoppingCart size={15} />
                      {inCart ? "Added to Cart" : "Add to Cart"}
                    </button>

                    <button
                      onClick={handleWishlist}
                      disabled={wishlistLoading}
                      title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                      className={cn(
                        "w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-all duration-200",
                        wishlistLoading ? "opacity-50 cursor-not-allowed border-[#e2ece4]"
                          : inWishlist ? "border-[#f5c5c5] bg-[#fdf0f0] hover:bg-[#fde8e8]"
                            : "border-[#dde8df] hover:border-[#f5c5c5] hover:bg-[#fdf0f0]"
                      )}
                    >
                      {wishlistLoading
                        ? <Loader2 size={15} className="animate-spin text-[#8fa989]" />
                        : <Heart
                          size={15}
                          fill={inWishlist ? "#e05555" : "none"}
                          className={inWishlist ? "text-[#e05555]" : "text-[#7a9882]"}
                        />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── AddToCartModal ── */}
            <AddToCartModal
              open={showCartModal}
              onClose={() => setShowCartModal(false)}
              productId={productId}
              variantId={variantId}
              price={price}
              name={name}
              initialQuantity={quantity}
              customization={customizationJson}
              canvasBlob={canvasBlob}
              onSuccess={() => { setInCart(true); refreshCart(); onReload?.(); }}
            />

            {/* ══ RIGHT: Controls ══ */}
            <div className="flex-1 min-w-0">
              <div className="rounded-3xl border border-[#e2ece4] bg-white overflow-hidden shadow-sm">
                <div className="flex border-b border-[#edf4ef]">
                  {([
                    { key: "image", icon: ImageIcon, label: "Upload Image" },
                    { key: "text", icon: Type, label: "Custom Text" },
                  ] as const).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => { if (requireLogin()) return; setActiveTab(key); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold transition-all border-b-2",
                        activeTab === key
                          ? "text-[#2d4a35] border-[#2d4a35] bg-[#f4f9f5]"
                          : "text-[#8fa989] border-transparent hover:bg-[#f8fbf9]"
                      )}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-5">

                  {/* ══ IMAGE TAB ══ */}
                  {activeTab === "image" && (
                    <div className="space-y-5">
                      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                      {!logoImg ? (
                        <div
                          onClick={() => { if (requireLogin()) return; fileRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[#c5d9ca] cursor-pointer hover:border-[#2d4a35] hover:bg-[#f4f9f5] transition-all group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-[#e8f0ea] flex items-center justify-center group-hover:bg-[#d5e8d8] transition-colors">
                            <Upload size={22} className="text-[#2d4a35]" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-[#2d4a35] text-sm">Click to upload logo</p>
                            <p className="text-xs text-[#8fa989] mt-0.5">PNG, JPG, SVG — max 10MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[#e2ece4] overflow-hidden">
                          <div className="flex items-center gap-3 p-3 bg-[#f4f9f5] border-b border-[#e2ece4]">
                            <div className="w-12 h-12 rounded-xl border border-[#dde8df] bg-white overflow-hidden flex-shrink-0">
                              <img src={logoSrc!} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#2d4a35]">Logo uploaded</p>
                              <p className="text-[10px] text-[#8fa989]">Drag on canvas to reposition</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => fileRef.current?.click()}
                                className="w-8 h-8 rounded-lg border border-[#dde8df] flex items-center justify-center hover:bg-white transition-colors text-[#6b8070]"
                              >
                                <Upload size={13} />
                              </button>
                              <button
                                onClick={() => { setLogoSrc(null); setLogoImg(null); }}
                                className="w-8 h-8 rounded-lg border border-[#f5c5c5] flex items-center justify-center hover:bg-[#fdf0f0] transition-colors text-[#e05555]"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 space-y-4">
                            <Slider label="Size" value={logoSize} min={40} max={280} unit="px" onChange={setLogoSize} />
                            <Slider label="Rotation" value={logoRotation} min={0} max={360} unit="°" onChange={setLogoRotation} />
                            <Slider label="Opacity" value={Math.round(logoOpacity * 100)} min={10} max={100} unit="%" onChange={(v) => setLogoOpacity(v / 100)} />
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => setLogoRotation((p) => (p - 15 + 360) % 360)}
                                className="flex-1 h-9 rounded-xl border border-[#dde8df] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4a7a58] hover:bg-[#f4f9f5] transition-colors"
                              >
                                <RotateCcw size={13} /> Rotate Left
                              </button>
                              <button
                                onClick={() => setLogoRotation((p) => (p + 15) % 360)}
                                className="flex-1 h-9 rounded-xl border border-[#dde8df] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4a7a58] hover:bg-[#f4f9f5] transition-colors"
                              >
                                <RotateCw size={13} /> Rotate Right
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══ TEXT TAB ══ */}
                  {activeTab === "text" && (
                    <div className="space-y-5">
                      <div>
                        <SectionLabel>Your Text</SectionLabel>
                        <input
                          type="text" value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Type something..."
                          className="w-full h-11 rounded-xl border border-[#dde8df] px-4 text-sm outline-none focus:ring-2 focus:ring-[#2d4a35] focus:border-transparent transition-all bg-[#f8fbf9]"
                        />
                      </div>

                      <Divider />

                      <div>
                        <SectionLabel>Font Family</SectionLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {FONTS.map((f) => (
                            <button
                              key={f.value}
                              onClick={() => setFontFamily(f.value)}
                              style={{ fontFamily: f.value }}
                              className={cn(
                                "h-10 rounded-xl border text-sm transition-all px-3 text-left truncate",
                                fontFamily === f.value
                                  ? "border-[#2d4a35] bg-[#f4f9f5] text-[#2d4a35] font-semibold"
                                  : "border-[#e2ece4] text-[#4a5568] hover:border-[#c5d9ca] hover:bg-[#f8fbf9]"
                              )}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Divider />

                      <div>
                        <SectionLabel>Style</SectionLabel>
                        <div className="flex gap-2">
                          {([
                            { key: "bold", label: "B", active: textBold, toggle: () => setTextBold((p) => !p), style: "font-bold" },
                            { key: "italic", label: "I", active: textItalic, toggle: () => setTextItalic((p) => !p), style: "italic" },
                            { key: "shadow", label: "Sh", active: textShadow, toggle: () => setTextShadow((p) => !p), style: "" },
                          ] as const).map(({ key, label, active, toggle, style }) => (
                            <button
                              key={key}
                              onClick={toggle}
                              className={cn(
                                "w-10 h-10 rounded-xl border text-sm transition-all", style,
                                active
                                  ? "border-[#2d4a35] bg-[#2d4a35] text-white"
                                  : "border-[#e2ece4] text-[#4a5568] hover:border-[#c5d9ca]"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Divider />

                      <div>
                        <SectionLabel>Text Color</SectionLabel>
                        <div className="flex items-center gap-2.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setTextColor(c)}
                              style={{ background: c }}
                              className={cn(
                                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0",
                                textColor === c ? "border-[#2d4a35] scale-110" : "border-white shadow-sm"
                              )}
                            />
                          ))}
                          <div className="relative ml-auto">
                            <input
                              type="color" value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-8 h-8 rounded-xl border border-[#dde8df] cursor-pointer p-0.5 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <Divider />

                      <div className="space-y-4">
                        <SectionLabel>Adjustments</SectionLabel>
                        <Slider label="Font Size" value={textSize} min={12} max={96} unit="px" onChange={setTextSize} />
                        <Slider label="Rotation" value={textRotation} min={0} max={360} unit="°" onChange={setTextRotation} />
                        <Slider label="Opacity" value={Math.round(textOpacity * 100)} min={10} max={100} unit="%" onChange={(v) => setTextOpacity(v / 100)} />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setTextRotation((p) => (p - 15 + 360) % 360)}
                          className="flex-1 h-9 rounded-xl border border-[#dde8df] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4a7a58] hover:bg-[#f4f9f5] transition-colors"
                        >
                          <RotateCcw size={13} /> Rotate Left
                        </button>
                        <button
                          onClick={() => setTextRotation((p) => (p + 15) % 360)}
                          className="flex-1 h-9 rounded-xl border border-[#dde8df] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4a7a58] hover:bg-[#f4f9f5] transition-colors"
                        >
                          <RotateCw size={13} /> Rotate Right
                        </button>
                      </div>

                      {customText.trim() && (
                        <div className="rounded-xl border border-[#e2ece4] p-3 bg-[#f8fbf9]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8fa989] mb-2">Preview</p>
                          <p style={{
                            fontFamily,
                            fontSize: Math.min(textSize, 28),
                            color: textColor,
                            fontWeight: textBold ? 700 : 400,
                            fontStyle: textItalic ? "italic" : "normal",
                            textShadow: textShadow ? "2px 2px 4px rgba(0,0,0,0.3)" : "none",
                            opacity: textOpacity,
                            lineHeight: 1.3,
                            wordBreak: "break-all",
                          }}>
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

      {/* ── Shake keyframe ── */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
    </>
  );
}