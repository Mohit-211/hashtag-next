"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import html2canvas from "html2canvas";

import {
  Pencil,
  Upload,
  RotateCw,
  ZoomIn,
  ShoppingCart,
  Heart,
  X,
  Check,
  Minus,
  Plus,
  Type,
  Download,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  productId?: number;
  variantId?: number;
  wishlist_id?: number | null;

  price: number;
  name: string;
  productImage?: string | null;

  is_in_cart: boolean;
  is_in_wishlist: boolean;

  onReload?: () => void;
}

const MIN_SIZE = 20;
const MAX_SIZE = 200;

// ─── helper: turn ANY url into a same-origin base64 string ───────────────────
// We route it through /api/proxy-image so CORS-blocked hosts work too.
const toBase64ViaSameOrigin = async (url: string): Promise<string> => {
  const proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxied);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
export default function ProductCustomization({
  price,
  name,
  productImage,
  is_in_cart,
  is_in_wishlist,
  onReload,
}: Props) {


  /* ---------------- TAB ---------------- */
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");

  /* ---------------- PRODUCT IMAGE ---------------- */
  // We store the base64 data-URL so html2canvas never touches a cross-origin src
  const [previewImage, setPreviewImage] = useState("");

  /* ---------------- LOGO ---------------- */
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(80);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 120, y: 120 });

  /* ---------------- TEXT ---------------- */
  const [customText, setCustomText] = useState("Your Text");
  const [textSize, setTextSize] = useState(28);
  const [textColor, setTextColor] = useState("#000000");
  const [textRotation, setTextRotation] = useState(0);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("700");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textPosition, setTextPosition] = useState({ x: 120, y: 320 });

  /* ---------------- DRAG ---------------- */
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingText, setDraggingText] = useState(false);
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 });

  /* ---------------- OTHER ---------------- */
  const [inCart, setInCart] = useState(is_in_cart);
  const [inWishlist, setInWishlist] = useState(is_in_wishlist);
  const [downloading, setDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ─── LOAD PRODUCT IMAGE as base64 via proxy (fixes CORS for all hosts) ─── */
  useEffect(() => {
    if (!productImage) return;
    let cancelled = false;

    const load = async () => {
      try {
        const base64 = await toBase64ViaSameOrigin(productImage);
        if (!cancelled) setPreviewImage(base64);
      } catch (err) {
        console.error("Failed to load product image:", err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [productImage]);

  /* ─── UPLOAD LOGO (local file → object URL, same-origin, no CORS issue) ─── */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert uploaded file to base64 immediately so html2canvas can read it
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
      setPosition({ x: 120, y: 120 });
      setRotation(0);
      setLogoSize(80);
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- LOGO DRAG ---------------- */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewRef.current) return;
    const b = previewRef.current.getBoundingClientRect();
    setDragging(true);
    setDragOffset({ x: e.clientX - b.left - position.x, y: e.clientY - b.top - position.y });
  };

  /* ---------------- TEXT DRAG ---------------- */
  const handleTextMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewRef.current) return;
    const b = previewRef.current.getBoundingClientRect();
    setDraggingText(true);
    setTextDragOffset({ x: e.clientX - b.left - textPosition.x, y: e.clientY - b.top - textPosition.y });
  };

  /* ---------------- MOVE ---------------- */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!previewRef.current) return;
      const b = previewRef.current.getBoundingClientRect();

      if (dragging) {
        const x = e.clientX - b.left - dragOffset.x;
        const y = e.clientY - b.top - dragOffset.y;
        setPosition({
          x: Math.max(0, Math.min(b.width - logoSize, x)),
          y: Math.max(0, Math.min(b.height - logoSize, y)),
        });
      }

      if (draggingText) {
        setTextPosition({
          x: e.clientX - b.left - textDragOffset.x,
          y: e.clientY - b.top - textDragOffset.y,
        });
      }
    },
    [dragging, dragOffset, logoSize, draggingText, textDragOffset]
  );

  /* ─── DOWNLOAD — canvas is never tainted because all srcs are base64 ─────── */
  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,   // still fine to keep
        allowTaint: false,
        scale: 4,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = "customized-product.png";
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  /* ---------------- TOTAL ---------------- */
  const total = price + (logo ? 3 : 0) + (customText.trim() ? 2 : 0);

  return (
    <div className="rounded-2xl border border-[#dde8df] bg-white overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf3ee] bg-[#f7fbf8]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e8f0ea] flex items-center justify-center">
            <Pencil size={16} className="text-[#2d4a35]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">Customize Product</p>
            <p className="text-xs text-[#7a9882]">Upload logo and add text</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4">
        {/* TABS */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#eef5f0] border border-[#dde8df]">
          <button
            onClick={() => setActiveTab("image")}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold transition-all",
              activeTab === "image" ? "bg-white shadow-sm text-[#1f3526]" : "text-[#6c8773]"
            )}
          >
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold transition-all",
              activeTab === "text" ? "bg-white shadow-sm text-[#1f3526]" : "text-[#6c8773]"
            )}
          >
            Custom Text
          </button>
        </div>

        {/* PREVIEW */}
        <div
          ref={previewRef}
          onMouseMove={handleMouseMove}
          onMouseUp={() => { setDragging(false); setDraggingText(false); }}
          onMouseLeave={() => { setDragging(false); setDraggingText(false); }}
          className={cn(
            "relative w-full h-[600px] rounded-2xl overflow-hidden border bg-white flex items-center justify-center",
            dragging || draggingText ? "cursor-grabbing" : "cursor-default"
          )}
        >
          {/* PRODUCT IMAGE — always a base64 src, never cross-origin */}
          {previewImage ? (
            <img
              src={previewImage}
              alt="Product"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          ) : (
            <div className="text-xs text-gray-400">Loading product…</div>
          )}

          {/* LOGO */}
          {logo && (
            <img
              src={logo}
              alt="Logo"
              draggable={false}
              onMouseDown={handleMouseDown}
              className="absolute object-contain cursor-grab select-none"
              style={{
                width: logoSize,
                height: logoSize,
                left: position.x,
                top: position.y,
                transform: `rotate(${rotation}deg)`,
              }}
            />
          )}

          {/* TEXT */}
          {customText.trim() && (
            <div
              onMouseDown={handleTextMouseDown}
              className="absolute cursor-grab select-none whitespace-pre-line"
              style={{
                left: textPosition.x,
                top: textPosition.y,
                fontSize: textSize,
                color: textColor,
                transform: `rotate(${textRotation}deg)`,
                lineHeight: 1.2,
                fontFamily,
                fontWeight,
                fontStyle,
                minWidth: 150,
              }}
            >
              {customText}
            </div>
          )}
        </div>

        {/* FILE */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* IMAGE TAB */}
        {activeTab === "image" && (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#cfe1d3] bg-[#fafcfa] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#e8f0ea] flex items-center justify-center">
                {logo ? (
                  <Check size={15} className="text-green-700" />
                ) : (
                  <Upload size={15} className="text-[#4a7a58]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2d4a35]">
                  {logo ? "Image Uploaded" : "Upload Image"}
                </p>
                <p className="text-xs text-[#7a9882]">PNG, JPG or SVG</p>
              </div>
              {logo && (
                <button onClick={(e) => { e.stopPropagation(); setLogo(null); }}>
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            {logo && (
              <div className="space-y-4 p-4 rounded-xl border bg-[#f7fbf8]">
                {/* SIZE */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1 text-xs font-semibold">
                      <ZoomIn size={12} /> Size
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLogoSize((s) => Math.max(MIN_SIZE, s - 5))}
                        className="w-6 h-6 rounded-md border bg-white flex items-center justify-center"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold">{logoSize}px</span>
                      <button
                        onClick={() => setLogoSize((s) => Math.min(MAX_SIZE, s + 5))}
                        className="w-6 h-6 rounded-md border bg-white flex items-center justify-center"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range" min={MIN_SIZE} max={MAX_SIZE} value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="w-full accent-[#4a7a58]"
                  />
                </div>

                {/* ROTATION */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1 text-xs font-semibold">
                      <RotateCw size={12} /> Rotation
                    </label>
                    <span className="text-xs font-bold">{rotation}°</span>
                  </div>
                  <input
                    type="range" min={0} max={360} value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-[#4a7a58]"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* TEXT TAB */}
        {activeTab === "text" && (
          <div className="space-y-4 p-4 rounded-xl border bg-[#f7fbf8]">
            <div className="flex items-center gap-2">
              <Type size={15} className="text-[#4a7a58]" />
              <h3 className="text-sm font-bold text-[#2d4a35]">Custom Text</h3>
            </div>

            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={4}
              placeholder="Enter custom text"
              className="w-full min-h-[110px] p-4 rounded-xl border border-[#d9e6dc] bg-white outline-none text-sm resize-none"
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Text Size</span>
                <span className="text-xs font-bold">{textSize}px</span>
              </div>
              <input
                type="range" min={14} max={80} value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="w-full accent-[#4a7a58]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Rotation</span>
                <span className="text-xs font-bold">{textRotation}°</span>
              </div>
              <input
                type="range" min={0} max={360} value={textRotation}
                onChange={(e) => setTextRotation(Number(e.target.value))}
                className="w-full accent-[#4a7a58]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["#000000", "#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899", "#14b8a6"].map((color) => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={cn(
                    "w-9 h-9 rounded-full border-2",
                    textColor === color ? "border-black scale-110" : "border-white"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* PRICE */}
        <div className="rounded-xl border bg-[#f7fbf8] p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-[#5a7a60]">{name}</span>
            <span className="text-sm font-semibold text-[#2d4a35]">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base font-bold text-[#2d4a35]">Total</span>
            <span className="text-base font-extrabold text-[#2d4a35]">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={() => { setInCart(true); onReload?.(); }}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2",
              inCart
                ? "bg-[#e8f0ea] text-[#4a7a58]"
                : "bg-gradient-to-br from-[#2d4a35] to-[#4a7a58] text-white"
            )}
          >
            <ShoppingCart size={16} />
            {inCart ? "In Cart" : "Add To Cart"}
          </button>

          <button
            onClick={() => setInWishlist((v) => !v)}
            className={cn(
              "w-12 rounded-xl border flex items-center justify-center",
              inWishlist ? "bg-red-50 border-red-200" : "bg-[#fafcfa] border-[#dde8df]"
            )}
          >
            <Heart
              size={18}
              fill={inWishlist ? "#e05555" : "none"}
              className={inWishlist ? "text-[#e05555]" : "text-[#7a9882]"}
            />
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 rounded-xl bg-[#1f3526] text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}