"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Circle, X, ChevronDown, ChevronUp, Table2,
  Upload, RotateCw, RotateCcw, Download, Sparkles, Eye, ImageDown,
  AlertCircle, Loader2, Plus, Minus, Type, Image as ImageIcon,
  Trash2, ShoppingCart, Heart, Zap, Package, Palette,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductVariantByIdApi } from "@/api/operations/product.api";
import AddToCartModal from "@/components/common/AddToCartModal";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import SageQuantityPricing, { getSageUnitPrice, parseSageMeta } from "./Sagequantitypricing";

/* ─────────────────────────────────────────── Types ── */
interface Size { id: number; name: string; measurements?: string }
interface VariantImage { id: number; file_name: string; file_uri: string; is_primary: boolean }
interface Variant {
  meta: any;
  eta: any;
  id: number; product_id: number; sku: string;
  color: string; color_code: string;
  size: string; size_id: number;
  price: string; stock: number;
  min_order_quantity: number; max_order_quantity: number | null;
  is_active: boolean; is_in_cart?: boolean; is_in_wishlist?: boolean;
  wishlist_id?: number | null; images: VariantImage[]; size_details: Size;
}
interface Product {
  product: any;
  images: any;
  id: string; name: string; price: number; image: string;
  description?: string; sizes: Size[]; attachments: any[];
  categories: any[];
  variants: Variant[]; brand?: any;
}

/* ─────────────────────────────────────────── Constants ── */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const CANVAS_SIZE = 500;
type MaterialId = "embroidery" | "dtf" | "screenprint" | "dtg";

const MATERIALS = [
  { id: "embroidery" as MaterialId, label: "Embroidery", desc: "Premium thread-stitched branding", bestFor: "Polos, jackets, uniforms", badge: "All Fabrics", emoji: "🧵" },
  { id: "dtf" as MaterialId, label: "DTF Print", desc: "Full-color Direct-to-Film transfers", bestFor: "Small runs, multi-color logos", badge: "No Minimum", emoji: "🖨️" },
  { id: "screenprint" as MaterialId, label: "Screen Print", desc: "Bold solid colors for bulk orders", bestFor: "Tees, hoodies, bulk orders", badge: "Min 50 pcs", emoji: "🎨" },
  { id: "dtg" as MaterialId, label: "DTG Print", desc: "Photo-quality prints on cotton", bestFor: "100% cotton tees", badge: "No Minimum", emoji: "👕" },
];

type GarmentType = "tshirt" | "hoodie" | "hat" | "polo";
interface GarmentView {
  key: string;
  label: string;
  mockup: string;
  hotspots: { id: string; label: string; top: string; left: string }[];
}

const GARMENT_VIEWS: Record<GarmentType, GarmentView[]> = {
  tshirt: [
    {
      key: "FRONT", label: "Front",
      mockup: "/assets/customization_preview_image/tshirt_front.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "28%", left: "38%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "28%", left: "62%" },
        { id: "FULL_FRONT", label: "Full Front", top: "44%", left: "50%" },
      ],
    },
    {
      key: "BACK", label: "Back",
      mockup: "/assets/customization_preview_image/tshirt_back.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "44%", left: "50%" }],
    },
    {
      key: "LEFT_SLEEVE", label: "Left Sleeve",
      mockup: "/assets/customization_preview_image/tshirt_left_sleeve.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "L. Sleeve", top: "30%", left: "30%" }],
    },
    {
      key: "RIGHT_SLEEVE", label: "Right Sleeve",
      mockup: "/assets/customization_preview_image/tshirt_right_sleeve.png",
      hotspots: [{ id: "SLEEVE_RIGHT", label: "R. Sleeve", top: "30%", left: "70%" }],
    },
  ],
  hoodie: [
    {
      key: "FRONT", label: "Front",
      mockup: "/assets/customization_preview_image/hoodies_front.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "28%", left: "38%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "28%", left: "62%" },
        { id: "FULL_FRONT", label: "Full Front", top: "44%", left: "50%" },
      ],
    },
    {
      key: "BACK", label: "Back",
      mockup: "/assets/customization_preview_image/hoodies_back.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "44%", left: "50%" }],
    },
    {
      key: "SIDE", label: "Side",
      mockup: "/assets/customization_preview_image/hoodies_side.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "Sleeve", top: "35%", left: "50%" }],
    },
  ],
  hat: [
    {
      key: "FRONT", label: "Front",
      mockup: "/assets/customization_preview_image/hat_front.png",
      hotspots: [{ id: "HAT_FRONT", label: "Front", top: "40%", left: "50%" }],
    },
    {
      key: "BACK", label: "Back",
      mockup: "/assets/customization_preview_image/hat_back.png",
      hotspots: [{ id: "HAT_BACK_ARCH", label: "Back Arch", top: "40%", left: "50%" }],
    },
    {
      key: "SIDE", label: "Side",
      mockup: "/assets/customization_preview_image/hat_side.png",
      hotspots: [{ id: "HAT_SIDE", label: "Side", top: "40%", left: "50%" }],
    },
  ],
  polo: [
    {
      key: "FRONT", label: "Front",
      mockup: "/assets/customization_preview_image/polo_front.png",
      hotspots: [
        { id: "LEFT_CHEST", label: "L. Chest", top: "28%", left: "38%" },
        { id: "RIGHT_CHEST", label: "R. Chest", top: "28%", left: "62%" },
        { id: "FULL_FRONT", label: "Full Front", top: "44%", left: "50%" },
      ],
    },
    {
      key: "BACK", label: "Back",
      mockup: "/assets/customization_preview_image/polo_back.png",
      hotspots: [{ id: "FULL_BACK", label: "Full Back", top: "44%", left: "50%" }],
    },
    {
      key: "SIDE", label: "Side",
      mockup: "/assets/customization_preview_image/polo_side.png",
      hotspots: [{ id: "SLEEVE_LEFT", label: "Sleeve", top: "35%", left: "50%" }],
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
  { label: "1–11", min: 1, max: 11 }, { label: "12–23", min: 12, max: 23 },
  { label: "24–35", min: 24, max: 35 }, { label: "36–71", min: 36, max: 71 },
  { label: "72–95", min: 72, max: 95 }, { label: "96–143", min: 96, max: 143 },
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
  "1 Color": [6.58, 4.40], "2 Color": [9.43, 7.98], "3 Color": [11.55, 9.54],
};
const DTG_TIERS = [{ min: 1 }, { min: 24 }, { min: 48 }, { min: 100 }];
const DTG_PRICES: Record<string, number[]> = {
  "Front Regular": [15, 12, 11, 9],
  "Oversized": [20, 17, 16, 14],
  "Front & Back Regular": [30, 24, 22, 18],
  "Front & Back Oversized": [40, 34, 32, 28],
};

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
    img.src = src;
  });

const isValidCssColor = (value: string): boolean => {
  if (!value) return false;
  if (typeof window === "undefined" || typeof CSS === "undefined" || !CSS.supports) return true;
  try { return CSS.supports("color", value); } catch { return false; }
};

const resolveColorToken = (raw: string): string => {
  const trimmed = raw.trim();
  if (isValidCssColor(trimmed)) return trimmed;
  const hexCandidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (isValidCssColor(hexCandidate)) return hexCandidate;
  const key = trimmed.toLowerCase();
  if (COLOR_NAME_FALLBACKS[key]) return COLOR_NAME_FALLBACKS[key];
  return "#d1d5db";
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
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
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
interface Props { variantDataId: number }

export default function ProductCustomizationPage({ variantDataId }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isLoggedIn = mounted && !!localStorage.getItem("hastagBillionaire");
  const [variantData, setVariantData] = useState<Variant | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasBlobRef = useRef<Blob | null>(null);

  /* ── Fetch product ── */
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("hastagBillionaire") : null;
      if (!token) { console.error("Token not found"); return; }
      const res = await ProductVariantByIdApi(String(variantDataId));
      setProduct(res?.data?.data || res?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (variantDataId) fetchProduct(); }, [variantDataId]);

  /* ══════════════════════════════════════════════════════════════════════
     ▌ CATEGORY TYPE DETECTION
     ▌ Reads: categories[].parent_categories[].grand_categories[].title
     ▌
     ▌  "Apparel & Uniforms" → isApparel = true
     ▌  "Pre-Made"           → isPreMade = true
     ▌  anything else        → isPromo   = true  (Promo Products, etc.)
  ══════════════════════════════════════════════════════════════════════ */
  const grandCategoryTitle = useMemo((): string => {
    if (!product) return "";
    for (const cat of product?.product.categories ?? []) {
      for (const parent of cat.parent_categories ?? []) {
        for (const grand of parent.grand_categories ?? []) {
          if (grand.title) return grand.title as string;
        }
      }
    }
    return "";
  }, [product]);
  console.log(grandCategoryTitle, "grandCategoryTitle")
  const isApparel = grandCategoryTitle === "Apparel & Uniforms";
  const isPreMade = grandCategoryTitle === "Pre-Made";
  const isPromo = !isApparel && !isPreMade; // Promo Products + everything else

  /* ── Auth ── */
  const [showLoginModal, setShowLoginModal] = useState(false);
  const requireLogin = () => {
    if (!isLoggedIn) { setShowLoginModal(true); return true; }
    return false;
  };
  /* ───────── Grand Category (Apparel, Pre-Made, etc.) ───────── */
  const grandCategory = useMemo((): string => {
    if (!product) return "";

    return (
      product.product.categories
        ?.flatMap((c: any) => c.parent_categories ?? [])
        .flatMap((p: any) => p.grand_categories ?? [])
        .map((g: any) => g.title?.toLowerCase().trim())
        .find(Boolean) ?? ""
    );
  }, [product]);

  /* ───────── Parent Category (Hat, Polo, Hoodie, etc.) ───────── */
  const parentCategory = useMemo((): string => {
    if (!product) return "";

    return (
      product?.product.categories
        ?.flatMap((c: any) => c.parent_categories ?? [])
        .map((p: any) => p.title?.toLowerCase().trim())
        .find(Boolean) ?? ""
    );
  }, [product]);

  /* ───────── Section Type (Based on Grand Category) ───────── */
const garmentType = useMemo<GarmentType>(() => {
  const category = grandCategory?.toLowerCase().trim();

  // Map broad categories to specific garment view types
  if (category?.includes("apparel") || 
      category?.includes("uniform") || 
      category === "clothing") {
    
    // Try to detect more specific type from parentCategory
    const parent = parentCategory?.toLowerCase().trim();
    
    if (parent?.includes("hoodie") || parent?.includes("sweatshirt")) return "hoodie";
    if (parent?.includes("hat") || parent?.includes("cap") || parent?.includes("headwear")) return "hat";
    if (parent?.includes("polo")) return "polo";
    
    // Default for most apparel
    return "tshirt";
  }

  if (category?.includes("pre-made") || 
      category?.includes("premade") || 
      category?.includes("pre made")) {
    return "tshirt"; // or "polo" depending on your common pre-made items
  }

  // Fallback
  return "tshirt";
}, [grandCategory, parentCategory]);
  /* ───────── Image / Placement Type (Based on Parent Category) ───────── */
  const imageType = useMemo(() => {
    switch (parentCategory) {
      case "hat":
      case "hats":
      case "cap":
      case "caps":
      case "headwear":
      case "beanies":
        return "hat";

      case "hoodie":
      case "hoodies":
      case "hoodies/sweatshirts":
      case "sweatshirt":
      case "sweatshirts":
        return "hoodie";

      case "polo":
      case "polos":
        return "polo";

      case "jacket":
      case "jackets":
      case "vest":
      case "vests":
      case "outerwear":
        return "jacket";

      default:
        return "tshirt";
    }
  }, [parentCategory]);

  console.log({
    grandCategory,
    parentCategory,
    garmentType,
    imageType,
  });
  const garmentViews = useMemo(() => GARMENT_VIEWS[garmentType], [garmentType]);
  const [activeViewIdx, setActiveViewIdx] = useState(0);
  const activeView = garmentViews[activeViewIdx] ?? garmentViews[0];
  useEffect(() => { setActiveViewIdx(0); }, [garmentType]);

  /* ── Color state ── */
  const [selectedColor, setSelectedColor] = useState("");

  const colors = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, string>();
    product.variants?.forEach(v => {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, resolveColorToken(v.color_code || v.color));
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product]);

  useEffect(() => {
    if (product?.variants?.length && !selectedColor) {
      setSelectedColor(product.variants[0].color);
    }
  }, [product]);

  useEffect(() => {
    setVariantQty({});
    setProductImg(null);
    setLogoPos({ x: 190, y: 190 });
  }, [selectedColor]);

  const colorVariants = useMemo(() => {
    if (!selectedColor) return [];
    let variants = product?.variants?.filter(v =>
      v.color === selectedColor ||
      v.color?.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    ) ?? [];
    if (variants.length === 0 && variantData &&
      (variantData.color === selectedColor ||
        variantData.color?.trim().toLowerCase() === selectedColor.trim().toLowerCase())) {
      variants = [variantData];
    }
    if (variants.length === 0 && variantData) variants = [variantData];
    return variants;
  }, [product?.variants, selectedColor, variantData]);

  /* ── Per-variant quantities ── */
  const [variantQty, setVariantQty] = useState<Record<number, number>>({});
  const setQty = (variantId: number, qty: number) =>
    setVariantQty(prev => ({ ...prev, [variantId]: Math.max(0, qty) }));

  const totalQty = useMemo(
    () => Object.values(variantQty).reduce((a, b) => a + b, 0),
    [variantQty]
  );
  const activeSizes = useMemo(
    () => Object.entries(variantQty)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => ({ variant_id: Number(id), quantity })),
    [variantQty]
  );
 const promoMetaStr = colorVariants[0]?.meta ?? colorVariants[0]?.eta ?? null;
const parsedPromoMeta = parseSageMeta(promoMetaStr);

const hasTierPricing = !!parsedPromoMeta && 
                      Array.isArray(parsedPromoMeta.priceTiers) && 
                      Array.isArray(parsedPromoMeta.qtyTiers);
  /* ── Display image ── */
  const displayImage = useMemo(() => {
    if (!product) return null;
    console.log(product, "product")
    const primary = product?.images?.find((img: any) => img.is_primary) || product?.images?.[0];
    if (!primary) return null;
    return primary.file_uri?.startsWith("http") ? primary.file_uri : `${BASE_URL}${primary.file_uri}`;
  }, [product]);

  /* ── Print locations (Apparel only) ── */
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const toggleLocation = (id: string) =>
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );

  /* ── Material (Apparel only) ── */
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId | null>(null);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [spColorCount, setSpColorCount] = useState<"1 Color" | "2 Color" | "3 Color">("1 Color");
  const [dtgStyle, setDtgStyle] = useState<keyof typeof DTG_PRICES>("Front Regular");

  const handleSelectMaterial = (id: MaterialId) => {
    setSelectedMaterial(id);
    setShowPriceTable(true);
    if (id === "screenprint") {
      const updated: Record<number, number> = {};
      Object.entries(variantQty).forEach(([k, v]) => { updated[Number(k)] = Math.max(50, v); });
      setVariantQty(updated);
    }
  };

  /* ── Canvas / design state ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [dragging, setDragging] = useState<"logo" | "text" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  /* ── Cart / wishlist ── */
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

  /* ── Load product image onto canvas ── */
  useEffect(() => {
    if (!displayImage) { setProductImg(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const b64 = await toBase64ViaSameOrigin(displayImage);
        if (cancelled) return;
        const img = await loadImage(b64);
        if (!cancelled) setProductImg(img);
      } catch (err) { console.error("Failed to load product image onto canvas:", err); }
    })();
    return () => { cancelled = true; };
  }, [displayImage]);

  /* ── Load uploaded logo ── */
  useEffect(() => {
    if (!logoSrc) { setLogoImg(null); return; }
    let cancelled = false;
    loadImage(logoSrc).then(img => { if (!cancelled) setLogoImg(img); });
    return () => { cancelled = true; };
  }, [logoSrc]);

  /* ── Redraw canvas ── */
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

  // Auto set default quantity for Promo products
  useEffect(() => {
    if (isPromo && colorVariants.length > 0 && Object.keys(variantQty).length === 0) {
      const defaultQty = colorVariants[0].min_order_quantity || 1;
      setQty(colorVariants[0].id, defaultQty);
    }
  }, [isPromo, colorVariants, variantQty]);
  /* ── Canvas drag helpers ── */
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
      ? pt.x >= textPos.x && pt.x <= textPos.x + textSize * customText.length * 0.65
      && pt.y >= textPos.y - textSize && pt.y <= textPos.y + 8
      : false;
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pt = getPoint(e);
    if (isOverLogo(pt)) { setDragging("logo"); setDragOffset({ x: pt.x - logoPos.x, y: pt.y - logoPos.y }); }
    else if (isOverText(pt)) { setDragging("text"); setDragOffset({ x: pt.x - textPos.x, y: pt.y - textPos.y }); }
  };
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getPoint(e);
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
  const getCursor = () => dragging ? "grabbing" : (logoImg || customText.trim()) ? "grab" : "default";

  /* ── Pricing (Apparel only) ── */
  const getPrintPrice = (): number | null => {
    if (!selectedMaterial || activeSizes.length === 0 || selectedLocations.length === 0) return null;
    const qty = totalQty;
    if (selectedMaterial === "embroidery") {
      const ti = EMB_TIERS.findIndex(t => qty >= t.min && qty <= t.max);
      let total = 0;
      for (const loc of selectedLocations) {
        const row = EMB_PRICES[loc];
        if (!row) return null;
        total += (ti >= 0 ? row[ti] : row[row.length - 1]) * qty;
      }
      return total + (qty <= 11 ? 35 : 0);
    }
    if (selectedMaterial === "dtf") {
      const ti = DTF_TIERS.reduce((f, t, i) => (qty >= t ? i : f), 0);
      return DTF_PRICES[ti] * qty * selectedLocations.length;
    }
    if (selectedMaterial === "screenprint") {
      if (qty < 50) return null;
      return SP_PRICES[spColorCount][qty >= 100 ? 1 : 0] * qty * selectedLocations.length;
    }
    if (selectedMaterial === "dtg") {
      const ti = DTG_TIERS.reduce((f, t, i) => (qty >= t.min ? i : f), 0);
      return DTG_PRICES[dtgStyle][ti] * qty * selectedLocations.length;
    }
    return null;
  };
  const getPromoPriceTableData = () => {
  if (!hasTierPricing || !parsedPromoMeta) return null;

  const { priceTiers, qtyTiers } = parsedPromoMeta;
  const tiers = qtyTiers.map((qty: string, index: number) => ({
    qty: parseInt(qty),
    price: parseFloat(priceTiers[index] || "0")
  }));

  return tiers;
};
const printPrice = getPrintPrice();
const basePrice = product ? (colorVariants[0]?.price ? Number(colorVariants[0].price) : product.price) : 0;
const estimatedTotal = basePrice * totalQty + (printPrice ?? 0);

// Safe Promo Price Calculation
let promoUnitPrice: number | null = null;
let promoTotal = 0;

if (isPromo) {
  promoUnitPrice = hasTierPricing 
    ? (getSageUnitPrice(promoMetaStr, totalQty) || basePrice)
    : basePrice;
  promoTotal = promoUnitPrice * totalQty;
}
  /* ══════════════════════════════════════════════════════════════════════
     ▌ REQUIREMENTS — conditionally built per category type
     ▌
     ▌  Apparel  → color + print location + print method
     ▌  Pre-Made → color + size & qty
     ▌  Promo    → color only
  ══════════════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════════════
     ▌ REQUIREMENTS — conditionally built per category type
     ▌
     ▌  Apparel  → color + print location + print method
     ▌  Pre-Made → color + size & qty
     ▌  Promo    → qty only (color is optional)
  ══════════════════════════════════════════════════════ */
  const REQUIREMENTS = [
    // Color is required only for Apparel & Pre-Made
    ...((isApparel || isPreMade) ? [
      { key: "color", label: "Color", done: !!selectedColor }
    ] : []),

    ...(isApparel ? [
      { key: "loc", label: "Print location", done: selectedLocations.length > 0 },
      { key: "mat", label: "Print method", done: !!selectedMaterial },
    ] : []),

    ...(isPreMade ? [
      { key: "size", label: "Size & qty", done: activeSizes.length > 0 },
    ] : []),

    ...(isPromo ? [
      { key: "qty", label: "Quantity", done: hasTierPricing ? totalQty > 0 : true },
    ] : []),
  ];
  const allMet = REQUIREMENTS.every(r => r.done);

  /* ── Order rows (Pre-Made only) ── */
  interface OrderRow { id: number; color: string; qty: number; variantId: number | "" }
  const [orderRows, setOrderRows] = useState<OrderRow[]>([
    { id: Date.now(), color: "", qty: 1, variantId: "" }
  ]);
  const addOrderRow = () =>
    setOrderRows(prev => [...prev, { id: Date.now(), color: "", qty: 1, variantId: "" }]);
  const removeOrderRow = (id: number) =>
    setOrderRows(prev => prev.filter(r => r.id !== id));
  const updateOrderRow = (id: number, field: keyof OrderRow, value: any) =>
    setOrderRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "color") updated.variantId = "";
      return updated;
    }));
  const saveOrderRows = () => {
    const valid = orderRows.filter(r => r.color && r.variantId && r.qty >= 1);
    const newQty: Record<number, number> = {};
    valid.forEach(r => { newQty[Number(r.variantId)] = (newQty[Number(r.variantId)] || 0) + r.qty; });
    setVariantQty(newQty);
    if (!selectedColor && valid[0]) setSelectedColor(valid[0].color);
  };
  const cancelOrderRows = () => {
    setOrderRows([{ id: Date.now(), color: "", qty: 1, variantId: "" }]);
    setVariantQty({});
  };

  /* ══════════════════════════════════════════════════════════════════════
     ▌ PAYLOAD BUILDER — conditionally built per category type
     ▌
     ▌  Apparel  → { print_method, locations, sizes }
     ▌  Pre-Made → { sizes }
     ▌  Promo    → {}  (only canvas blob / logo is sent)
  ══════════════════════════════════════════════════════════════════════ */
  const buildPayload = () => {
    /* ── Apparel & Uniforms ── */
    if (isApparel) {
      return [{
        print_method: selectedMaterial?.toUpperCase() ?? null,
        locations: selectedLocations.map(loc => ({ location: loc })),
        sizes: activeSizes,
        ...(customText.trim() ? { custom_text: customText.trim() } : {}),
        ...(selectedMaterial === "screenprint" ? { color_count: spColorCount } : {}),
        ...(selectedMaterial === "dtg" ? { print_area: dtgStyle } : {}),
      }];
    }
    /* ── Pre-Made ── */
    if (isPreMade) {
      return [{ sizes: activeSizes }];
    }

    if (hasTierPricing) {
      const unitPrice = getSageUnitPrice(promoMetaStr, totalQty);
      return [{ quantity: totalQty, unit_price: unitPrice }];
    }
    return [{}];
  };

  /* ── getBlob helper ── */
  const getBlob = (): Promise<Blob | null> =>
    new Promise((res) => {
      const canvas = canvasRef.current;
      if (!canvas) { console.warn("Canvas ref is null"); return res(null); }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawCanvas({
          ctx, size: CANVAS_SIZE, productImg, logo: logoImg,
          logoPos, logoSize, logoRotation, logoOpacity,
          text: customText, textPos, textSize, textColor,
          textRotation, fontFamily, textBold, textItalic, textShadow, textOpacity,
        });
      }
      canvas.toBlob((blob) => res(blob), "image/png", 1);
    });

  /* ══════════════════════════════════════════════════════════════════════
     ▌ ADD TO CART — builds FormData based on category type
     ▌
     ▌  Apparel  → customization JSON + canvas blob (logo)
     ▌  Pre-Made → customization JSON (sizes), NO canvas blob
     ▌  Promo    → canvas blob only, empty customization
     ▌
     ▌  FormData shape (matches AddToCartApi):
     ▌    product_id   : string
     ▌    quantity     : string
     ▌    variant_id   : string
     ▌    customization: JSON string
     ▌    images       : File (only when canvas has content)
  ══════════════════════════════════════════════════════════════════════ */
  const handleAddToCart = async () => {
    if (requireLogin()) return;
    if (!allMet) {
      const missing = REQUIREMENTS.filter(r => !r.done).map(r => r.label);
      setValidationError(`Please complete: ${missing.join(", ")}.`);
      setShowValidationShake(true);
      setTimeout(() => setShowValidationShake(false), 600);
      return;
    }
    setValidationError(null);

    let blob: Blob | null = null;

    /* Capture canvas blob only for Apparel and Promo (they show the logo canvas) */
    if (isApparel || (isPromo && logoImg)) {
      blob = await getBlob();
    }

    canvasBlobRef.current = blob;
    setCanvasBlob(blob);
    setCustomizationJson(JSON.stringify(buildPayload()));
    setTimeout(() => setShowCartModal(true), 50);
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
          variant_id: colorVariants[0]?.id ?? 0,
          name: product?.name ?? "",
          price: basePrice,
          image: displayImage ?? "",
        });
      }
      await fetchWishlist();
      fetchProduct();
    } catch (e) { console.error(e); }
    finally { setWishlistLoading(false); }
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

  /* ── Loading / not-found ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#F5D800] mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading product…</p>
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

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ── Login Modal ── */}
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
            <p className="text-sm text-gray-500 leading-relaxed mb-6">Login to customize products, save to wishlist, and add to cart.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={() => router.push("/login")} className="flex-1 h-11 rounded-xl bg-[#F5D800] text-black text-sm font-black">Sign In</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
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
                className={cn("flex-1 h-12 rounded-xl font-black flex items-center justify-center gap-2", previewDataUrl ? "bg-[#F5D800] text-black" : "bg-gray-100 text-gray-400 cursor-not-allowed")}
              >
                <ImageDown size={17} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3.5">
            <Link href={`/product/${variantDataId}`} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-black transition-colors">
              <ArrowLeft size={14} /> Back to product
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">Customize — {product.name}</span>

            {/* Category type badge */}
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

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Customize Your Order</h1>
          <p className="text-sm text-gray-500">
            {isApparel && "Select print location, decoration method, then upload your logo"}
            {isPreMade && "Choose your color, size & quantity"}
            {isPromo && "Upload your logo to personalize this product"}
          </p>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">

          {/* ═══════════════════════ LEFT ═══════════════════════ */}
          <div>

            {/* ══════════════════════════════════════════════════════
                ▌ SECTION A — APPAREL & UNIFORMS ONLY
                ▌ Shows: Print Location + Decoration Method + Logo Upload
            ══════════════════════════════════════════════════════ */}
            {isApparel && (
              <>
                {/* Step 1 — Print Location */}
                <SectionCard
                  step={1}
                  title="Choose Print Location"
                  subtitle="Select a view, then tap the hotspot on the garment to choose your print location."
                  status={selectedLocations.length > 0 ? "done" : "required"}
                >
                  {/* View Tab Bar */}
                  <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-xl">
                    {garmentViews.map((view, idx) => (
                      <button
                        key={view.key}
                        onClick={() => setActiveViewIdx(idx)}
                        className={cn(
                          "flex-1 h-9 rounded-lg text-xs font-bold transition-all",
                          activeViewIdx === idx ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>

                  {/* Garment Mockup with Hotspots */}
                  <div className="relative mx-auto mb-4" style={{ maxWidth: 300 }}>
                    <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img src={activeView.mockup} alt={activeView.label} className="w-full h-auto object-contain" />
                      <div className="absolute inset-0">
                        {activeView.hotspots.map(h => (
                          <button
                            key={h.id}
                            onClick={() => toggleLocation(h.id)}
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
                    <p className="text-center text-[11px] text-gray-400 mt-2">
                      Tap a hotspot on the garment to select a print location
                    </p>
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
                        <button onClick={() => setSelectedLocations([])} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-white">
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Circle size={13} className="text-gray-300 flex-shrink-0" />
                      <p className="text-xs text-gray-400">No location selected yet — tap a hotspot above</p>
                    </div>
                  )}
                </SectionCard>

                {/* Step 2 — Decoration Method */}
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
                        <button
                          key={mat.id}
                          onClick={() => handleSelectMaterial(mat.id)}
                          className={cn(
                            "w-full text-left flex items-start gap-3 rounded-2xl border-2 p-3.5 transition-all relative",
                            isSelected ? "border-[#F5D800] bg-[#FFFBEA]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
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
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isSelected ? "bg-[#F5D800] text-black" : "bg-gray-100 text-gray-500")}>
                                {mat.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{mat.desc}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Best for: {mat.bestFor}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedMaterial === "screenprint" && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Number of Colours</p>
                      <div className="flex gap-2">
                        {(["1 Color", "2 Color", "3 Color"] as const).map(c => (
                          <button key={c} onClick={() => setSpColorCount(c)}
                            className={cn("flex-1 h-10 rounded-xl border-2 text-xs font-bold transition-all", spColorCount === c ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 bg-white")}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedMaterial === "dtg" || selectedMaterial === "dtf") && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Print Area</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(DTG_PRICES) as (keyof typeof DTG_PRICES)[]).map(s => (
                          <button key={s} onClick={() => setDtgStyle(s)}
                            className={cn("h-10 rounded-xl border-2 text-xs font-bold transition-all px-2", dtgStyle === s ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 bg-white")}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMaterial && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowPriceTable(p => !p)}
                        className="w-full flex items-center justify-between h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <Table2 size={14} className="text-[#F5D800]" />
                          View Full Price Table
                        </div>
                        {showPriceTable ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                      </button>
                      {showPriceTable && (
                        <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden text-xs">
                          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-[11px] font-bold uppercase tracking-widest text-gray-600">
                            {selectedMaterial === "embroidery" && "Embroidery — Price per Location"}
                            {selectedMaterial === "dtf" && "DTF Print Pricing"}
                            {selectedMaterial === "screenprint" && "Screen Print Pricing"}
                            {selectedMaterial === "dtg" && "DTG Print Pricing"}
                          </div>
                          <div className="overflow-x-auto">
                            {selectedMaterial === "embroidery" && (
                              <table className="w-full border-collapse min-w-[520px]">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-36">Location</th>
                                    {EMB_TIERS.map(t => <th key={t.label} className="px-2 py-2 font-bold text-gray-500 border-r border-gray-100 text-center">{t.label}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(EMB_PRICES).map(([key, prices], i) => (
                                    <tr key={key} className={cn("border-b border-gray-100", selectedLocations.includes(key) ? "bg-[#F5D800]/8" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                      <td className="px-3 py-2 font-semibold text-gray-600 border-r border-gray-200">{ALL_PRINT_LOCATIONS.find(l => l.id === key)?.label ?? key}</td>
                                      {prices.map((p, j) => <td key={j} className="px-2 py-2 text-center border-r border-gray-100 text-gray-500">${p}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {selectedMaterial === "dtf" && (
                              <table className="w-full border-collapse min-w-[480px]">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200">Method</th>
                                    {["1–11", "12–23", "24–35", "36–71", "72–95", "96–143", "144+"].map((l, i) => (
                                      <th key={l} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center", DTF_TIERS.reduce((f, t, idx) => (totalQty >= t ? idx : f), 0) === i ? "text-[#b89000] bg-[#F5D800]/8" : "text-gray-500")}>{l}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="px-3 py-3 font-bold text-[#b89000] border-r border-gray-200">DTF</td>
                                    {DTF_PRICES.map((p, i) => (
                                      <td key={i} className={cn("px-2 py-3 text-center border-r border-gray-100 font-medium", DTF_TIERS.reduce((f, t, idx) => (totalQty >= t ? idx : f), 0) === i ? "text-[#b89000] font-bold" : "text-gray-500")}>${p}.00</td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            )}
                            {selectedMaterial === "screenprint" && (
                              <table className="w-full border-collapse min-w-[320px]">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200">Colors</th>
                                    <th className="px-3 py-2 font-bold text-gray-500 border-r border-gray-100 text-center">50–99 pcs</th>
                                    <th className="px-3 py-2 font-bold text-gray-500 text-center">100+ pcs</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(SP_PRICES).map(([k, p], i) => (
                                    <tr key={k} className={cn("border-b border-gray-100", k === spColorCount ? "bg-[#F5D800]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                      <td className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">{k}</td>
                                      <td className="px-3 py-2.5 text-center border-r border-gray-100 text-gray-500">${p[0].toFixed(2)}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-500">${p[1].toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {selectedMaterial === "dtg" && (
                              <table className="w-full border-collapse min-w-[400px]">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-3 py-2 font-bold text-gray-500 border-r border-gray-200 w-40">Print Area</th>
                                    {DTG_TIERS.map((t, i) => (
                                      <th key={i} className={cn("px-2 py-2 font-bold border-r border-gray-100 text-center", DTG_TIERS.reduce((f, tt, idx) => (totalQty >= tt.min ? idx : f), 0) === i ? "text-[#b89000] bg-[#F5D800]/8" : "text-gray-500")}>
                                        {["1–23", "24–47", "48–99", "100+"][i]}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(DTG_PRICES).map(([k, p], i) => (
                                    <tr key={k} className={cn("border-b border-gray-100", k === dtgStyle ? "bg-[#F5D800]/5" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                      <td className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">{k}</td>
                                      {p.map((vv, j) => <td key={j} className="px-2 py-2.5 text-center border-r border-gray-100 text-gray-500">${vv}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>

                {/* Step 3 — Logo Upload (Apparel) */}
                <SectionCard
                  step={3}
                  title="Upload Logo / Add Text"
                  subtitle="Upload a logo or add custom text. Drag to reposition on the canvas."
                  status="optional"
                >
                  {/* Canvas + Controls — shared UI below */}
                  <LogoCanvasSection
                    canvasRef={canvasRef}
                    fileRef={fileRef}
                    productImg={productImg}
                    logoImg={logoImg}
                    logoSrc={logoSrc}
                    logoSize={logoSize}
                    logoRotation={logoRotation}
                    logoOpacity={logoOpacity}
                    logoPos={logoPos}
                    customText={customText}
                    textSize={textSize}
                    textColor={textColor}
                    textRotation={textRotation}
                    fontFamily={fontFamily}
                    textBold={textBold}
                    textItalic={textItalic}
                    textShadow={textShadow}
                    textOpacity={textOpacity}
                    textPos={textPos}
                    activeTab={activeTab}
                    dragging={dragging}
                    setLogoSrc={setLogoSrc}
                    setLogoSize={setLogoSize}
                    setLogoRotation={setLogoRotation}
                    setLogoOpacity={setLogoOpacity}
                    setLogoPos={setLogoPos}
                    setCustomText={setCustomText}
                    setTextSize={setTextSize}
                    setTextColor={setTextColor}
                    setTextRotation={setTextRotation}
                    setFontFamily={setFontFamily}
                    setTextBold={setTextBold}
                    setTextItalic={setTextItalic}
                    setTextShadow={setTextShadow}
                    setTextOpacity={setTextOpacity}
                    setActiveTab={setActiveTab}
                    handleCanvasMouseDown={handleCanvasMouseDown}
                    handleCanvasMouseMove={handleCanvasMouseMove}
                    stopDrag={stopDrag}
                    getCursor={getCursor}
                    handleOpenPreview={handleOpenPreview}
                    setLogoImg={setLogoImg}
                    CANVAS_SIZE={CANVAS_SIZE}
                    FONTS={FONTS}
                    PRESET_COLORS={PRESET_COLORS}
                  />
                </SectionCard>
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                ▌ SECTION B — PRE-MADE ONLY
                ▌ Shows: Color + Size + Quantity (no print, no logo)
            ══════════════════════════════════════════════════════ */}
            {isPreMade && (
              <SectionCard
                step={1}
                title="Select Color, Quantity & Size"
                subtitle="Add one row per size combination. Choose color, set quantity, then pick size."
                status={activeSizes.length > 0 ? "done" : "required"}
              >
                {/* Column headers */}
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr 100px 1fr 36px" }}>
                  {["Color", "Quantity", "Size", ""].map((h, i) => (
                    <p key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</p>
                  ))}
                </div>

                {/* Rows */}
                <div className="space-y-2 mb-3">
                  {orderRows.map((row) => {
                    const sizesForColor = (product?.variants ?? []).filter(v =>
                      v.color === row.color && (v.stock ?? 0) > 0
                    );
                    return (
                      <div key={row.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 100px 1fr 36px" }}>
                        {/* Color select */}
                        <select
                          value={row.color}
                          onChange={e => updateOrderRow(row.id, "color", e.target.value)}
                          className="h-10 rounded-xl border-2 border-gray-200 px-2 text-xs font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none"
                        >
                          <option value="">Color…</option>
                          {colors.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>

                        {/* Qty */}
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden h-10">
                          <button
                            onClick={() => updateOrderRow(row.id, "qty", Math.max(1, row.qty - 1))}
                            className="w-8 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50"
                          ><Minus size={12} /></button>
                          <span className="flex-1 text-center text-xs font-black text-gray-900">{row.qty}</span>
                          <button
                            onClick={() => updateOrderRow(row.id, "qty", row.qty + 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-400 hover:bg-gray-50"
                          ><Plus size={12} /></button>
                        </div>

                        {/* Size select */}
                        <select
                          value={row.variantId}
                          onChange={e => updateOrderRow(row.id, "variantId", Number(e.target.value))}
                          disabled={!row.color}
                          className="h-10 rounded-xl border-2 border-gray-200 px-2 text-xs font-semibold text-gray-700 bg-white focus:border-[#F5D800] outline-none disabled:opacity-40"
                        >
                          <option value="">Size…</option>
                          {sizesForColor.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.size_details?.name || v.size} (stock: {v.stock})
                            </option>
                          ))}
                        </select>

                        {/* Remove row */}
                        <button
                          onClick={() => removeOrderRow(row.id)}
                          disabled={orderRows.length === 1}
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 hover:border-red-200 disabled:opacity-30"
                        ><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
                </div>

                {/* Add row */}
                <button
                  onClick={addOrderRow}
                  className="w-full h-10 rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:border-[#F5D800] hover:text-[#b89000] hover:bg-[#FFFBEA] transition-all mb-4"
                >
                  <Plus size={14} /> Add another row
                </button>

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={cancelOrderRows}
                    className="h-10 px-5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={saveOrderRows}
                    disabled={!orderRows.every(r => r.color && r.variantId && r.qty >= 1)}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all",
                      orderRows.every(r => r.color && r.variantId && r.qty >= 1)
                        ? "bg-[#F5D800] text-black hover:bg-[#e6ca00]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  ><Check size={14} /> Save selection</button>
                </div>

                {/* Saved summary */}
                {activeSizes.length > 0 && (
                  <div className="mt-3 px-4 py-3 bg-[#F5D800]/8 rounded-xl border border-[#F5D800]/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#b89000] mb-2">
                      Saved — {totalQty} total pieces
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {orderRows.filter(r => r.variantId && r.qty > 0).map(r => {
                        const v = product?.variants.find(vv => vv.id === r.variantId);
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


            {/* ══════════════════════════════════════════════════════
 {/* ══════════════════════════════════════════════════════
    ▌ SECTION C — PROMO PRODUCTS & OTHERS ONLY
══════════════════════════════════════════════════════ */}
            {isPromo && (
              <>
                {/* Quantity Selector - Always visible */}
              <SectionCard
      step={1}
      title="Select Quantity"
      subtitle="How many pieces do you need?"
      status={totalQty > 0 ? "done" : "required"}
    >
      {hasTierPricing ? (
        <SageQuantityPricing
          metaStr={promoMetaStr}
          minOrderQuantity={colorVariants[0]?.min_order_quantity ?? 1}
          stock={colorVariants[0]?.stock}
          variant="compact"
          onChange={({ quantity }) => {
            if (colorVariants[0]) setQty(colorVariants[0].id, quantity);
          }}
        />
      ) : (
        /* Simple quantity input */
        <div className="flex items-center justify-center gap-6 py-8">
          <button onClick={() => { /* minus logic */ }} className="w-12 h-12 rounded-2xl border...">
            <Minus size={24} />
          </button>
          {/* ... input and plus button same as before ... */}
        </div>
      )}
    </SectionCard>

{hasTierPricing && (
      <SectionCard
        step={2}
        title="Pricing Tiers"
        subtitle="Price decreases with higher quantity"
        status="done"
      >
        <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-bold text-gray-600">Quantity</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600">Price per Piece</th>
              </tr>
            </thead>
            <tbody>
              {getPromoPriceTableData()?.map((tier, index) => {
                const isCurrentTier = totalQty >= tier.qty && 
                  (index === getPromoPriceTableData()!.length - 1 || totalQty < getPromoPriceTableData()![index + 1].qty);
                
                return (
                  <tr 
                    key={index} 
                    className={cn(
                      "border-b border-gray-100 last:border-0",
                      isCurrentTier ? "bg-[#F5D800]/10" : ""
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {tier.qty}+ pcs
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ${tier.price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {parsedPromoMeta?.productionTime && (
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t">
              Production Time: {parsedPromoMeta.productionTime}
            </div>
          )}
        </div>
      </SectionCard>
    )}
                {/* Logo Upload */}
                <SectionCard
      step={hasTierPricing ? 3 : 2}
      title="Upload Your Logo"
      subtitle="Upload a logo or add custom text to personalize this product."
      status="optional"
    >
                  <LogoCanvasSection
                    canvasRef={canvasRef}
                    fileRef={fileRef}
                    productImg={productImg}
                    logoImg={logoImg}
                    logoSrc={logoSrc}
                    logoSize={logoSize}
                    logoRotation={logoRotation}
                    logoOpacity={logoOpacity}
                    logoPos={logoPos}
                    customText={customText}
                    textSize={textSize}
                    textColor={textColor}
                    textRotation={textRotation}
                    fontFamily={fontFamily}
                    textBold={textBold}
                    textItalic={textItalic}
                    textShadow={textShadow}
                    textOpacity={textOpacity}
                    textPos={textPos}
                    activeTab={activeTab}
                    dragging={dragging}
                    setLogoSrc={setLogoSrc}
                    setLogoSize={setLogoSize}
                    setLogoRotation={setLogoRotation}
                    setLogoOpacity={setLogoOpacity}
                    setLogoPos={setLogoPos}
                    setCustomText={setCustomText}
                    setTextSize={setTextSize}
                    setTextColor={setTextColor}
                    setTextRotation={setTextRotation}
                    setFontFamily={setFontFamily}
                    setTextBold={setTextBold}
                    setTextItalic={setTextItalic}
                    setTextShadow={setTextShadow}
                    setTextOpacity={setTextOpacity}
                    setActiveTab={setActiveTab}
                    handleCanvasMouseDown={handleCanvasMouseDown}
                    handleCanvasMouseMove={handleCanvasMouseMove}
                    stopDrag={stopDrag}
                    getCursor={getCursor}
                    handleOpenPreview={handleOpenPreview}
                    setLogoImg={setLogoImg}
                    CANVAS_SIZE={CANVAS_SIZE}
                    FONTS={FONTS}
                    PRESET_COLORS={PRESET_COLORS}
                  />
                </SectionCard>
              </>
            )}
          </div>

          {/* ═══════════════════════ RIGHT: Order Summary ═══════════════════════ */}
          <div className="xl:sticky xl:top-[60px] self-start">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart size={16} className="text-[#F5D800]" />
                <h2 className="text-sm font-black text-gray-900">Order Summary</h2>
              </div>
              <div className="p-5 space-y-4">

                {/* Product info */}
                <div className="flex gap-3">
                  {(previewUrl || displayImage) && (
                    <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={previewUrl || displayImage!} alt={product.name} className="w-full h-full object-contain bg-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                    {selectedColor && <p className="text-xs text-gray-500 mt-0.5">Color: {selectedColor}</p>}
                    {product.brand?.name && <p className="text-xs text-gray-400">{product.brand.name}</p>}
                    <span className={cn(
                      "inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                      isApparel ? "bg-blue-50 text-blue-600" :
                        isPreMade ? "bg-purple-50 text-purple-600" :
                          "bg-orange-50 text-orange-600"
                    )}>
                      {isApparel ? "Apparel & Uniforms" : isPreMade ? "Pre-Made" : "Promo Product"}
                    </span>
                  </div>
                </div>

                {/* Size breakdown — Pre-Made only */}
                {isPreMade && activeSizes.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      Size Breakdown
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
                            <span className="text-xs text-gray-500">×{quantity}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-700">${(Number(v.price) * quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-700">{totalQty} total pieces</span>
                      <span className="text-xs font-black text-gray-900">${(basePrice * totalQty).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Print details — Apparel only */}
                {isApparel && (selectedLocations.length > 0 || selectedMaterial) && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      Print Details
                    </div>
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
                            Decoration{selectedMaterial === "embroidery" && totalQty <= 11 ? " (incl. $35 digitizing)" : selectedLocations.length > 1 ? ` (${selectedLocations.length} loc.)` : ""}
                          </span>
                          <span className="text-xs font-black text-gray-900">${printPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimated total */}
                <div className="rounded-xl bg-gray-900 text-white p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold opacity-70">Estimated Total</span>
                <span className="text-xl font-black text-[#F5D800]">
  {isApparel && totalQty > 0 
    ? `$${estimatedTotal.toFixed(2)}` 
    : isPreMade && totalQty > 0 
      ? `$${(basePrice * totalQty).toFixed(2)}` 
      : isPromo && totalQty > 0 && promoUnitPrice !== null 
        ? `$${(promoUnitPrice * totalQty).toFixed(2)}` 
        : "—"}
</span>
                  </div>
                  {isApparel && totalQty > 0 && printPrice !== null && (
                    <p className="text-[10px] text-gray-400">
                      ${((basePrice * totalQty + printPrice) / totalQty).toFixed(2)}/pc all-in
                    </p>
                  )}
                </div>

                {/* Tier hint — Apparel only */}
                {isApparel && selectedMaterial && totalQty > 0 && totalQty < 144 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                    <Zap size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      {(() => {
                        const milestones = [12, 24, 36, 50, 72, 100, 144];
                        for (const m of milestones) { if (totalQty < m) return `${m - totalQty} more pieces unlocks the ${m}-pc tier.`; }
                        return "";
                      })()}
                    </p>
                  </div>
                )}

                {/* Requirements checklist */}
                <div className="space-y-1.5">
                  {REQUIREMENTS.map(({ key, label, done }) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                        done ? "bg-[#F5D800]/10 text-[#b89000]" :
                          showValidationShake ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
                      )}
                    >
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

                {/* CTA: Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    showValidationShake ? "animate-[shake_0.4s_ease-in-out]" : "",
                    !allMet
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                      : inCart
                        ? "bg-[#F5D800]/10 text-[#b89000] border-2 border-[#F5D800]/40"
                        : "bg-[#F5D800] text-black hover:bg-[#e6ca00] shadow-md"
                  )}
                >
                  <ShoppingCart size={16} />
                  {inCart ? "Added to Cart ✓" : "Add to Cart"}
                </button>

                {/* CTA: Wishlist */}
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={cn(
                    "w-full h-11 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all",
                    wishlistLoading ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" :
                      inWishlist ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100" :
                        "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                  )}
                >
                  {wishlistLoading ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} fill={inWishlist ? "currentColor" : "none"} />}
                  {inWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
                </button>


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AddToCartModal */}
      {product && (
        <AddToCartModal
          open={showCartModal}
          onClose={() => setShowCartModal(false)}
          productId={Number(product.id)}
          variantId={colorVariants[0]?.id ?? 0}
          price={basePrice}
          name={product.name}
          initialQuantity={totalQty || 1}
          printPricePerPiece={
            isApparel && printPrice && totalQty > 0
              ? (selectedMaterial === "embroidery" && totalQty <= 11 ? (printPrice - 35) / totalQty : printPrice / totalQty)
              : 0
          }
          digitizingFee={isApparel && selectedMaterial === "embroidery" && totalQty <= 11 ? 35 : 0}
          customization={customizationJson}
          canvasBlob={canvasBlobRef.current}
          onSuccess={() => { setInCart(true); refreshCart(); fetchProduct(); }}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ▌ LogoCanvasSection — shared canvas UI used by Apparel + Promo
   ▌ Extracted to avoid duplicating ~150 lines of JSX
══════════════════════════════════════════════════════════════════════ */
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
}: any) {
  return (
    <div className="flex flex-col xl:flex-row gap-5 items-start">
      {/* Canvas */}
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
            <button
              onClick={handleOpenPreview}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              <Download size={12} /> Export
            </button>
          </div>
          <div className="p-3 bg-[#fafafa]">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              className="w-full h-auto rounded-xl block border border-gray-200"
              style={{ cursor: getCursor() }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: "image", icon: ImageIcon, label: "Upload Logo" },
              { key: "text", icon: Type, label: "Custom Text" },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-12 text-sm font-bold transition-all border-b-2",
                  activeTab === key ? "text-gray-900 border-[#F5D800] bg-[#FFFBEA]" : "text-gray-400 border-transparent hover:bg-gray-50"
                )}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* IMAGE TAB */}
            {activeTab === "image" && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onloadend = () => {
                      setLogoSrc(r.result as string);
                      setLogoRotation(0);
                      const defaultSize = 120;
                      setLogoSize(defaultSize);
                      setLogoPos({ x: (CANVAS_SIZE - defaultSize) / 2, y: (CANVAS_SIZE - defaultSize) / 2 });
                    };
                    r.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                {!logoImg ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#F5D800]/60 hover:bg-[#FFFBEA] transition-all group"
                  >
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
                        <p className="text-[10px] text-gray-400">Drag on canvas to reposition</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500"><Upload size={13} /></button>
                        <button onClick={() => { setLogoSrc(null); setLogoImg(null); }} className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
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

            {/* TEXT TAB */}
            {activeTab === "text" && (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Text</p>
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Type something..."
                    className="w-full h-11 rounded-xl border-2 border-gray-200 px-4 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#F5D800] transition-all"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Font</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((f: any) => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        style={{ fontFamily: f.value }}
                        className={cn(
                          "h-10 rounded-xl border-2 text-sm transition-all px-3 text-left truncate",
                          fontFamily === f.value ? "border-[#F5D800] bg-[#FFFBEA] text-[#b89000] font-bold" : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
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
                    <button
                      key={label}
                      onClick={toggle}
                      className={cn("h-10 px-4 rounded-xl border-2 text-sm transition-all", cls, active ? "border-[#F5D800] bg-[#F5D800] text-black" : "border-gray-200 text-gray-600 hover:border-gray-300")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c: string) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        style={{ background: c }}
                        className={cn("w-7 h-7 rounded-full border-2 transition-transform hover:scale-110", textColor === c ? "border-[#F5D800] scale-110 ring-2 ring-[#F5D800]/30" : "border-gray-200 shadow-sm")}
                      />
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