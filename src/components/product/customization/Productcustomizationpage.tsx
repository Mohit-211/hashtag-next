"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Circle, X, ChevronDown, ChevronUp, Table2,
  Upload, RotateCw, RotateCcw, Download, Sparkles, Eye, ImageDown,
  AlertCircle, Loader2, Plus, Minus, Type, Image as ImageIcon,
  Trash2, ShoppingCart, Heart, Zap, Package,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductVariantByIdApi, ProductDetailApi } from "@/api/operations/product.api";
import AddToCartModal from "@/components/common/AddToCartModal";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import SageQuantityPricing, { getSageUnitPriceWithMarkup, parseSageMeta } from "./Sagequantitypricing";
import AddProductConfigurationModal from "../Addproductconfigurationmodal/Addproductconfigurationmodal";
import { calculateVariantTotal, sumVariantTotals, formatMoney } from "./pricing";
/* ─────────────────────────────────────────── Types ── */
interface Size { id: number; name: string; measurements?: string }
interface VariantImage { id: number; file_name: string; file_uri: string; is_primary: boolean }
interface Variant {
  id: number;
  product_id: number;
  sku: string;
  color: string;
  color_code: string;
  size: string | null;
  size_id: number | null;
  price: number;
  case_price: string;
  original_price?: number | string;
  stock: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  is_active: boolean;
  supplier: string;
  meta: string | null;
  images: VariantImage[];
  size_details: Size | null;
  product: {
    brand: null;
    id: number;
    name: string;
    description?: string;
    brand_id?: number | null;
    attachments: any[];
    categories: any[];
    meta: string | null;
  };
}
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  attachments: any[];
  categories: any[];
  brand?: any;
  images: VariantImage[];
  variants: Variant[];
  product: any;
}
/* ── Configured-variant types (multi-variant cart configuration) ── */
export interface ConfiguredSize {
  variant_id: number;
  size_id: number | null;
  size: string;
  quantity: number;
  /** Product/variant price ONLY — decoration is never folded in here. */
  unit_price: number;
  /** Decoration price per unit for THIS size/variant — NEVER includes the
   *  flat digitizing fee. 0 when no decoration was selected or the
   *  configuration step was skipped. Captured once, at the moment the
   *  line is created, and travels with the line — never re-derived later
   *  from live page-level state. */
  decoration_unit_price: number;
  /** ★ NEW — flat, one-time fee (e.g. embroidery digitizing fee at
   *  qty <= 11). Always a flat dollar amount, NEVER multiplied by
   *  quantity and NEVER folded into decoration_unit_price. This was
   *  previously smeared into decoration_unit_price on one code path and
   *  silently dropped on another, causing the total shown on the
   *  customization page to disagree with the total shown in the
   *  Add-to-Cart modal for the exact same order. */
  digitizing_fee: number;
}
export interface ConfiguredVariant {
  variantId: number;
  variantName: string; // color name, used as the unique key
  color: string;
  colorCode: string;
  images: VariantImage[];
  sizes: ConfiguredSize[];
  totalQty: number;
  /** productTotal + decorationTotal + digitizingFeeTotal, computed via
   *  calculateVariantTotal/sumVariantTotals + a flat fee sum — never
   *  derived ad hoc. */
  totalPrice: number;
  /** Σ(unit_price × quantity) across this variant's sizes. */
  productTotal: number;
  /** Σ(decoration_unit_price × quantity) across this variant's sizes. */
  decorationTotal: number;
  /** ★ NEW — Σ(digitizing_fee) across this variant's sizes. Flat sum,
   *  NOT multiplied by quantity. */
  digitizingFeeTotal: number;
}
/* ─────────────────────────────────────────── Constants ── */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const CANVAS_SIZE = 500;
const PROMO_MIN_QTY = 100; // ← DEFAULT fallback floor, only used when a
// Promo product supplies NEITHER a usable qtyTiers[0] in its SAGE meta NOR
// its own min_order_quantity. Per-product minimum should come from the
// product's own data (see getPromoMinQty below) — this is not a global
// floor applied to every Promo product regardless of its actual meta.
type MaterialId = "embroidery" | "dtf" | "screen_print" | "dtg";
const MATERIALS = [
  { id: "embroidery" as MaterialId, label: "Embroidery", desc: "Premium thread-stitched branding", bestFor: "Polos, jackets, uniforms", badge: "All Fabrics", emoji: "🧵" },
  { id: "dtf" as MaterialId, label: "DTF Print", desc: "Full-color Direct-to-Film transfers", bestFor: "Small runs, multi-color logos", badge: "No Minimum", emoji: "🖨️" },
  { id: "screen_print" as MaterialId, label: "Screen Print", desc: "Bold solid colors for bulk orders", bestFor: "Tees, hoodies, bulk orders", badge: "Min 12 pcs", emoji: "🎨" },
  { id: "dtg" as MaterialId, label: "DTG Print", desc: "Photo-quality prints on cotton", bestFor: "100% cotton tees", badge: "No Minimum", emoji: "👕" },
];
type GarmentType = "tshirt" | "hoodie" | "hat" | "polo";
interface GarmentView {
  key: string; label: string; mockup: string;
  hotspots: { id: string; label: string; top: string; left: string }[];
}
const GARMENT_VIEWS: Record<GarmentType, GarmentView[]> = {
  tshirt: [
    {
      key: "FRONT", label: "Front", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411998.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "35%", left: "60%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "35%", left: "32%" },
        { id: "FULL_FRONT", label: "Full Front", top: "53%", left: "46%" },
      ]
    },
    {
      key: "BACK", label: "Back", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411965.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "44%", left: "50%" }]
    },
    {
      key: "LEFT_SLEEVE", label: "Left Sleeve", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452412048.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "L. Sleeve", top: "33%", left: "31%" }]
    },
    {
      key: "RIGHT_SLEEVE", label: "Right Sleeve", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452412026.png",
      hotspots: [{ id: "SLEEVE_RIGHT", label: "R. Sleeve", top: "33%", left: "65%" }]
    },
  ],
  hoodie: [
    {
      key: "FRONT", label: "Front", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411478.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "45%", left: "65%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "45%", left: "32%" },
        { id: "FULL_FRONT", label: "Full Front", top: "58%", left: "49%" },
      ]
    },
    {
      key: "BACK", label: "Back", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411445.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "45%", left: "52%" }]
    },
    {
      key: "SIDE", label: "Side", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411607.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "Sleeve", top: "50%", left: "63%" }]
    },
  ],
  hat: [
    {
      key: "FRONT", label: "Front", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786454859546.png",
      hotspots: [{ id: "HAT_FRONT", label: "Front", top: "40%", left: "50%" }]
    },
    {
      key: "BACK", label: "Back", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411444.png",
      hotspots: [{ id: "HAT_BACK_ARCH", label: "Back Arch", top: "35%", left: "50%" }]
    },
    {
      key: "SIDE", label: "Side", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786454859566.png",
      hotspots: [{ id: "HAT_SIDE", label: "Side", top: "40%", left: "27%" }]
    },
  ],
  polo: [
    {
      key: "FRONT", label: "Front", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411799.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "38%", left: "70%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "38%", left: "32%" },
        { id: "FULL_FRONT", label: "Full Front", top: "51%", left: "52%" },
      ]
    },
    {
      key: "BACK", label: "Back", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411692.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "44%", left: "50%" }]
    },
    {
      key: "SIDE", label: "Side", mockup: "https://node.hashtagbillionaire.com/images/variant_images-1786452411898.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "Sleeve", top: "32%", left: "70%" }]
    },
  ],
};
const ALL_PRINT_LOCATIONS = [
  { id: "LEFT_CHEST", label: "Left Chest" },
  { id: "RIGHT_CHEST", label: "Right Chest" },
  { id: "FULL_FRONT", label: "Full Front" },
  { id: "FULL_BACK", label: "Full Back" },
  { id: "SLEEVE_LEFT", label: "Left Sleeve" },
  { id: "SLEEVE_RIGHT", label: "Right Sleeve" },
  { id: "HAT_FRONT", label: "Hat Front" },
  { id: "HAT_SIDE", label: "Hat Side" },
  { id: "HAT_BACK_ARCH", label: "Hat Back (Arch)" },
];
const EMB_TIERS = [
  { label: "1–11", min: 1, max: 11 },
  { label: "12–23", min: 12, max: 23 },
  { label: "24–35", min: 24, max: 35 },
  { label: "36–71", min: 36, max: 71 },
  { label: "72–95", min: 72, max: 95 },
  { label: "96–143", min: 96, max: 143 },
  { label: "144+", min: 144, max: Infinity },
];
const EMB_PRICES: Record<string, number[]> = {
  LEFT_CHEST: [12, 11, 10, 9, 8, 7, 6],
  RIGHT_CHEST: [12, 11, 10, 9, 8, 7, 6],
  SLEEVE_LEFT: [12, 11, 10, 9, 8, 7, 6],
  SLEEVE_RIGHT: [12, 11, 10, 9, 8, 7, 6],
  FULL_FRONT: [18, 16, 14, 13, 12, 11, 10],
  FULL_BACK: [18, 16, 14, 13, 12, 11, 10],
  HAT_FRONT: [15, 14, 12, 11, 10, 9, 8],
  HAT_SIDE: [10, 9, 8, 7, 6, 5, 5],
  HAT_BACK_ARCH: [10, 9, 8, 7, 6, 5, 5],
};
const DTF_TIERS = [1, 12, 24, 36, 72, 96, 144];
const DTF_PRICES = [15, 12, 10, 9, 7, 5, 5];
const SP_PRICES: Record<string, number[]> = {
  "1 Color": [11.19, 7.46, 4.85, 3.36, 2.24, 1.87],
  "2 Color": [22.39, 11.19, 7.09, 5.22, 3.36, 3.21],
  "3 Color": [37.31, 14.93, 9.33, 7.46, 4.48, 4.25],
  "4 Color": [52.24, 26.87, 11.19, 10.07, 5.60, 5.37],
  "5 Color": [67.16, 32.84, 14.93, 11.57, 6.72, 6.49],
  "6 Color": [82.09, 37.31, 17.16, 13.06, 8.58, 7.61],
};
/** Number-of-colours options for Screen Print — derived from SP_PRICES so
 *  adding/removing a colour tier there automatically updates the picker. */
export type SpColorCount = keyof typeof SP_PRICES;
const SP_COLOR_COUNTS = Object.keys(SP_PRICES) as SpColorCount[];
/** Screen Print quantity tiers — order/count must match each SP_PRICES row.
 *  Single source of truth for the min order qty, the price-index lookup,
 *  and the "View Full Price Table" headers. */
const SP_TIERS = [
  { label: "12–23", min: 12 },
  { label: "24–47", min: 24 },
  { label: "48–99", min: 48 },
  { label: "100–299", min: 100 },
  { label: "300–499", min: 300 },
  { label: "500+", min: 500 },
];
const SP_MIN_QTY = SP_TIERS[0].min;
const DTG_TIERS = [{ min: 1 }, { min: 24 }, { min: 48 }, { min: 100 }];
const DTG_PRICES: Record<string, number[]> = {
  "Front Regular": [15, 12, 11, 9],
  "Oversized": [20, 17, 16, 14],
  "Front & Back Regular": [30, 24, 22, 18],
  "Front & Back Oversized": [40, 34, 32, 28],
};
/* ── Pure, exported print-pricing logic — single source of truth for
   print/decoration pricing. Used by the main page AND by
   AddProductConfigurationModal, so every screen prices identically. ── */
export function getMaterialPrintTotal(
  material: MaterialId | null,
  locations: string[],
  qty: number,
  spColorCount: SpColorCount = "1 Color",
  dtgStyle: keyof typeof DTG_PRICES = "Front Regular"
): number | null {
  if (!material) return null;
  if (locations.length === 0) return null;
  if (qty <= 0) return null;
  switch (material) {
    case "embroidery": {
      const tierIndex = EMB_TIERS.findIndex(t => qty >= t.min && qty <= t.max);
      let total = 0;
      locations.forEach(location => {
        const row = EMB_PRICES[location];
        if (!row) return;
        total += row[tierIndex] * qty;
      });
      if (qty <= 11) total += 35;
      return total;
    }
    case "dtf": {
      const tier =
        qty >= 144 ? 6 :
          qty >= 96 ? 5 :
            qty >= 72 ? 4 :
              qty >= 36 ? 3 :
                qty >= 24 ? 2 :
                  qty >= 12 ? 1 : 0;
      return DTF_PRICES[tier] * qty * locations.length;
    }
  case "screen_print": {
  if (qty < SP_MIN_QTY) return null;

  const priceIndex = SP_TIERS.reduce((found, t, idx) => (qty >= t.min ? idx : found), 0);
  const price = SP_PRICES[spColorCount]?.[priceIndex];

  if (price == null) return null;

  return price * qty * locations.length;
}
    case "dtg": {
      const tier =
        qty >= 100 ? 3 :
          qty >= 48 ? 2 :
            qty >= 24 ? 1 : 0;
      return DTG_PRICES[dtgStyle][tier] * qty;
    }
    default:
      return null;
  }
}
/* ── Pure, exported digitizing-fee rule so every consumer (main page,
   modal, cart modal) applies the exact same one-time embroidery fee. ── */
export function getDigitizingFee(material: MaterialId | null, qty: number): number {
  return material === "embroidery" && qty > 0 && qty <= 11 ? 35 : 0;
}
const FONTS = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, sans-serif" },
];
const PRESET_COLORS = ["#1a1a1a", "#ffffff", "#F5C400", "#e05555", "#2d7dd2", "#f5a623", "#9b59b6", "#1abc9c"];
const COLOR_NAME_FALLBACKS: Record<string, string> = {
  black: "#1a1a1a", white: "#ffffff", "heather grey": "#a6a6a6", "heather gray": "#a6a6a6",
  grey: "#808080", gray: "#808080", charcoal: "#36454f", navy: "#001f3f",
  royal: "#4169e1", "royal blue": "#4169e1", red: "#d9534f", maroon: "#800000",
  burgundy: "#6d071a", kelly: "#4cbb17", "kelly green": "#4cbb17", forest: "#228b22",
  green: "#2e8b57", orange: "#ff8c00", yellow: "#f5d800", gold: "#d4af37",
  purple: "#6a0dad", pink: "#ff69b4", teal: "#008080", sand: "#c2b280",
  khaki: "#c3b091", brown: "#5b3a29", tan: "#d2b48c",
};
/* ─────────────────────────────────────────── Helpers ── */
const toBase64ViaSameOrigin = async (url: string): Promise<string> => {
  try {
    const r = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!r.ok) throw new Error("proxy failed");
    const blob = await r.blob();
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  } catch { return url; }
};
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    // Cache-busting query params only make sense for real URLs — appending
    // one to a data: URI corrupts the base64 payload and breaks decoding.
    img.src = src.startsWith("data:")
      ? src
      : src.includes("?") ? `${src}&_cb=${Date.now()}` : `${src}?_cb=${Date.now()}`;
  });

const isValidCssColor = (value: string): boolean => {
  if (!value) return false;
  if (typeof window === "undefined" || typeof CSS === "undefined" || !CSS.supports) return true;
  try { return CSS.supports("color", value); } catch { return false; }
};
const resolveColorToken = (raw: string): string => {
  const trimmed = raw?.trim() ?? "";
  if (isValidCssColor(trimmed)) return trimmed;
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (isValidCssColor(hex)) return hex;
  return COLOR_NAME_FALLBACKS[trimmed.toLowerCase()] ?? "#d1d5db";
};
const getVariantPrice = (v?: { price?: number | string } | null): number => {
  if (!v) return 0;
  if (v.price !== undefined && v.price !== null && v.price !== "") {
    const n = Number(v.price);
    if (!Number.isNaN(n)) return n;
  }
  return Number(v.price ?? 0);
};
export const getPromoMinQty = (
  metaStr?: string | null,
  minOrderQuantity?: number | null
): number => {
  const meta = parseSageMeta(metaStr ?? null);
  const qtyTiers = ((meta as any)?.qtyTiers ?? [])
    .filter(
      (qty: any) =>
        qty !== null &&
        qty !== undefined &&
        qty !== "" &&
        Number(qty) > 0
    )
    .map((qty: any) => Number(qty));
  if (qtyTiers.length > 0) {
    return qtyTiers[0];
  }
  if (minOrderQuantity && minOrderQuantity > 0) {
    return minOrderQuantity;
  }
  return PROMO_MIN_QTY;
};
function drawCanvas({
  ctx, size, productImg, logo, logoPos, logoSize, logoRotation, logoOpacity,
  text, textPos, textSize, textColor, textRotation, fontFamily,
  textBold, textItalic, textShadow, textOpacity,
}: any) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  if (productImg) {
    const scale = Math.min(size / productImg.naturalWidth, size / productImg.naturalHeight);
    const dw = productImg.naturalWidth * scale;
    const dh = productImg.naturalHeight * scale;
    ctx.drawImage(productImg, (size - dw) / 2, (size - dh) / 2, dw, dh);
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
  if (text?.trim()) {
    ctx.save();
    ctx.globalAlpha = textOpacity;
    ctx.font = `${textItalic ? "italic" : "normal"} ${textBold ? "bold" : "normal"} ${textSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    if (textShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    }
    const tw = ctx.measureText(text).width;
    ctx.translate(textPos.x + tw / 2, textPos.y - textSize / 2);
    ctx.rotate((textRotation * Math.PI) / 180);
    ctx.fillText(text, -tw / 2, textSize / 2);
    ctx.restore();
  }
}
/* ─────────────────────────────────────────── Sub-components ── */
function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0",
      done ? "bg-[#F5D800] text-black" : "bg-gray-900 text-white"
    )}>
      {done ? <Check size={14} /> : n}
    </div>
  );
}
function SectionCard({ step, title, subtitle, status, children }: {
  step: number; title: string; subtitle: string;
  status: "required" | "done" | "optional"; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <StepBadge n={step} done={status === "done"} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {status === "required" && (
          <span className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">Required</span>
        )}
        {status === "optional" && (
          <span className="text-[11px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">Optional</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Slider({ label, value, min, max, step = 1, unit = "", onChange }: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs font-bold text-[#F5D800] bg-[#F5D800]/10 px-2 py-0.5 rounded-md">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
        style={{ accentColor: "#F5D800" }}
      />
    </div>
  );
}
/* ─────────────────────────────────────────── Main Component ── */
interface Props { productDataId: number; variantDataId: number }
const CUSTOMIZATION_SESSION_KEY = "pendingCustomization";
export default function ProductCustomizationPage({ productDataId, variantDataId }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!localStorage.getItem("hastagBillionaire");
  const [variantData, setVariantData] = useState<Variant | null>(null);
  const [allProductVariants, setAllProductVariants] = useState<Variant[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasBlobRef = useRef<Blob | null>(null);
  const lastMaterialFloorRef = useRef<number>(1);
  const isRestoringSessionRef = useRef(false);
  const hasAttemptedRestoreRef = useRef(false);
  const [restorePending, setRestorePending] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !mounted || !isLoggedIn) return;
    try {
      if (sessionStorage.getItem(CUSTOMIZATION_SESSION_KEY)) {
        setRestorePending(true);
      }
    } catch (e) {
      console?.error("Failed to check for saved customization:", e);
    }
  }, [mounted, isLoggedIn]);
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await ProductVariantByIdApi(String(variantDataId));
      const variantRaw: Variant = res?.data?.data;
      if (!variantRaw) { setProduct(null); setVariantData(null); return; }
      setVariantData(variantRaw);
      const productRaw = variantRaw.product ?? {};
      const mapped: Product = {
        id: String(productRaw.id ?? variantRaw.product_id),
        name: productRaw.name ?? "",
        price: getVariantPrice(variantRaw),
        image: variantRaw.images?.[0]?.file_uri ?? "",
        description: productRaw.description ?? "",
        attachments: productRaw.attachments ?? [],
        categories: productRaw.categories ?? [],
        brand: productRaw?.brand ?? null,
        images: variantRaw.images ?? [],
        variants: [variantRaw],
        product: productRaw,
      };
      setProduct(mapped);
    } catch (e) {
      console?.error(e);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (variantDataId) fetchProduct();
    if (productDataId) fetchProductVariants();
  }, [variantDataId, productDataId]);
  const fetchProductVariants = async () => {
    try {
      const res = await ProductDetailApi(String(productDataId));
      const variants = res?.data?.data?.variants || [];
      setAllProductVariants(variants);
      const sizes = variants
        .filter((v: any) => v.size_details)
        .map((v: any) => v.size_details)
        .filter(
          (size: any, index: number, self: any[]) =>
            index === self.findIndex((s) => s.id === size.id)
        );
      setAllSizes(sizes);
    } catch (err) {
      console.error("Failed to fetch product variants:", err);
    }
  };
  const grandCategoryTitle = useMemo((): string => {
    if (!product) return "";
    for (const cat of product.product?.categories ?? []) {
      for (const parent of cat.parent_categories ?? []) {
        for (const grand of parent.grand_categories ?? []) {
          if (grand.title) return grand.title as string;
        }
      }
    }
    return "";
  }, [product]);
  const isApparel = grandCategoryTitle === "Apparel & Uniforms";
  const isPreMade = grandCategoryTitle === "Pre-Made";
  const isPromo = !isApparel && !isPreMade;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const saveCustomizationToSession = () => {
    if (typeof window === "undefined") return;
    try {
      const snapshot = {
        productDataId,
        variantDataId,
        selectedColor,
        variantQty: variantQtyRef.current,
        selectedLocations,
        selectedMaterial,
        spColorCount,
        dtgStyle,
        customText,
        textSize,
        textColor,
        textRotation,
        fontFamily,
        textBold,
        textItalic,
        textShadow,
        textOpacity,
        textPos,
        logoSrc,
        logoSize,
        logoRotation,
        logoOpacity,
        logoPos,
        configuredVariants,
        orderRows: orderRowsRef.current,
        returnTo: window.location.pathname + window.location.search,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(CUSTOMIZATION_SESSION_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console?.error("Failed to save customization to session:", e);
    }
  };
  const requireLogin = () => {
    if (!isLoggedIn) {
      saveCustomizationToSession();
      setShowLoginModal(true);
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (!mounted || !isLoggedIn || !product || loading) return;
    if (hasAttemptedRestoreRef.current) return;
    if (allProductVariants.length === 0) return;
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(CUSTOMIZATION_SESSION_KEY);
    } catch (e) {
      console?.error("Failed to read saved customization:", e);
    }
    if (!raw) {
      hasAttemptedRestoreRef.current = true;
      setRestorePending(false);
      return;
    }
    hasAttemptedRestoreRef.current = true;
    try {
      const saved = JSON.parse(raw);
      if (Number(saved.productDataId) !== Number(productDataId)) {
        sessionStorage.removeItem(CUSTOMIZATION_SESSION_KEY);
        setRestorePending(false);
        return;
      }
      if (saved.savedAt && Date.now() - saved.savedAt > 30 * 60 * 1000) {
        sessionStorage.removeItem(CUSTOMIZATION_SESSION_KEY);
        setRestorePending(false);
        return;
      }
      // Only arm the "restoring" guard when selectedColor is actually about
      // to change — the guard is disarmed by the [selectedColor] effect
      // below, which only re-fires when the value changes. If the saved
      // color already matches the page's default color, that effect never
      // re-runs, so the ref would stay stuck `true` forever, silently
      // blocking every future color-change qty reset (including for Sage
      // promo products, where switching colors afterwards would then leave
      // variantQty/currentQty un-initialized for the new variant).
      if (saved.selectedColor && saved.selectedColor !== selectedColor) {
        isRestoringSessionRef.current = true;
        setSelectedColor(saved.selectedColor);
      }
      if (saved.variantQty && Object.keys(saved.variantQty).length > 0) {
        variantQtyRef.current = saved.variantQty;
        setVariantQty(saved.variantQty);
      }
      if (Array.isArray(saved.selectedLocations)) setSelectedLocations(saved.selectedLocations);
      if (saved.selectedMaterial) {
        setSelectedMaterial(saved.selectedMaterial);
        lastMaterialFloorRef.current = getMaterialFloor(saved.selectedMaterial);
      }
      if (saved.spColorCount) setSpColorCount(saved.spColorCount);
      if (saved.dtgStyle) setDtgStyle(saved.dtgStyle);
      if (saved.customText) setCustomText(saved.customText);
      if (saved.textSize) setTextSize(saved.textSize);
      if (saved.textColor) setTextColor(saved.textColor);
      if (saved.textRotation !== undefined) setTextRotation(saved.textRotation);
      if (saved.fontFamily) setFontFamily(saved.fontFamily);
      if (saved.textBold !== undefined) setTextBold(saved.textBold);
      if (saved.textItalic !== undefined) setTextItalic(saved.textItalic);
      if (saved.textShadow !== undefined) setTextShadow(saved.textShadow);
      if (saved.textOpacity !== undefined) setTextOpacity(saved.textOpacity);
      if (saved.textPos) setTextPos(saved.textPos);
      if (saved.logoSrc) setLogoSrc(saved.logoSrc);
      if (saved.logoSize) setLogoSize(saved.logoSize);
      if (saved.logoRotation !== undefined) setLogoRotation(saved.logoRotation);
      if (saved.logoOpacity !== undefined) setLogoOpacity(saved.logoOpacity);
      if (saved.logoPos) setLogoPos(saved.logoPos);
      if (Array.isArray(saved.configuredVariants)) setConfiguredVariants(saved.configuredVariants);
      if (Array.isArray(saved.orderRows) && saved.orderRows.length > 0) {
        const variantsSource = allProductVariants.length > 0 ? allProductVariants : product.variants;
        const revalidated = saved.orderRows
          .map((r: OrderRow) => {
            const v = variantsSource.find(vv => vv.id === r.variantId && vv.color === r.color);
            if (!v) return null;
            const min = Math.max(1, v.min_order_quantity || 1);
            return { ...r, qty: Math.max(r.qty, min) };
          })
          .filter((r: OrderRow | null): r is OrderRow => r !== null);
        setOrderRows(revalidated.length > 0 ? revalidated : [{ id: Date.now(), color: "", qty: 1, variantId: "" }]);
      }
      setSageRemountKey(k => k + 1);
      sessionStorage.removeItem(CUSTOMIZATION_SESSION_KEY);
      setRestorePending(false);
    } catch (e) {
      console?.error("Failed to restore saved customization:", e);
      try { sessionStorage.removeItem(CUSTOMIZATION_SESSION_KEY); } catch { }
      setRestorePending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isLoggedIn, product, loading, productDataId, allProductVariants]);
  const grandCategory = useMemo((): string => {
    if (!product) return "";
    return (
      (product.product?.categories ?? [])
        .flatMap((c: any) => c.parent_categories ?? [])
        .flatMap((p: any) => p.grand_categories ?? [])
        .map((g: any) => g.title?.toLowerCase().trim())
        .find(Boolean) ?? ""
    );
  }, [product]);
  const parentCategory = useMemo((): string => {
    if (!product) return "";
    return (
      (product.product?.categories ?? [])
        .flatMap((c: any) => c.parent_categories ?? [])
        .map((p: any) => p.title?.toLowerCase().trim())
        .find(Boolean) ?? ""
    );
  }, [product]);
  const garmentType = useMemo<GarmentType>(() => {
    const cat = grandCategory.toLowerCase();
    if (cat.includes("apparel") || cat.includes("uniform") || cat === "clothing") {
      const parent = parentCategory.toLowerCase();
      if (parent.includes("hoodie") || parent.includes("sweatshirt")) return "hoodie";
      if (parent.includes("hat") || parent.includes("cap") || parent.includes("headwear")) return "hat";
      if (parent.includes("polo")) return "polo";
      return "tshirt";
    }
    return "tshirt";
  }, [grandCategory, parentCategory]);
  const garmentViews = useMemo(() => GARMENT_VIEWS[garmentType], [garmentType]);
  const [activeViewIdx, setActiveViewIdx] = useState(0);
  const activeView = garmentViews[activeViewIdx] ?? garmentViews[0];
  useEffect(() => { setActiveViewIdx(0); }, [garmentType]);
  const [selectedColor, setSelectedColor] = useState("");
  const colors = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, string>();
    const source = allProductVariants.length > 0 ? allProductVariants : product.variants;
    source.forEach(v => {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, resolveColorToken(v.color_code || v.color));
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product, allProductVariants]);
  useEffect(() => {
    if (isRestoringSessionRef.current) return;
    if (!selectedColor) {
      const first = variantData?.color || product?.variants?.[0]?.color;
      if (first) setSelectedColor(first);
    }
  }, [variantData, product]);
  useEffect(() => {
    if (isRestoringSessionRef.current) {
      isRestoringSessionRef.current = false;
      return;
    }
    setProductImg(null);
    setLogoPos({ x: 190, y: 190 });
    setJustStagedVariantIds([]);
    if (activeVariant) {
      const floor = isPromo
        ? promoMinQty
        : isApparel
          ? getMaterialFloor(selectedMaterial)
          : Math.max(1, activeVariant.min_order_quantity || 1);
      setQty(activeVariant.id, floor);
    } else {
      setVariantQty({ 1: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor]);
  const colorVariants = useMemo(() => {
    const pool = allProductVariants.length > 0 ? allProductVariants : (product?.variants ?? []);
    if (pool.length === 0) return variantData ? [variantData] : [];
    const normalise = (s: string) => s?.trim().toLowerCase() ?? "";
    const target = normalise(selectedColor);
    const filtered = pool.filter(v => normalise(v.color) === target);
    return filtered.length > 0 ? filtered : pool;
  }, [allProductVariants, product, selectedColor, variantData]);
  const [variantQty, setVariantQty] = useState<Record<number, number>>({});
  const variantQtyRef = useRef<Record<number, number>>({});

  useEffect(() => {
    variantQtyRef.current = variantQty;
  }, [variantQty]);
  const setQty = (variantId: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setVariantQty(prev => {
      const next = {
        ...prev,
        [variantId]: safeQty,
      };

      // Always keep the latest quantity immediately available
      // for session save/login flow.
      variantQtyRef.current = next;

      return next;
    });
    setOrderRows(prev => {
      const idx = prev.findIndex(r => r.variantId === variantId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: safeQty };
        return next;
      }
      const variant = (allProductVariants.length > 0 ? allProductVariants : product?.variants ?? [])
        .find(v => v.id === variantId);
      const rowData = { color: variant?.color ?? selectedColor, qty: safeQty, variantId };
      const blankIdx = prev.findIndex(r => !r.variantId);
      if (blankIdx !== -1) {
        const next = [...prev];
        next[blankIdx] = { ...next[blankIdx], ...rowData };
        return next;
      }
      return [...prev, { id: Date.now(), ...rowData }];
    });
  };
  const totalQty = useMemo(
    () => Object.values(variantQty).reduce((a, b) => a + b, 0),
    [variantQty]
  );
  const currentVariantId = useMemo(() => {
    const exact = colorVariants.find(v => v.id === variantDataId);
    return exact?.id ?? colorVariants[0]?.id;
  }, [colorVariants, variantDataId]);
  const activeVariant = useMemo(
    () => colorVariants.find(v => v.id === currentVariantId) ?? colorVariants[0],
    [colorVariants, currentVariantId]
  );
  const currentQty = currentVariantId ? (variantQty[currentVariantId] ?? 0) : 0;
  const activeSizes = useMemo(
    () => Object.entries(variantQty)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => ({ variant_id: Number(id), quantity })),
    [variantQty]
  );
  const promoMetaStr = activeVariant?.meta ?? variantData?.meta ?? null;
  const parsedPromoMeta = useMemo(() => parseSageMeta(promoMetaStr), [promoMetaStr]);
  const hasTierPricing = !!(
    parsedPromoMeta &&
    Array.isArray(parsedPromoMeta.priceTiers) &&
    parsedPromoMeta.priceTiers.length > 0
  );
  const promoMinQty = useMemo(
    () => getPromoMinQty(promoMetaStr, activeVariant?.min_order_quantity),
    [promoMetaStr, activeVariant]
  );
  const setPromoQty = (variantId: number, qty: number) => {
    if (!isPromo) { setQty(variantId, Math.max(0, qty)); return; }
    const safe = Number.isFinite(qty) ? Math.floor(qty) : promoMinQty;
    setQty(variantId, Math.max(promoMinQty, safe));
  };
  useEffect(() => {
    if (isRestoringSessionRef.current) return;
    if (isPromo || !activeVariant) return;
    if (Object.keys(variantQty).length > 0) return;
    const floor = isApparel ? getMaterialFloor(selectedMaterial) : Math.max(1, activeVariant.min_order_quantity || 1);
    setQty(activeVariant.id, floor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPromo, isApparel, activeVariant, selectedColor]);
  // Real, current-variant image for Promo/Pre-Made (and Apparel too when
  // not using a mockup) — prefers the active variant's own images before
  // falling back to product-level images.
  const displayImage = useMemo(() => {
    const imgs: VariantImage[] =
      (activeVariant?.images && activeVariant.images.length > 0)
        ? activeVariant.images
        : (product?.images ?? []);
    if (!imgs.length) return null;
    const primary =
      imgs.find(img => img?.is_primary && img?.file_uri) ||
      imgs.find(img => img?.file_uri) ||
      imgs[0];
    const fileUri = primary?.file_uri?.trim();
    if (!fileUri) return null;
    return /^https?:\/\//i.test(fileUri)
      ? fileUri
      : `${BASE_URL}${fileUri.startsWith("/") ? "" : "/"}${fileUri}`;
  }, [product, activeVariant]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const toggleLocation = (id: string) =>
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId | null>(null);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [spColorCount, setSpColorCount] = useState<SpColorCount>("1 Color");
  const [dtgStyle, setDtgStyle] = useState<keyof typeof DTG_PRICES>("Front Regular");
  const getMaterialFloor = (id: MaterialId | null): number => {
    if (id === "screen_print") return SP_MIN_QTY;
    return 1; // embroidery, dtf, dtg, or no material yet — apparel always floors at 1
  };
  const handleSelectMaterial = (id: MaterialId) => {
    setSelectedMaterial(id);
    setShowPriceTable(true);
    const floor = getMaterialFloor(id);
    const previousFloor = lastMaterialFloorRef.current;
    setVariantQty(prev => {
      const updated: Record<number, number> = { ...prev };
      Object.entries(prev).forEach(([k, v]) => {
        updated[Number(k)] = v === previousFloor ? floor : Math.max(floor, v);
      });
      if (activeVariant && updated[activeVariant.id] === undefined) {
        updated[activeVariant.id] = floor;
      }
      return updated;
    });
    lastMaterialFloorRef.current = floor;
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isRemovingLogoBg, setIsRemovingLogoBg] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [bgRemoved, setBgRemoved] = useState(false);
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
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [dragging, setDragging] = useState<"logo" | "text" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const { refreshCart } = useCart();
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const wishlistItem = wishlist.find(i => i.product_id === variantDataId);
  const inWishlist = !!wishlistItem;
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [canvasBlob, setCanvasBlob] = useState<Blob | null>(null);
  const [customizationJson, setCustomizationJson] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showValidationShake, setShowValidationShake] = useState(false);
  const [pendingVariantList, setPendingVariantList] = useState<ConfiguredVariant[]>([]);
  const [justStagedVariantIds, setJustStagedVariantIds] = useState<number[]>([]);
  const [configuredVariants, setConfiguredVariants] = useState<ConfiguredVariant[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sageRemountKey, setSageRemountKey] = useState(0);
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [apparelQtyInput, setApparelQtyInput] = useState<string>(String(currentQty || "1"));
  console.log(apparelQtyInput, "apparelQtyInput")
  useEffect(() => {
    setApparelQtyInput(currentQty > 0 ? String(currentQty) : "1");
  }, [currentQty, activeVariant?.id]);
  const useMockupOnCanvas = isApparel;
  const canvasBaseImageSrc = useMockupOnCanvas ? (activeView?.mockup ?? null) : displayImage;
  useEffect(() => {
    if (!canvasBaseImageSrc) { setProductImg(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const src = useMockupOnCanvas
          ? canvasBaseImageSrc
          : await toBase64ViaSameOrigin(canvasBaseImageSrc);
        if (cancelled) return;
        const img = await loadImage(src);
        if (!cancelled) setProductImg(img);
      } catch (err) { console?.error("Failed to load product image:", err); }
    })();
    return () => { cancelled = true; };
  }, [canvasBaseImageSrc, useMockupOnCanvas]);
  useEffect(() => {
    if (!logoSrc) { setLogoImg(null); return; }
    let cancelled = false;
    loadImage(logoSrc).then(img => { if (!cancelled) setLogoImg(img); });
    return () => { cancelled = true; };
  }, [logoSrc]);
  /** Makes the logo transparent by cutting out its background, entirely in
   *  the browser (no upload to a third-party API — @imgly/background-removal
   *  runs the model client-side via WASM). Loaded on demand so the ~large
   *  model/wasm bundle isn't fetched until a user actually clicks the button. */
  const handleRemoveLogoBackground = useCallback(async (srcOverride?: string) => {
    const src = srcOverride ?? logoSrc;
    if (!src || isRemovingLogoBg) return;
    setIsRemovingLogoBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(src);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoSrc(reader.result as string);
        setBgRemoved(true);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to remove logo background:", err);
    } finally {
      setIsRemovingLogoBg(false);
    }
  }, [logoSrc, isRemovingLogoBg]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCanvas({
      ctx, size: CANVAS_SIZE, productImg, logo: logoImg,
      logoPos, logoSize, logoRotation, logoOpacity,
      text: customText, textPos, textSize, textColor,
      textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity,
    });
    try { setPreviewUrl(canvas.toDataURL("image/png")); }
    catch { setPreviewUrl(displayImage); }
  }, [
    productImg, logoImg, logoPos, logoSize, logoRotation, logoOpacity,
    customText, textPos, textSize, textColor, textRotation,
    fontFamily, textBold, textItalic, textShadow, textOpacity,
  ]);
  const getPoint = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_SIZE / r.width),
      y: (e.clientY - r.top) * (CANVAS_SIZE / r.height),
    };
  };
  const isOverLogo = (pt: { x: number; y: number }) =>
    !!(logoImg && pt.x >= logoPos.x && pt.x <= logoPos.x + logoSize &&
      pt.y >= logoPos.y && pt.y <= logoPos.y + logoSize);
  const isOverText = (pt: { x: number; y: number }) =>
    customText.trim()
      ? pt.x >= textPos.x && pt.x <= textPos.x + textSize * customText.length * 0.65 &&
      pt.y >= textPos.y - textSize && pt.y <= textPos.y + 8
      : false;
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pt = getPoint(e);
    if (isOverLogo(pt)) {
      setDragging("logo");
      setDragOffset({ x: pt.x - logoPos.x, y: pt.y - logoPos.y });
    } else if (isOverText(pt)) {
      setDragging("text");
      setDragOffset({ x: pt.x - textPos.x, y: pt.y - textPos.y });
    }
  };
  // Constrains logo dragging inside the actual mockup artwork rect on
  // apparel (rather than the full square canvas, which has empty margins).
  const getImageDrawRect = () => {
    if (!productImg) return { dx: 0, dy: 0, dw: CANVAS_SIZE, dh: CANVAS_SIZE };
    const scale = Math.min(
      CANVAS_SIZE / productImg.naturalWidth,
      CANVAS_SIZE / productImg.naturalHeight
    );
    const dw = productImg.naturalWidth * scale;
    const dh = productImg.naturalHeight * scale;
    return {
      dx: (CANVAS_SIZE - dw) / 2,
      dy: (CANVAS_SIZE - dh) / 2,
      dw,
      dh,
    };
  };
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getPoint(e);
    if (dragging === "logo") {
      if (useMockupOnCanvas) {
        const { dx, dy, dw, dh } = getImageDrawRect();
        const minX = dx;
        const maxX = dx + dw - logoSize;
        const minY = dy;
        const maxY = dy + dh - logoSize;
        setLogoPos({
          x: Math.max(minX, Math.min(Math.max(minX, maxX), pt.x - dragOffset.x)),
          y: Math.max(minY, Math.min(Math.max(minY, maxY), pt.y - dragOffset.y)),
        });
      } else {
        setLogoPos({
          x: Math.max(0, Math.min(CANVAS_SIZE - logoSize, pt.x - dragOffset.x)),
          y: Math.max(0, Math.min(CANVAS_SIZE - logoSize, pt.y - dragOffset.y)),
        });
      }
    } else if (dragging === "text") {
      setTextPos({
        x: Math.max(0, Math.min(CANVAS_SIZE - 40, pt.x - dragOffset.x)),
        y: Math.max(textSize, Math.min(CANVAS_SIZE, pt.y - dragOffset.y)),
      });
    }
  }, [dragging, dragOffset, logoSize, textSize, useMockupOnCanvas, productImg]);
  const stopDrag = () => setDragging(null);
  const getCursor = () => dragging ? "grabbing" : (logoImg || customText.trim()) ? "grab" : "default";
  /* ── Apparel print pricing ── */
  const getPrintPrice = (): number | null => {
    if (!isApparel) return null;
    return getMaterialPrintTotal(selectedMaterial, selectedLocations, currentQty, spColorCount, dtgStyle);
  };
  const printPrice = getPrintPrice();
  const digitizingFee = getDigitizingFee(selectedMaterial, currentQty);
  const basePrice = activeVariant ? getVariantPrice(activeVariant) : (product?.price ?? 0);
  // ★ FIX — decoration price now EXCLUDES the flat digitizing fee before
  // dividing by quantity. Previously printPrice (which already includes
  // the $35 fee at qty<=11) was divided by qty directly, smearing the
  // flat fee across every unit instead of charging it once. This kept
  // decorationUnitPrice as a genuine per-unit rate.
  const decorationUnitPrice = isApparel && currentQty > 0
    ? ((printPrice ?? 0) - digitizingFee) / currentQty
    : 0;
  const currentSelectionPricing = calculateVariantTotal({
    productPrice: basePrice,
    decorationPrice: decorationUnitPrice,
    quantity: currentQty,
  });
  const productTotal = currentSelectionPricing.productTotal;
  const decorationTotal = currentSelectionPricing.decorationTotal;
  // ★ FIX — estimatedTotal now explicitly adds the flat digitizing fee
  // back in ONCE, since it's no longer folded into decorationTotal.
  const estimatedTotal = currentSelectionPricing.total + digitizingFee;
  const promoUnitPrice: number | null = useMemo(() => {
    if (!isPromo) return null;
    if (hasTierPricing) return getSageUnitPriceWithMarkup(promoMetaStr, currentQty) ?? basePrice;
    return basePrice;
  }, [isPromo, hasTierPricing, promoMetaStr, currentQty, basePrice]);
  const promoTotal = (promoUnitPrice ?? 0) * currentQty;
  const REQUIREMENTS = [
    ...((isApparel || isPreMade) ? [{ key: "color", label: "Color", done: !!selectedColor }] : []),
    ...(isApparel ? [
      { key: "loc", label: "Print location", done: selectedLocations.length > 0 },
      { key: "mat", label: "Print method", done: !!selectedMaterial },
    ] : []),
    ...(isPreMade ? [{ key: "size", label: "Size & qty", done: activeSizes.length > 0 }] : []),
    ...(isPromo ? [{
      key: "qty",
      label: `Quantity (min ${promoMinQty})`,
      done: totalQty >= promoMinQty,
    }] : []),
  ];
  const allMet = REQUIREMENTS.every(r => r.done);
  interface OrderRow { id: number; color: string; qty: number; variantId: number | "" }
  const [orderRows, setOrderRows] = useState<OrderRow[]>([
    { id: Date.now(), color: "", qty: 1, variantId: "" }
  ]);
  const orderRowsRef = useRef(orderRows);
  useEffect(() => { orderRowsRef.current = orderRows; }, [orderRows]);
  const addOrderRow = () => setOrderRows(prev => [...prev, { id: Date.now(), color: "", qty: 1, variantId: "" }]);
  const removeOrderRow = (id: number) => setOrderRows(prev => prev.filter(r => r.id !== id));
  const updateOrderRow = (
    id: number,
    field: keyof OrderRow,
    value: any
  ) => {
    setOrderRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "color") {
          updated.variantId = "";
          updated.qty = 1;
        }
        if (field === "variantId") {
          const variant = product?.variants?.find((v) => v.id === value);
          updated.qty = Math.max(1, variant?.min_order_quantity || 1);
        }
        if (field === "qty") {
          updated.qty = Number(value);
        }
        return updated;
      })
    );
  };
  const saveOrderRows = () => {
    setOrderRows((currentRows) => {
      const valid = currentRows.filter(r => r.color && r.variantId && r.qty >= 1);
      const newQty: Record<number, number> = {};
      valid.forEach(r => { newQty[Number(r.variantId)] = (newQty[Number(r.variantId)] || 0) + r.qty; });
      setVariantQty(newQty);
      if (!selectedColor && valid[0]) setSelectedColor(valid[0].color);
      return currentRows;
    });
  };
  const cancelOrderRows = () => {
    setOrderRows([{ id: Date.now(), color: "", qty: 1, variantId: "" }]);
    setVariantQty({});
  };
  const buildCurrentSizesFromSelection = (): ConfiguredSize[] => {
    if (isPreMade) {
      return activeSizes.map(s => {
        const v = (allProductVariants.length > 0 ? allProductVariants : product?.variants ?? [])
          .find(vv => vv.id === s.variant_id);
        return {
          variant_id: s.variant_id,
          size_id: v?.size_id ?? null,
          size: v?.size_details?.name || v?.size || "—",
          quantity: s.quantity,
          unit_price: getVariantPrice(v) || basePrice,
          decoration_unit_price: 0,
          digitizing_fee: 0,
        };
      });
    }
    const v = activeVariant;
    if (!v || currentQty <= 0) return [];
    // ★ FIX — fee pulled out explicitly, decoration_unit_price is a pure
    // per-unit rate (never includes the flat fee).
    const fee = isApparel ? getDigitizingFee(selectedMaterial, currentQty) : 0;
    const pureDecorationTotal = isApparel ? (printPrice ?? 0) - fee : 0;
    return [{
      variant_id: v.id,
      size_id: v.size_id ?? null,
      size: v.size_details?.name || v.size || "—",
      quantity: currentQty,
      unit_price: isPromo ? (promoUnitPrice ?? basePrice) : basePrice,
      decoration_unit_price: isApparel ? pureDecorationTotal / currentQty : 0,
      digitizing_fee: fee,
    }];
  };
  const mergeVariantIntoList = (
    list: ConfiguredVariant[],
    colorKey: string,
    newSizes: ConfiguredSize[],
    variant: Variant,
    images: VariantImage[]
  ): ConfiguredVariant[] => {
    const existingIdx = list.findIndex(
      (v) => v.variantId === variant.id
    );
    if (existingIdx === -1) {
      const pricing = sumVariantTotals(
        newSizes.map(s => ({
          productPrice: s.unit_price,
          decorationPrice: s.decoration_unit_price,
          quantity: s.quantity,
        }))
      );
      // ★ digitizing fees summed FLAT — never scaled by quantity.
      const digitizingFeeTotal = newSizes.reduce((sum, s) => sum + (s.digitizing_fee ?? 0), 0);
      const totalQty = newSizes.reduce((sum, s) => sum + s.quantity, 0);
      return [
        ...list,
        {
          variantId: variant.id,
          variantName: colorKey,
          color: colorKey,
          colorCode: variant.color_code ?? "",
          images,
          sizes: newSizes,
          totalQty,
          totalPrice: pricing.total + digitizingFeeTotal,
          productTotal: pricing.productTotal,
          decorationTotal: pricing.decorationTotal,
          digitizingFeeTotal,
        },
      ];
    }
    return list.map((item, index) => {
      if (index !== existingIdx) return item;
      const mergedSizes = [...item.sizes];
      newSizes.forEach((newSize) => {
        const dupeIdx = mergedSizes.findIndex(
          (s) => s.variant_id === newSize.variant_id
        );
        if (dupeIdx > -1) {
          mergedSizes[dupeIdx] = {
            ...mergedSizes[dupeIdx],
            quantity: newSize.quantity,
            unit_price: newSize.unit_price,
            decoration_unit_price: newSize.decoration_unit_price,
            digitizing_fee: newSize.digitizing_fee,
          };
        } else {
          mergedSizes.push(newSize);
        }
      });
      const pricing = sumVariantTotals(
        mergedSizes.map(s => ({
          productPrice: s.unit_price,
          decorationPrice: s.decoration_unit_price,
          quantity: s.quantity,
        }))
      );
      const digitizingFeeTotal = mergedSizes.reduce((sum, s) => sum + (s.digitizing_fee ?? 0), 0);
      const totalQty = mergedSizes.reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...item,
        sizes: mergedSizes,
        totalQty,
        totalPrice: pricing.total + digitizingFeeTotal,
        productTotal: pricing.productTotal,
        decorationTotal: pricing.decorationTotal,
        digitizingFeeTotal,
      };
    });
  };
  const removeConfiguredVariant = (variantName: string) =>
    setConfiguredVariants(prev => prev.filter(cv => cv.variantName !== variantName));
  const grandConfiguredQty = useMemo(
    () => configuredVariants.reduce((s, cv) => s + cv.totalQty, 0),
    [configuredVariants]
  );
  const grandConfiguredPrice = useMemo(
    () => configuredVariants.reduce((s, cv) => s + cv.totalPrice, 0),
    [configuredVariants]
  );
  const preMadeSelectionPricing = useMemo(() => {
    if (!isPreMade) return { productTotal: 0, decorationTotal: 0, total: 0 };
    return sumVariantTotals(
      activeSizes.map(s => {
        const v = product?.variants.find(vv => vv.id === s.variant_id);
        return {
          productPrice: getVariantPrice(v) || basePrice,
          decorationPrice: 0,
          quantity: s.quantity,
        };
      })
    );
  }, [isPreMade, activeSizes, product, basePrice]);
  const currentVariantAlreadyConfigured = !!(
    activeVariant && configuredVariants.some(cv => cv.variantId === activeVariant.id)
  );
  const currentSelectionTotal = useMemo(() => {
    if (currentVariantAlreadyConfigured) return 0;
    if (isApparel && currentQty > 0) return estimatedTotal;
    if (isPreMade && totalQty > 0) return preMadeSelectionPricing.total;
    if (isPromo && currentQty > 0 && promoUnitPrice !== null) return promoTotal;
    return 0;
  }, [currentVariantAlreadyConfigured, isApparel, isPreMade, isPromo, currentQty, totalQty, estimatedTotal, preMadeSelectionPricing, promoUnitPrice, promoTotal]);
  const displayTotal = grandConfiguredPrice + currentSelectionTotal;
  const buildPayload = (variantList: ConfiguredVariant[]) => {
    const customizations = variantList.flatMap(cv =>
      cv.sizes.map(s => {
        const linePricing = calculateVariantTotal({
          productPrice: s.unit_price,
          decorationPrice: s.decoration_unit_price ?? 0,
          quantity: s.quantity,
        });
        return {
          variant_id: s.variant_id,
          color: cv.color,
          size: s.size,
          quantity: s.quantity,
          product_price: s.unit_price,
          decoration_price: s.decoration_unit_price ?? 0,
          digitizing_fee: s.digitizing_fee ?? 0,
          // ★ digitizing fee added ONCE, flat — never multiplied by qty
          total_price: linePricing.total + (s.digitizing_fee ?? 0),
        };
      })
    );
    const base: any = {
      product_id: productDataId,
      customizations,
      variants: variantList.map(cv => ({
        variant_id: cv.variantId,
        sizes: cv.sizes.map(s => ({
          size_id: s.size_id,
          variant_id: s.variant_id,
          quantity: s.quantity,
        })),
      })),
    };
    if (isApparel) {
      base.print_method = selectedMaterial?.toUpperCase() ?? null;
      base.locations = selectedLocations.map(loc => ({ location: loc }));
    }
    return base;
  };
  const getBlob = (): Promise<Blob | null> =>
    new Promise((res) => {
      const canvas = canvasRef.current;
      if (!canvas) return res(null);
      const ctx = canvas.getContext("2d");
      if (ctx) drawCanvas({
        ctx, size: CANVAS_SIZE, productImg, logo: logoImg,
        logoPos, logoSize, logoRotation, logoOpacity,
        text: customText, textPos, textSize, textColor,
        textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity,
      });
      canvas.toBlob(blob => res(blob), "image/png", 1);
    });
  const handleAddToCart = async () => {
    if (requireLogin()) return;
    if (!allMet) {
      const missing = REQUIREMENTS.filter(r => !r.done).map(r => r.label);
      setValidationError(`Please complete: ${missing.join(", ")}.`);
      setShowValidationShake(true);
      setTimeout(() => setShowValidationShake(false), 600);
      return;
    }
    if (isPromo && currentQty < promoMinQty) {
      setValidationError(`Minimum order quantity for this product is ${promoMinQty}.`);
      setShowValidationShake(true);
      setTimeout(() => setShowValidationShake(false), 600);
      return;
    }
    if (isPreMade) {
      const tooLow = activeSizes.find(s => {
        const v = product?.variants.find(vv => vv.id === s.variant_id);
        const min = v?.min_order_quantity ?? 1;
        return s.quantity < min;
      });
      if (tooLow) {
        const v = product?.variants.find(vv => vv.id === tooLow.variant_id);
        setValidationError(
          `Minimum quantity for ${v?.size_details?.name || v?.size || "this size"} is ${v?.min_order_quantity ?? 1}.`
        );
        setShowValidationShake(true);
        setTimeout(() => setShowValidationShake(false), 600);
        return;
      }
    }
    const newSizes = buildCurrentSizesFromSelection();
    if (newSizes.length === 0 || !activeVariant) {
      const missing = REQUIREMENTS.filter(r => !r.done).map(r => r.label);
      setValidationError(`Please complete: ${missing.join(", ") || "your selection"}.`);
      setShowValidationShake(true);
      setTimeout(() => setShowValidationShake(false), 600);
      return;
    }
    const safeColorKey = selectedColor || activeVariant.color || "Selected Variant";
    const updatedVariantList = mergeVariantIntoList(
      configuredVariants,
      safeColorKey,
      newSizes,
      activeVariant,
      product?.images ?? []
    );
    setConfiguredVariants(updatedVariantList);
    setPendingVariantList(updatedVariantList);
    setJustStagedVariantIds(newSizes.map(s => s.variant_id));
    if (isPromo) {
      const variantsSource = allProductVariants.length > 0 ? allProductVariants : (product?.variants ?? []);
      const tooLow = updatedVariantList.find(cv => {
        const v = variantsSource.find(vv => vv.id === cv.variantId);
        const min = getPromoMinQty(v?.meta ?? promoMetaStr, v?.min_order_quantity);
        return cv.totalQty < min;
      });
      if (tooLow) {
        const v = variantsSource.find(vv => vv.id === tooLow.variantId);
        const min = getPromoMinQty(v?.meta ?? promoMetaStr, v?.min_order_quantity);
        setValidationError(
          `Minimum order quantity for ${tooLow.variantName} is ${min} (currently ${tooLow.totalQty}).`
        );
        setShowValidationShake(true);
        setTimeout(() => setShowValidationShake(false), 600);
        return;
      }
    }
    setValidationError(null);
    let blob: Blob | null = null;
    if (isApparel || (isPromo && logoImg)) blob = await getBlob();
    canvasBlobRef.current = blob;
    setCanvasBlob(blob);
    setCustomizationJson(JSON.stringify(buildPayload(updatedVariantList)));
    setShowConfigModal(true);
  };
  const handleConfigConfirm = async (config: {
    selectedColor: string;
    selectedSizes: {
      variant_id: number;
      quantity: number;
      size_name: string;
      unit_price: number;
      decoration_price: number;
      digitizing_fee: number;
    }[];
    addAlso: boolean;
  }) => {
    setConfigSubmitting(true);
    try {
      let mergedList = configuredVariants;
      if (config.addAlso && config.selectedSizes.length > 0) {
        const variantsSource =
          allProductVariants.length > 0
            ? allProductVariants
            : product?.variants ?? [];
        const genuinelyNewSizes = config.selectedSizes.filter(
          (s) => !justStagedVariantIds.includes(s.variant_id)
        );
        genuinelyNewSizes.forEach((s) => {
          const variant = variantsSource.find((v) => v.id === s.variant_id);
          if (!variant) return;
          const colorKey = variant.color || config.selectedColor;
          const newSize: ConfiguredSize = {
            variant_id: s.variant_id,
            size_id: variant.size_id ?? null,
            size: s.size_name || variant.size_details?.name || variant.size || "—",
            quantity: s.quantity,
            unit_price: s.unit_price,
            decoration_unit_price: s.decoration_price ?? 0,
            // ★ FIX — was silently dropped before; now carried through
            digitizing_fee: s.digitizing_fee ?? 0,
          };
          mergedList = mergeVariantIntoList(
            mergedList,
            colorKey,
            [newSize],
            variant,
            []
          );
        });
      }
      setConfiguredVariants(mergedList);
      setPendingVariantList(mergedList);
      setCustomizationJson(JSON.stringify(buildPayload(mergedList)));
      setShowConfigModal(false);
      setJustStagedVariantIds([]);
      setTimeout(() => {
        setShowCartModal(true);
      }, 50);
    } catch (e) {
      console.error(e);
    } finally {
      setConfigSubmitting(false);
    }
  };
  const handleWishlist = async () => {
    if (requireLogin()) return;
    try {
      setWishlistLoading(true);
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id);
      } else {
        await addToWishlist({
          product_id: variantDataId,
          variant_id: activeVariant?.id ?? 0,
          name: product?.name ?? "",
          price: basePrice,
          image: displayImage ?? "",
        });
      }
      await fetchWishlist();
      fetchProduct();
    } catch (e) { console?.error(e); }
    finally { setWishlistLoading(false); }
  };
  const resetCustomizationState = () => {
    setVariantQty({});
    setOrderRows([{ id: Date.now(), color: "", qty: 1, variantId: "" }]);
    setSelectedLocations([]);
    setSelectedMaterial(null);
    setShowPriceTable(false);
    setSpColorCount("1 Color");
    setDtgStyle("Front Regular");
    lastMaterialFloorRef.current = 1;
    setLogoSrc(null);
    setLogoImg(null);
    setLogoSize(120);
    setLogoRotation(0);
    setLogoOpacity(1);
    setLogoPos({ x: 190, y: 190 });
    setCustomText("");
    setTextSize(36);
    setTextColor("#1a1a1a");
    setTextRotation(0);
    setFontFamily("Georgia, serif");
    setTextBold(false);
    setTextItalic(false);
    setTextShadow(false);
    setTextOpacity(1);
    setTextPos({ x: 80, y: 300 });
    setConfiguredVariants([]);
    setPendingVariantList([]);
    setJustStagedVariantIds([]);
    setCustomizationJson("");
    canvasBlobRef.current = null;
    setCanvasBlob(null);
    setValidationError(null);
  };
  const handleOpenPreview = () => {
    if (requireLogin()) return;
    setPreviewError(false);
    setShowPreviewModal(true);
    try {
      const off = document.createElement("canvas");
      off.width = CANVAS_SIZE * 2; off.height = CANVAS_SIZE * 2;
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      drawCanvas({
        ctx, size: CANVAS_SIZE, productImg, logo: logoImg,
        logoPos, logoSize, logoRotation, logoOpacity,
        text: customText, textPos, textSize, textColor,
        textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity,
      });
      setPreviewDataUrl(off.toDataURL("image/png", 1));
    } catch { setPreviewError(true); }
  };
  if (loading || restorePending) {
    console.log(restorePending,"restorePending")
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 h-14 animate-pulse" />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {restorePending && (
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#b89000] bg-[#F5D800]/10 border border-[#F5D800]/20 rounded-xl px-3 py-2 w-fit">
              <Loader2 size={13} className="animate-spin" />
              Restoring your saved customization…
            </div>
          )}
          <div className="grid xl:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-5">
              <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="h-72 rounded-2xl bg-gray-200 animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Package size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-bold">Product not found</p>
          <Link href="/categories" className="inline-block px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold">
            Browse Products
          </Link>
        </div>
      </section>
    );
  }
  console.log(activeView,"activeView===>")
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900">
                <X size={15} />
              </button>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">Login to customize products, save to wishlist, and add to cart. Your current customization will be saved.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 h-11 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  saveCustomizationToSession();
                  router.push("/login");
                }}
                className="flex-1 h-11 rounded-xl bg-[#F5D800] text-black text-sm font-black"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5D800] flex items-center justify-center">
                  <Eye size={15} className="text-black" />
                </div>
                <h3 className="font-black text-gray-900">Preview Design</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="p-5">
              <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 overflow-hidden relative">
                {previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-500">
                    <AlertCircle size={40} /><p className="text-sm">Preview failed</p>
                  </div>
                ) : previewDataUrl ? (
                  <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#F5D800]" size={32} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowPreviewModal(false)} className="flex-1 h-12 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  if (!previewDataUrl) return;
                  const a = document.createElement("a");
                  a.href = previewDataUrl;
                  a.download = `${product.name.replace(/\s+/g, "-")}-customized.png`;
                  a.click();
                  setShowPreviewModal(false);
                }}
                disabled={!previewDataUrl}
                className={cn("flex-1 h-12 rounded-xl font-black flex items-center justify-center gap-2",
                  previewDataUrl ? "bg-[#F5D800] text-black" : "bg-gray-100 text-gray-400 cursor-not-allowed")}
              >
                <ImageDown size={17} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3.5">
            <Link href={`/product/${productDataId}`} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-black transition-colors">
              <ArrowLeft size={14} /> Back to product
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">Customize — {product.name}</span>
            <span className={cn(
              "hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border",
              isApparel ? "bg-blue-50 text-blue-600 border-blue-200" :
                isPreMade ? "bg-purple-50 text-purple-600 border-purple-200" :
                  "bg-orange-50 text-orange-600 border-orange-200"
            )}>
              {isApparel ? "Apparel & Uniforms" : isPreMade ? "Pre-Made" : "Promo Product"}
            </span>
            <div className="ml-auto hidden md:flex items-center gap-1.5">
              {REQUIREMENTS.map(r => (
                <span key={r.key} className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border",
                  r.done ? "bg-[#F5D800]/15 text-[#b89000] border-[#F5D800]/30" : "bg-gray-100 text-gray-400 border-gray-200"
                )}>
                  {r.done ? <Check size={9} /> : <Circle size={9} className="opacity-40" />}
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Customize Your Order</h1>
          <p className="text-sm text-gray-500">
            {isApparel && "Select print location, decoration method, then upload your logo"}
            {isPreMade && "Choose your color, size & quantity"}
            {isPromo && `Select quantity (min ${promoMinQty}) and optionally upload your logo`}
          </p>
        </div>
      </div>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">
          <div>
            {isApparel && (
              <>
                <SectionCard
                  step={1}
                  title="Choose Print Location"
                  subtitle="Select a view, then tap the hotspot to choose your print location."
                  status={selectedLocations.length > 0 ? "done" : "required"}
                >
                  <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-xl">
                    {garmentViews.map((view, idx) => (
                      <button key={view.key} onClick={() => setActiveViewIdx(idx)}
                        className={cn("flex-1 h-9 rounded-lg text-xs font-bold transition-all",
                          activeViewIdx === idx ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}>
                        {view.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative mx-auto mb-4" style={{ maxWidth: 300 }}>
                    <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img src={activeView.mockup} alt={activeView.label} className="w-full h-auto object-contain" />
                      <div className="absolute inset-0">
                        {activeView.hotspots.map(h => (
                          <button key={h.id} onClick={() => toggleLocation(h.id)}
                            style={{ top: h.top, left: h.left }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-150",
                              selectedLocations.includes(h.id)
                                ? "bg-[#F5D800] border-[#d4a800] text-black scale-110 shadow-md"
                                : "bg-white/85 border-gray-300 text-gray-600 hover:bg-[#F5D800]/70 hover:border-[#d4a800] hover:scale-105 backdrop-blur-sm"
                            )}>
                              {selectedLocations.includes(h.id)
                                ? <Check size={14} />
                                : <span className="text-[9px] font-black text-center leading-tight px-0.5">{h.label}</span>
                              }
                            </div>
                            {!selectedLocations.includes(h.id) && (
                              <span className="absolute inset-0 rounded-full border-2 border-[#F5D800]/40 animate-ping" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-gray-400 mt-2">Tap a hotspot to select a print location</p>
                  </div>
                  {selectedLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-[#F5D800]/5 rounded-xl border border-[#F5D800]/20">
                      <span className="text-[11px] font-bold text-[#b89000] mr-1 self-center">Selected:</span>
                      {selectedLocations.map(id => (
                        <span key={id} className="inline-flex items-center gap-1 bg-[#F5D800] text-black text-[11px] font-bold px-2.5 py-1 rounded-full">
                          {ALL_PRINT_LOCATIONS.find(l => l.id === id)?.label ?? id}
                          <button onClick={() => toggleLocation(id)} className="hover:opacity-60 ml-0.5"><X size={10} /></button>
                        </span>
                      ))}
                      {selectedLocations.length > 1 && (
                        <button onClick={() => setSelectedLocations([])} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-white">Clear all</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Circle size={13} className="text-gray-300 flex-shrink-0" />
                      <p className="text-xs text-gray-400">No location selected yet — tap a hotspot above</p>
                    </div>
                  )}
                </SectionCard>
                <SectionCard
                  step={2}
                  title="Decoration Method"
                  subtitle="Choose how your design will be applied to the garment."
                  status={selectedMaterial ? "done" : "required"}
                >
                  <div className="space-y-2">
                    {MATERIALS.map(mat => {
                      const isSelected = selectedMaterial === mat.id;
                      return (
                        <div key={mat.id}>
                          <button onClick={() => handleSelectMaterial(mat.id)}
                            className={cn("w-full text-left flex items-start gap-3 rounded-2xl border-2 p-3.5 transition-all relative",
                              isSelected ? "border-[#F5D800] bg-[#FFFBEA]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            )}>
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F5D800] flex items-center justify-center">
                                <Check size={11} className="text-black" />
                              </div>
                            )}
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0", isSelected ? "bg-[#F5D800]/20" : "bg-gray-100")}>
                              {mat.emoji}
                            </div>
                            <div className="flex-1 min-w-0 pr-5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-gray-900">{mat.label}</p>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isSelected ? "bg-[#F5D800] text-black" : "bg-gray-100 text-gray-500")}>{mat.badge}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">{mat.desc}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Best for: {mat.bestFor}</p>
                            </div>
                          </button>
                          {isSelected && (
                            <div className="mt-2 mb-1">
                              {mat.id === "screen_print" && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Number of Colours</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {SP_COLOR_COUNTS.map(c => (
                                      <button key={c} onClick={() => setSpColorCount(c)}
                                        className={cn("h-10 rounded-xl border-2 text-xs font-bold transition-all",
                                          spColorCount === c ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 bg-white")}>
                                        {c}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {(mat.id === "dtg" || mat.id === "dtf") && mat.id === "dtg" && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Print Area</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(DTG_PRICES) as (keyof typeof DTG_PRICES)[]).map(s => (
                                      <button key={s} onClick={() => setDtgStyle(s)}
                                        className={cn("h-10 rounded-xl border-2 text-xs font-bold transition-all px-2",
                                          dtgStyle === s ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 bg-white")}>
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="mt-3">
                                <button onClick={() => setShowPriceTable(p => !p)}
                                  className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                    <Table2 size={14} className="text-[#F5D800]" /> View Full Price Table
                                  </div>
                                  {showPriceTable ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                                </button>
                                {showPriceTable && (
                                  <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden text-xs">
                                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-600">
                                      {mat.id === "embroidery" && "Embroidery — Price per Location"}
                                      {mat.id === "dtf" && "DTF Print Pricing"}
                                      {mat.id === "screen_print" && "Screen Print Pricing"}
                                      {mat.id === "dtg" && "DTG Print Pricing"}
                                    </div>
                                    <div className="overflow-x-auto">
                                      {mat.id === "embroidery" && (
                                        <table className="w-full border-collapse min-w-[520px]">
                                          <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-36">Location</th>
                                              {EMB_TIERS.map(t => <th key={t.label} className="px-2 py-2 font-bold text-gray-500 border-r border-gray-100 text-center">{t.label}</th>)}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {selectedLocations.length === 0 ? (
                                              <tr>
                                                <td colSpan={EMB_TIERS.length + 1} className="px-3 py-3 text-center text-gray-400">
                                                  Select a print location above to see pricing.
                                                </td>
                                              </tr>
                                            ) : (
                                              <>
                                                {selectedLocations.map(key => {
                                                  const prices = EMB_PRICES[key];
                                                  if (!prices) return null;
                                                  return (
                                                    <tr key={key} className="border-b border-gray-100 bg-[#F5D800]/8">
                                                      <td className="px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">{ALL_PRINT_LOCATIONS.find(l => l.id === key)?.label ?? key}</td>
                                                      {prices.map((p, j) => (
                                                        <td key={j} className="px-2 py-2 text-center border-r border-gray-100 text-gray-500">
                                                          ${formatMoney(basePrice + p)}
                                                        </td>
                                                      ))}
                                                    </tr>
                                                  );
                                                })}
                                                {/* <tr className="border-t-2 border-gray-300 bg-gray-50">
                                                  <td className="px-3 py-2.5 font-black text-gray-900 border-r border-gray-200">
                                                    Total ({selectedLocations.length} location{selectedLocations.length > 1 ? "s" : ""})
                                                  </td>
                                                  {EMB_TIERS.map((_, tierIdx) => {
                                                    const printSum = selectedLocations.reduce((sum, loc) => {
                                                      const row = EMB_PRICES[loc];
                                                      return sum + (row ? row[tierIdx] : 0);
                                                    }, 0);
                                                    return (
                                                      <td key={tierIdx} className="px-2 py-2.5 text-center border-r border-gray-100 font-black text-gray-900">
                                                        ${formatMoney(basePrice + printSum)}
                                                      </td>
                                                    );
                                                  })}
                                                </tr> */}
                                              </>
                                            )}
                                          </tbody>
                                        </table>
                                      )}
                                      {mat.id === "dtf" && (
                                        <table className="w-full border-collapse min-w-[480px]">
                                          <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200">Method</th>
                                              {["1–11", "12–23", "24–35", "36–71", "72–95", "96–143", "144+"].map((l, i) => (
                                                <th key={l} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center",
                                                  DTF_TIERS.reduce((f, t, idx) => (currentQty >= t ? idx : f), 0) === i ? "text-[#b89000] bg-[#F5D800]/8" : "text-gray-500")}>{l}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              <td className="px-3 py-3 font-bold text-[#b89000] border-r border-gray-200">DTF (per location)</td>
                                              {DTF_PRICES.map((p, i) => (
                                                <td key={i} className={cn("px-2 py-3 text-center border-r border-gray-100 font-medium",
                                                  DTF_TIERS.reduce((f, t, idx) => (currentQty >= t ? idx : f), 0) === i ? "text-[#b89000] font-bold" : "text-gray-500")}>
                                                  ${formatMoney(basePrice + p)}
                                                </td>
                                              ))}
                                            </tr>
                                            {/* {selectedLocations.length > 0 && (
                                              <tr className="border-t-2 border-gray-300 bg-gray-50">
                                                <td className="px-3 py-2.5 font-black text-gray-900 border-r border-gray-200">
                                                  Total ({selectedLocations.length} location{selectedLocations.length > 1 ? "s" : ""})
                                                </td>
                                                {DTF_PRICES.map((p, i) => (
                                                  <td key={i} className="px-2 py-2.5 text-center border-r border-gray-100 font-black text-gray-900">
                                                    ${formatMoney(basePrice + p * selectedLocations.length)}
                                                  </td>
                                                ))}
                                              </tr>
                                            )} */}
                                          </tbody>
                                        </table>
                                      )}
                                      {mat.id === "screen_print" && (
                                        <table className="w-full border-collapse min-w-[640px]">
                                          <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200">Colors</th>
                                              {SP_TIERS.map((t, i) => (
                                                <th key={t.label} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center last:border-r-0",
                                                  SP_TIERS.reduce((f, tt, idx) => (currentQty >= tt.min ? idx : f), 0) === i ? "text-[#b89000] bg-[#F5D800]/8" : "text-gray-500")}>{t.label}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {Object.entries(SP_PRICES).map(([k, p], i) => (
                                              <tr key={k} className={cn("border-b border-gray-100", k === spColorCount ? "bg-[#F5D800]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                                <td className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">
                                                  {k} <span className="text-[10px] font-normal text-gray-400">(per location)</span>
                                                </td>
                                                {SP_TIERS.map((t, j) => (
                                                  <td key={t.label} className="px-2 py-2.5 text-center border-r border-gray-100 text-gray-500 last:border-r-0">${formatMoney(basePrice + p[j])}</td>
                                                ))}
                                              </tr>
                                            ))}
                                            {/* {selectedLocations.length > 0 && (
                                              <tr className="border-t-2 border-gray-300 bg-gray-50">
                                                <td className="px-3 py-2.5 font-black text-gray-900 border-r border-gray-200">
                                                  Total ({spColorCount}, {selectedLocations.length} location{selectedLocations.length > 1 ? "s" : ""})
                                                </td>
                                                <td className="px-3 py-2.5 text-center border-r border-gray-100 font-black text-gray-900">
                                                  ${formatMoney(basePrice + SP_PRICES[spColorCount][0] * selectedLocations.length)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-black text-gray-900">
                                                  ${formatMoney(basePrice + SP_PRICES[spColorCount][1] * selectedLocations.length)}
                                                </td>
                                              </tr>
                                            )} */}
                                          </tbody>
                                        </table>
                                      )}
                                      {mat.id === "dtg" && (
                                        <table className="w-full border-collapse min-w-[400px]">
                                          <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                              <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-40">Print Area</th>
                                              {DTG_TIERS.map((t, i) => (
                                                <th key={i} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center",
                                                  DTG_TIERS.reduce((f, tt, idx) => (currentQty >= tt.min ? idx : f), 0) === i ? "text-[#b89000] bg-[#F5D800]/8" : "text-gray-500")}>
                                                  {["1–23", "24–47", "48–99", "100+"][i]}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {Object.entries(DTG_PRICES).map(([k, p], i) => (
                                              <tr key={k} className={cn("border-b border-gray-100", k === dtgStyle ? "bg-[#F5D800]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                                <td className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">{k}</td>
                                                {p.map((vv, j) => (
                                                  <td key={j} className="px-2 py-2.5 text-center border-r border-gray-100 text-gray-500">
                                                    ${formatMoney(basePrice + vv)}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
                <SectionCard
                  step={3}
                  title="Upload Logo / Add Text"
                  subtitle="Upload a logo or add custom text. Drag to reposition on the canvas."
                  status="optional"
                >
                  <LogoCanvasSection {...logoCanvasSectionProps()} />
                </SectionCard>
              </>
            )}
            {isPreMade && (
              <SectionCard
                step={1} title="Select Color, Quantity & Size"
                subtitle="Add one row per size combination."
                status={activeSizes.length > 0 ? "done" : "required"}
              >
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr 100px 1fr 36px" }}>
                  {["Color", "Quantity", "Size", ""].map((h, i) => (
                    <p key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</p>
                  ))}
                </div>
                <div className="space-y-2 mb-3">
                  {orderRows.map(row => {
                    const sizesForColor = product.variants.filter(
                      (v) => v.color === row.color
                    );
                    return (
                      <div key={row.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 100px 1fr 36px" }}>
                        <select value={row.color} onChange={e => updateOrderRow(row.id, "color", e.target.value)}
                          className="h-10 rounded-xl border-2 border-gray-200 px-2 text-xs font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none">
                          <option value="">Color…</option>
                          {colors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden h-10">
                          <button onClick={() => updateOrderRow(row.id, "qty", Math.max(1, row.qty - 1))} className="w-8 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50"><Minus size={12} /></button>
                          <input
                            type="number"
                            value={row.qty}
                            min={1}
                            onChange={e => {
                              const val = Number(e.target.value);
                              updateOrderRow(row.id, "qty", Number.isFinite(val) ? val : 1);
                            }}
                            onBlur={e => {
                              const val = Number(e.target.value);
                              updateOrderRow(row.id, "qty", Math.max(1, Number.isFinite(val) ? val : 1));
                            }}
                            className="flex-1 w-full text-center text-xs font-black text-gray-900 outline-none bg-transparent"
                          />
                          <button onClick={() => updateOrderRow(row.id, "qty", row.qty + 1)} className="w-8 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50"><Plus size={12} /></button>
                        </div>
                        <select value={row.variantId} onChange={e => updateOrderRow(row.id, "variantId", Number(e.target.value))}
                          disabled={!row.color}
                          className="h-10 rounded-xl border-2 border-gray-200 px-2 text-xs font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none disabled:opacity-40">
                          <option value="">Size…</option>
                          {sizesForColor.map(v => (
                            <option key={v.id} value={v.id}>{v.size_details?.name || v.size} (stock: {v.stock})</option>
                          ))}
                        </select>
                        <button onClick={() => removeOrderRow(row.id)} disabled={orderRows.length === 1}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 hover:border-red-200 disabled:opacity-30">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={addOrderRow} className="w-full h-10 rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:border-[#F5D800] hover:text-[#b89000] hover:bg-[#FFFBEA] transition-all mb-4">
                  <Plus size={14} /> Add another row
                </button>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={cancelOrderRows} className="h-10 px-5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveOrderRows} disabled={!orderRows.every(r => r.color && r.variantId && r.qty >= 1)}
                    className={cn("flex-1 h-10 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all",
                      orderRows.every(r => r.color && r.variantId && r.qty >= 1) ? "bg-[#F5D800] text-black hover:bg-[#e6ca00]" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                    <Check size={14} /> Save selection
                  </button>
                </div>
                {activeSizes.length > 0 && (
                  <div className="mt-3 px-4 py-3 bg-[#F5D800]/8 rounded-xl border border-[#F5D800]/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#b89000] mb-2">Saved — {totalQty} total pieces</p>
                    <div className="flex flex-wrap gap-1.5">
                      {orderRows.filter(r => r.variantId && r.qty > 0).map(r => {
                        const v = product.variants.find(vv => vv.id === r.variantId);
                        return (
                          <span key={r.id} className="inline-flex items-center gap-1 bg-[#F5D800] text-black text-[11px] font-bold px-2.5 py-1 rounded-full">
                            {r.color} · {v?.size_details?.name || v?.size} · ×{r.qty}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}
            {isPromo && (
              <>
                <SectionCard
                  step={1} title="Select Quantity"
                  subtitle={`Minimum order quantity is ${promoMinQty} piece${promoMinQty === 1 ? "" : "s"}. Price drops automatically as you order more.`}
                  status={totalQty >= promoMinQty ? "done" : "required"}
                >
                  {hasTierPricing ? (
                    <SageQuantityPricing
                      key={`${activeVariant?.id ?? "none"}-${sageRemountKey}`}
                      metaStr={promoMetaStr}
                      minOrderQuantity={promoMinQty}
                      stock={activeVariant?.stock}
                      variant="compact"
                      initialQty={activeVariant ? (variantQty[activeVariant.id] ?? promoMinQty) : promoMinQty}
                      onChange={({ quantity }) => {
                        if (activeVariant) setPromoQty(activeVariant.id, quantity);
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-4 py-6">
                      <button
                        onClick={() => {
                          if (!activeVariant) return;
                          setPromoQty(activeVariant.id, (variantQty[activeVariant.id] ?? promoMinQty) - 1);
                        }}
                        disabled={(variantQty[activeVariant?.id ?? -1] ?? promoMinQty) <= promoMinQty}
                        className={cn(
                          "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all",
                          (variantQty[activeVariant?.id ?? -1] ?? promoMinQty) <= promoMinQty
                            ? "border-gray-100 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      ><Minus size={20} /></button>
                      <input
                        type="number"
                        value={activeVariant ? (variantQty[activeVariant.id] ?? promoMinQty) : promoMinQty}
                        min={promoMinQty}
                        onChange={e => {
                          if (activeVariant) setPromoQty(activeVariant.id, Number(e.target.value));
                        }}
                        onBlur={e => {
                          if (activeVariant) setPromoQty(activeVariant.id, Number(e.target.value));
                        }}
                        className="w-24 h-12 rounded-2xl border-2 border-gray-200 text-center text-lg font-black text-gray-900 outline-none focus:border-[#F5D800] transition-all"
                      />
                      <button
                        onClick={() => {
                          if (!activeVariant) return;
                          setPromoQty(activeVariant.id, (variantQty[activeVariant.id] ?? promoMinQty) + 1);
                        }}
                        className="w-12 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      ><Plus size={20} /></button>
                      <div className="pl-2 border-l border-gray-200">
                        <p className="text-[10px] text-gray-400">Unit price</p>
                        <p className="text-xl font-black text-gray-900">${basePrice.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {totalQty > 0 && totalQty < promoMinQty && (
                    <p className="text-xs text-red-500 font-semibold mt-3 text-center">
                      Minimum order quantity for this product is {promoMinQty}.
                    </p>
                  )}
                </SectionCard>
                <SectionCard
                  step={2} title="Upload Your Logo"
                  subtitle="Upload a logo or add custom text to personalize this product."
                  status="optional"
                >
                  <LogoCanvasSection {...logoCanvasSectionProps()} />
                </SectionCard>
              </>
            )}
          </div>
          <div className="xl:sticky xl:top-[60px] self-start">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart size={16} className="text-[#F5D800]" />
                <h2 className="text-sm font-black text-gray-900">Order Summary</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  {(previewUrl || displayImage) && (
                    <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={previewUrl || displayImage!} alt={product.name} className="w-full h-full object-contain bg-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                    {selectedColor && <p className="text-xs text-gray-500 mt-0.5">Current: {selectedColor}</p>}
                    <span className={cn("inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                      isApparel ? "bg-blue-50 text-blue-600" :
                        isPreMade ? "bg-purple-50 text-purple-600" :
                          "bg-orange-50 text-orange-600")}>
                      {isApparel ? "Apparel & Uniforms" : isPreMade ? "Pre-Made" : "Promo Product"}
                    </span>
                  </div>
                </div>
                {configuredVariants.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    {configuredVariants.map((cv, item) => (
                      <div
                        key={`${cv.variantId}-${item}`}
                        className="px-3 py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {(() => {
                              const safeName = cv.variantName || cv.color || `Variant #${cv.variantId}`;
                              const [colorPart, sizePart] = safeName.split(" · ");
                              return (
                                <span className="text-xs font-bold text-gray-900 truncate">
                                  {colorPart}
                                  {sizePart && (
                                    <span className="font-semibold text-gray-500"> · {sizePart}</span>
                                  )}
                                </span>
                              );
                            })()}
                            <span className="text-[11px] text-gray-400 flex-shrink-0">×{cv.totalQty}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-gray-700">
                              ${formatMoney(cv.totalPrice)}
                            </span>
                            <button
                              onClick={() => removeConfiguredVariant(cv.variantName)}
                              className="text-gray-300 hover:text-red-400"
                              title="Remove this variant"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 pl-0.5 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>
                              Item ({cv.totalQty} × $
                              {formatMoney(cv.totalQty > 0 ? cv.productTotal / cv.totalQty : 0)})
                            </span>
                            <span>${formatMoney(cv.productTotal)}</span>
                          </div>
                          {cv.decorationTotal > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>
                                Decoration ({cv.totalQty} × $
                                {formatMoney(
                                  cv.totalQty > 0 ? cv.decorationTotal / cv.totalQty : 0
                                )})
                              </span>
                              <span>${formatMoney(cv.decorationTotal)}</span>
                            </div>
                          )}
                          {cv.digitizingFeeTotal > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-[#b89000] font-semibold">
                              <span>Digitizing Fee (one-time)</span>
                              <span>${formatMoney(cv.digitizingFeeTotal)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-700">Total — {grandConfiguredQty} pcs</span>
                      <span className="text-xs font-black text-gray-900">${formatMoney(grandConfiguredPrice)}</span>
                    </div>
                  </div>
                )}
                {isPreMade && activeSizes.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      Current Selection
                    </div>
                    {activeSizes.map(({ variant_id, quantity }) => {
                      const v = product.variants.find(vv => vv.id === variant_id);
                      if (!v) return null;
                      return (
                        <div key={variant_id} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-700">
                              {v.size_details?.name || v.size}
                            </span>
                            <span className="text-xs text-gray-500">{v.color ? `${v.color} · ` : ""}×{quantity}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            ${formatMoney(calculateVariantTotal({ productPrice: getVariantPrice(v) || basePrice, decorationPrice: 0, quantity }).total)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-700">{totalQty} total pieces</span>
                      <span className="text-xs font-black text-gray-900">${formatMoney(preMadeSelectionPricing.total)}</span>
                    </div>
                  </div>
                )}
                {isApparel && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      Quantity
                    </div>
                    <div className="flex items-center justify-between px-3 py-3">
                      <button
                        onClick={() => {
                          if (!activeVariant) return;
                          const min = getMaterialFloor(selectedMaterial);
                          setQty(activeVariant.id, Math.max(min, currentQty - 1));
                        }}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                   <input
  type="text"
  inputMode="numeric"
  
  value={apparelQtyInput}
  onChange={(e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setApparelQtyInput(digitsOnly);
  }}
  onBlur={(e) => {
    if (!activeVariant) return;
    const min = getMaterialFloor(selectedMaterial);
    const val = Number(e.target.value);
    const safe = Number.isFinite(val) && val > 0 ? Math.floor(val) : min;
    const clamped = Math.max(min, safe);
    setQty(activeVariant.id, clamped);
    setApparelQtyInput(String(clamped));
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  }}
  className="w-16 text-lg font-black text-center outline-none focus:border-[#F5D800] border-2 border-transparent focus:border-2 rounded-lg bg-transparent"
/>
                      <button
                        onClick={() => {
                          if (!activeVariant) return;
                          setQty(activeVariant.id, currentQty + 1);
                        }}
                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {isApparel && currentQty > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      Current Selection
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {selectedColor && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Color</span>
                          <span className="text-xs font-bold text-gray-800">
                            {selectedColor}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Size</span>
                        <span className="text-xs font-bold text-gray-800">
                          {activeVariant?.size_details?.name || activeVariant?.size
                            ? ` ${activeVariant?.size_details?.name || activeVariant?.size}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {isApparel && (selectedLocations.length > 0 || selectedMaterial) && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">Print Details</div>
                    <div className="px-3 py-2 space-y-1.5">
                      {selectedMaterial && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Method</span>
                          <span className="text-xs font-bold text-gray-800">{MATERIALS.find(m => m.id === selectedMaterial)?.label}</span>
                        </div>
                      )}
                      {selectedLocations.length > 0 && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">Locations</span>
                          <span className="text-xs font-bold text-gray-800 text-right">
                            {selectedLocations.map(id => ALL_PRINT_LOCATIONS.find(l => l.id === id)?.label ?? id).join(", ")}
                          </span>
                        </div>
                      )}
                      {printPrice !== null && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            price
                          </span>
                          <span className="text-xs font-black text-gray-900">${formatMoney(productTotal + decorationTotal)}
                          </span>
                        </div>
                      )}
                      {digitizingFee > 0 && (
                        <div className="flex items-center justify-between gap-2 bg-[#FFFBEA] -mx-3 px-3 py-1.5 border-t border-[#F5D800]/20">
                          <span className="text-xs text-[#b89000] font-semibold">
                            Digitizing Fee{" "}
                            <span className="text-[10px] font-normal text-[#8A6D00]">
                              (Free on 12+ pieces)
                            </span>
                          </span>
                          <span className="text-xs font-black text-[#b89000]">
                            ${formatMoney(digitizingFee)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="rounded-xl bg-gray-900 text-white p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold opacity-70">Estimated Total</span>
                    <span className="text-xl font-black text-[#F5D800]">
                      ${formatMoney(displayTotal)}
                    </span>
                  </div>
                </div>
                {isApparel && selectedMaterial && currentQty > 0 && currentQty < 144 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                    <Zap size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      {(() => {
                        const milestones = [12, 24, 36, 50, 72, 100, 144];
                        for (const m of milestones) { if (currentQty < m) return `${m - currentQty} more pieces unlocks the ${m}-pc tier.`; }
                        return "";
                      })()}
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  {REQUIREMENTS.map(({ key, label, done }) => (
                    <div key={key} className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                      done ? "bg-[#F5D800]/10 text-[#b89000]" :
                        showValidationShake ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
                    )}>
                      {done ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <Circle size={14} className="flex-shrink-0 opacity-40" />}
                      {label}
                    </div>
                  ))}
                </div>
                {validationError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-500 leading-relaxed">{validationError}</p>
                  </div>
                )}
                <button onClick={handleAddToCart}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    showValidationShake ? "animate-[shake_0.4s_ease-in-out]" : "",
                    (!allMet && configuredVariants.length === 0) ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200" :
                      inCart ? "bg-[#F5D800]/10 text-[#b89000] border-2 border-[#F5D800]/40" :
                        "bg-[#F5D800] text-black hover:bg-[#e6ca00] shadow-md"
                  )}>
                  <ShoppingCart size={16} />
                  {inCart ? "Added to Cart ✓" : "Add to Cart"}
                </button>
                <button onClick={handleWishlist} disabled={wishlistLoading}
                  className={cn(
                    "w-full h-11 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    wishlistLoading ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" :
                      inWishlist ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100" :
                        "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  )}>
                  {wishlistLoading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Heart size={15} fill={inWishlist ? "currentColor" : "none"} />
                  }
                  {inWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {product && (
        <AddProductConfigurationModal
          open={showConfigModal}
          onClose={() => { setShowConfigModal(false); setJustStagedVariantIds([]); }}
          onConfirm={handleConfigConfirm}
          productId={productDataId}
          productName={product?.name ?? ""}
          variants={allProductVariants}
          sizes={allSizes}
          selectedVariant={variantData ?? undefined}
          mode="customized"
          isSubmitting={configSubmitting}
          decorationUnitPrice={decorationUnitPrice}
          selectedMaterial={selectedMaterial ?? ""}
          spColorCount={spColorCount}
          dtgStyle={dtgStyle}
          selectedLocations={selectedLocations}
          isApparel={isApparel}
          isPreMade={isPreMade}
          isPromo={isPromo}
          previousTotal={grandConfiguredPrice}
          previousQty={grandConfiguredQty}
        />
      )}
      {product && (
        <AddToCartModal
          open={showCartModal}
          onClose={() => setShowCartModal(false)}
          productId={Number(product.id)}
          variantId={activeVariant?.id ?? 0}
          name={product.name}
          price={promoUnitPrice ?? basePrice}
          initialQuantity={totalQty}
          sageMetaStr={promoMetaStr}
          customization={customizationJson}
          canvasBlob={canvasBlob}
          printPricePerPiece={(printPrice ?? 0) / Math.max(currentQty, 1)}
          digitizingFee={digitizingFee}
          configuredVariants={
            (pendingVariantList.length > 0 ? pendingVariantList : configuredVariants).length > 0
              ? (pendingVariantList.length > 0 ? pendingVariantList : configuredVariants)
              : undefined
          }
          isApparel={isApparel}
          isPreMade={isPreMade}
          isPromo={isPromo}
          onSuccess={() => {
            refreshCart();
            setInCart(true);
            setShowCartModal(false);
            resetCustomizationState();
          }}
        />
      )}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
  function logoCanvasSectionProps() {
    return {
      canvasRef, fileRef, productImg, logoImg, logoSrc, logoSize, logoRotation,
      logoOpacity, logoPos, customText, textSize, textColor, textRotation,
      fontFamily, textBold, textItalic, textShadow, textOpacity, textPos,
      activeTab, dragging,
      setLogoSrc, setLogoSize, setLogoRotation, setLogoOpacity, setLogoPos,
      setCustomText, setTextSize, setTextColor, setTextRotation, setFontFamily,
      setTextBold, setTextItalic, setTextShadow, setTextOpacity, setActiveTab,
      handleCanvasMouseDown, handleCanvasMouseMove, stopDrag, getCursor,
      handleOpenPreview, setLogoImg,
      CANVAS_SIZE, FONTS, PRESET_COLORS,
      garmentViews, activeViewIdx, setActiveViewIdx, isApparel,
      handleRemoveLogoBackground, isRemovingLogoBg,
      autoRemoveBg, setAutoRemoveBg, bgRemoved, setBgRemoved,
    };
  }
}
function LogoCanvasSection({
  canvasRef, fileRef, productImg, logoImg, logoSrc, logoSize, logoRotation,
  logoOpacity, logoPos, customText, textSize, textColor, textRotation,
  fontFamily, textBold, textItalic, textShadow, textOpacity, textPos,
  activeTab, dragging,
  setLogoSrc, setLogoSize, setLogoRotation, setLogoOpacity, setLogoPos,
  setCustomText, setTextSize, setTextColor, setTextRotation, setFontFamily,
  setTextBold, setTextItalic, setTextShadow, setTextOpacity, setActiveTab,
  handleCanvasMouseDown, handleCanvasMouseMove, stopDrag, getCursor,
  handleOpenPreview, setLogoImg,
  CANVAS_SIZE, FONTS, PRESET_COLORS,
  garmentViews, activeViewIdx, setActiveViewIdx, isApparel,
  handleRemoveLogoBackground, isRemovingLogoBg,
  autoRemoveBg, setAutoRemoveBg, bgRemoved, setBgRemoved,
}: any) {
  return (
    <div className="flex flex-col xl:flex-row gap-5 items-start">
      <div className="w-full xl:w-[380px] flex-shrink-0">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F5D800] flex items-center justify-center">
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
          {isApparel && garmentViews?.length > 0 && (
            <div className="flex gap-1.5 px-3 pt-3 bg-[#fafafa]">
              {garmentViews.map((view: GarmentView, idx: number) => (
                <button
                  key={view.key}
                  onClick={() => setActiveViewIdx(idx)}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-[11px] font-bold transition-all",
                    activeViewIdx === idx
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-700 border border-transparent"
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
          )}
          <div className="p-3 bg-[#fafafa]">
            <canvas
              ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
              onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
              onMouseUp={stopDrag} onMouseLeave={stopDrag}
              className="w-full h-auto rounded-xl block border border-gray-200"
              style={{ cursor: getCursor() }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: "image", icon: ImageIcon, label: "Upload Logo" },
              { key: "text", icon: Type, label: "Custom Text" },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn("flex-1 flex items-center justify-center gap-2 h-12 text-sm font-bold transition-all border-b-2",
                  activeTab === key ? "text-gray-900 border-[#F5D800] bg-[#FFFBEA]" : "text-gray-400 border-transparent hover:bg-gray-50")}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
          <div className="p-5 space-y-4">
            {activeTab === "image" && (
              <>
                <input ref={fileRef} type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onloadend = () => {
                      const dataUrl = r.result as string;
                      setBgRemoved(false);
                      setLogoSrc(dataUrl);
                      setLogoRotation(0);
                      const defaultSize = 120;
                      setLogoSize(defaultSize);
                      setLogoPos({ x: (CANVAS_SIZE - defaultSize) / 2, y: (CANVAS_SIZE - defaultSize) / 2 });
                      if (autoRemoveBg) handleRemoveLogoBackground(dataUrl);
                    };
                    r.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-gray-700">Auto-remove background</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoRemoveBg}
                    onClick={() => setAutoRemoveBg((p: boolean) => !p)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      autoRemoveBg ? "bg-[#F5D800]" : "bg-gray-200"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                      autoRemoveBg ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
                {!logoImg ? (
                  <div onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#F5D800]/60 hover:bg-[#FFFBEA] transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:border-[#F5D800]/40 group-hover:bg-[#F5D800]/10 transition-all">
                      <Upload size={20} className="text-gray-400 group-hover:text-[#F5D800] transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">Click to upload logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — max 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white overflow-hidden flex-shrink-0">
                        <img src={logoSrc!} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">Logo uploaded</p>
                        <p className="text-[10px] text-gray-400">
                          {isRemovingLogoBg
                            ? "Removing background…"
                            : bgRemoved
                              ? "Background removed — drag on canvas to reposition"
                              : "Drag on canvas to reposition"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleRemoveLogoBackground()} disabled={isRemovingLogoBg}
                          title={isRemovingLogoBg ? "Removing background…" : "Remove Background"}
                          className="w-8 h-8 rounded-lg border border-[#F5D800]/60 bg-[#FFFBEA] flex items-center justify-center hover:bg-[#F5D800]/20 text-[#b89000] disabled:opacity-60 disabled:cursor-not-allowed">
                          {isRemovingLogoBg ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        </button>
                        <button onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500"><Upload size={13} /></button>
                        <button onClick={() => { setLogoSrc(null); setLogoImg(null); setBgRemoved(false); }} className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <Slider label="Size" value={logoSize} min={40} max={280} unit="px" onChange={setLogoSize} />
                    <Slider label="Rotation" value={logoRotation} min={0} max={360} unit="°" onChange={setLogoRotation} />
                    <Slider label="Opacity" value={Math.round(logoOpacity * 100)} min={10} max={100} unit="%" onChange={(v: number) => setLogoOpacity(v / 100)} />
                    <div className="flex gap-2">
                      <button onClick={() => setLogoRotation((p: number) => (p - 15 + 360) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><RotateCcw size={13} /> Left</button>
                      <button onClick={() => setLogoRotation((p: number) => (p + 15) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><RotateCw size={13} /> Right</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === "text" && (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Text</p>
                  <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Type something..."
                    className="w-full h-11 rounded-xl border-2 border-gray-200 px-4 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#F5D800] transition-all" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Font</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((f: any) => (
                      <button key={f.value} onClick={() => setFontFamily(f.value)} style={{ fontFamily: f.value }}
                        className={cn("h-10 rounded-xl border-2 text-sm transition-all px-3 text-left truncate",
                          fontFamily === f.value ? "border-[#F5D800] bg-[#FFFBEA] text-[#b89000] font-bold" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {([
                    { label: "B", active: textBold, toggle: () => setTextBold((p: boolean) => !p), cls: "font-black" },
                    { label: "I", active: textItalic, toggle: () => setTextItalic((p: boolean) => !p), cls: "italic" },
                    { label: "Shadow", active: textShadow, toggle: () => setTextShadow((p: boolean) => !p), cls: "" },
                  ]).map(({ label, active, toggle, cls }) => (
                    <button key={label} onClick={toggle}
                      className={cn("h-10 px-4 rounded-xl border-2 text-sm transition-all", cls,
                        active ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c: string) => (
                      <button key={c} onClick={() => setTextColor(c)} style={{ background: c }}
                        className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                          textColor === c ? "border-[#F5D800] scale-110 ring-2 ring-[#F5D800]/30" : "border-gray-200 shadow-sm")} />
                    ))}
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white ml-auto" />
                  </div>
                </div>
                <Slider label="Font Size" value={textSize} min={12} max={96} unit="px" onChange={setTextSize} />
                <Slider label="Rotation" value={textRotation} min={0} max={360} unit="°" onChange={setTextRotation} />
                <Slider label="Opacity" value={Math.round(textOpacity * 100)} min={10} max={100} unit="%" onChange={(v: number) => setTextOpacity(v / 100)} />
                <div className="flex gap-2">
                  <button onClick={() => setTextRotation((p: number) => (p - 15 + 360) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><RotateCcw size={13} /> Left</button>
                  <button onClick={() => setTextRotation((p: number) => (p + 15) % 360)} className="flex-1 h-9 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><RotateCw size={13} /> Right</button>
                </div>
                {customText.trim() && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Preview</p>
                    <p style={{
                      fontFamily, fontSize: Math.min(textSize, 28), color: textColor,
                      fontWeight: textBold ? 700 : 400, fontStyle: textItalic ? "italic" : "normal",
                      textShadow: textShadow ? "2px 2px 4px rgba(0,0,0,0.3)" : "none",
                      opacity: textOpacity, lineHeight: 1.4
                    }}>
                      {customText}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}