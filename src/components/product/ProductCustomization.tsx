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
  ShoppingCart,
  Heart,
  X,
  Download,
  Sparkles,
  Eye,
  ImageDown,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import AddToCartModal from "../common/AddToCartModal";

import { useWishlist } from "@/contexts/WishlistContext";


/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Props {
  productId: number;
  variantId: number;
  price: number;
  name: string;
  productImage?: string | null;
  is_in_cart: boolean;
  is_in_wishlist: boolean;
  wishlist_id?: number | null;
  onReload?: () => void;
  initialQuantity?: number;
}


/* ─── Constants ──────────────────────────────────────────────────────────── */

const CANVAS_SIZE = 500;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const toBase64ViaSameOrigin = async (
  url: string
): Promise<string> => {
  try {
    const proxied = `/api/proxy-image?url=${encodeURIComponent(
      url
    )}`;

    const response = await fetch(proxied);

    if (!response.ok)
      throw new Error("Proxy failed");

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () =>
        resolve(reader.result as string);

      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error(err);
    return url;
  }
};

const loadImage = (
  src: string
): Promise<HTMLImageElement> =>
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
  text: string;
  textPos: { x: number; y: number };
  textSize: number;
  textColor: string;
  textRotation: number;
  fontFamily: string;
}

function drawAll({
  ctx,
  size,
  productImg,
  logo,
  logoPos,
  logoSize,
  logoRotation,
  text,
  textPos,
  textSize,
  textColor,
  textRotation,
  fontFamily,
}: DrawParams) {
  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  if (productImg) {
    ctx.drawImage(productImg, 0, 0, size, size);
  }

  if (logo) {
    ctx.save();

    const cx = logoPos.x + logoSize / 2;
    const cy = logoPos.y + logoSize / 2;

    ctx.translate(cx, cy);

    ctx.rotate(
      (logoRotation * Math.PI) / 180
    );

    ctx.drawImage(
      logo,
      -logoSize / 2,
      -logoSize / 2,
      logoSize,
      logoSize
    );

    ctx.restore();
  }

  if (text.trim()) {
    ctx.save();

    ctx.font = `bold ${textSize}px ${fontFamily}`;

    ctx.fillStyle = textColor;

    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;

    const metrics = ctx.measureText(text);

    const tw = metrics.width;
    const th = textSize;

    const cx = textPos.x + tw / 2;
    const cy = textPos.y - th / 2;

    ctx.translate(cx, cy);

    ctx.rotate(
      (textRotation * Math.PI) / 180
    );

    ctx.fillText(text, -tw / 2, th / 2);

    ctx.restore();
  }
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ProductCustomization({
  productId,
  variantId,
  price,
  name,
  productImage,
  is_in_cart,
  is_in_wishlist,
  onReload,
}: Props) {
  const router = useRouter();

 const {
  wishlist,
  addToWishlist,
  removeItem,
  fetchWishlist,
} = useWishlist();

  /* ─── Login ─── */

  const [showLoginModal, setShowLoginModal] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn =
    mounted &&
    !!localStorage.getItem(
      "hastagBillionaire"
    );

  const requireLogin = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }

    return false;
  };

  /* ─── Wishlist State ─── */

  const wishlistItem = wishlist.find(
    (item) =>
      item.product_id === productId &&
      item.variant_id === variantId
  );

  const inWishlist = !!wishlistItem;

  /* ─── States ─── */

  const [activeTab, setActiveTab] =
    useState<"image" | "text">("image");

  const [productImg, setProductImg] =
    useState<HTMLImageElement | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [logoImg, setLogoImg] =
    useState<HTMLImageElement | null>(null);

  const [logoSrc, setLogoSrc] =
    useState<string | null>(null);

  const [logoSize, setLogoSize] =
    useState(100);

  const [logoRotation, setLogoRotation] =
    useState(0);

  const [logoPos, setLogoPos] = useState({
    x: 160,
    y: 160,
  });

  const [customText, setCustomText] =
    useState("Your Text");

  const [textSize, setTextSize] =
    useState(32);

  const [textColor, setTextColor] =
    useState("#000000");

  const [textRotation, setTextRotation] =
    useState(0);

  const [fontFamily, setFontFamily] =
    useState("Georgia");

  const [textPos, setTextPos] = useState({
    x: 100,
    y: 300,
  });

  const [dragging, setDragging] =
    useState<"logo" | "text" | null>(
      null
    );

  const [dragOffset, setDragOffset] =
    useState({
      x: 0,
      y: 0,
    });

  const [inCart, setInCart] =
    useState(is_in_cart);

  const [wishlistLoading, setWishlistLoading] =
    useState(false);

  const [showPreviewModal, setShowPreviewModal] =
    useState(false);

  const [previewDataUrl, setPreviewDataUrl] =
    useState<string | null>(null);

  const [previewError, setPreviewError] =
    useState(false);

  /* ─── Quantity State ─── */

  const [quantity, setQuantity] =
    useState(1);

  const decreaseQuantity = () =>
    setQuantity((prev) => Math.max(1, prev - 1));

  const increaseQuantity = () =>
    setQuantity((prev) => prev + 1);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const fileRef =
    useRef<HTMLInputElement>(null);

  /* ─── Load Product Image ─── */

  useEffect(() => {
    if (!productImage) return;

    let cancelled = false;

    const load = async () => {
      try {
        const base64 =
          await toBase64ViaSameOrigin(
            productImage
          );

        if (cancelled) return;

        const img = await loadImage(base64);

        if (!cancelled) {
          setProductImg(img);
        }
      } catch (err) {
        console.error(err);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [productImage]);

  /* ─── Load Logo ─── */

  useEffect(() => {
    if (!logoSrc) {
      setLogoImg(null);
      return;
    }

    let cancelled = false;

    loadImage(logoSrc).then((img) => {
      if (!cancelled) {
        setLogoImg(img);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [logoSrc]);

  /* ─── Draw Canvas ─── */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    drawAll({
      ctx,
      size: CANVAS_SIZE,
      productImg,
      logo: logoImg,
      logoPos,
      logoSize,
      logoRotation,
      text: customText,
      textPos,
      textSize,
      textColor,
      textRotation,
      fontFamily,
    });
  }, [
    productImg,
    logoImg,
    logoPos,
    logoSize,
    logoRotation,
    customText,
    textPos,
    textSize,
    textColor,
    textRotation,
    fontFamily,
  ]);

  /* ─── Wishlist ─── */

  const handleWishlist = async () => {
  if (requireLogin()) return;

  try {
    setWishlistLoading(true);

    if (inWishlist && wishlistItem) {
      await removeItem(wishlistItem.id);
    } else {
      await addToWishlist({
        product_id: productId,
        variant_id: variantId,
        name,
        price,
        image: productImage || "",
      });
    }

    // ✅ Refresh wishlist from context
    await fetchWishlist();

    onReload?.();
  } catch (error) {
    console.error(
      "Wishlist error:",
      error
    );
  } finally {
    setWishlistLoading(false);
  }
};

  /* ─── Upload ─── */

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (requireLogin()) return;

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setLogoSrc(reader.result as string);

      setLogoPos({
        x: 160,
        y: 160,
      });

      setLogoRotation(0);

      setLogoSize(100);
    };

    reader.readAsDataURL(file);
  };

  /* ─── Canvas Interaction ─── */

  const getCanvasPoint = (
    e: React.MouseEvent
  ) => {
    const canvas = canvasRef.current!;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      CANVAS_SIZE / rect.width;

    const scaleY =
      CANVAS_SIZE / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const isOverLogo = (pt: {
    x: number;
    y: number;
  }) =>
    !!(
      logoImg &&
      pt.x >= logoPos.x &&
      pt.x <= logoPos.x + logoSize &&
      pt.y >= logoPos.y &&
      pt.y <= logoPos.y + logoSize
    );

  const isOverText = (pt: {
    x: number;
    y: number;
  }) => {
    if (!customText.trim()) return false;

    return (
      pt.x >= textPos.x &&
      pt.x <=
      textPos.x +
      textSize *
      customText.length *
      0.65 &&
      pt.y >= textPos.y - textSize &&
      pt.y <= textPos.y + 8
    );
  };

  const handleCanvasMouseDown = (
    e: React.MouseEvent
  ) => {
    const pt = getCanvasPoint(e);

    if (isOverLogo(pt)) {
      setDragging("logo");

      setDragOffset({
        x: pt.x - logoPos.x,
        y: pt.y - logoPos.y,
      });
    } else if (isOverText(pt)) {
      setDragging("text");

      setDragOffset({
        x: pt.x - textPos.x,
        y: pt.y - textPos.y,
      });
    }
  };

  const handleCanvasMouseMove =
    useCallback(
      (e: React.MouseEvent) => {
        if (!dragging) return;

        const pt = getCanvasPoint(e);

        if (dragging === "logo") {
          const x = Math.max(
            0,
            Math.min(
              CANVAS_SIZE - logoSize,
              pt.x - dragOffset.x
            )
          );

          const y = Math.max(
            0,
            Math.min(
              CANVAS_SIZE - logoSize,
              pt.y - dragOffset.y
            )
          );

          setLogoPos({ x, y });
        } else if (
          dragging === "text"
        ) {
          const x = Math.max(
            0,
            Math.min(
              CANVAS_SIZE - 40,
              pt.x - dragOffset.x
            )
          );

          const y = Math.max(
            textSize,
            Math.min(
              CANVAS_SIZE,
              pt.y - dragOffset.y
            )
          );

          setTextPos({ x, y });
        }
      },
      [
        dragging,
        dragOffset,
        logoSize,
        textSize,
      ]
    );

  const stopDrag = () =>
    setDragging(null);

  /* ─── Preview ─── */

  const handleOpenPreview = () => {
    if (requireLogin()) return;

    setPreviewError(false);

    setShowPreviewModal(true);

    try {
      const offscreen =
        document.createElement("canvas");

      offscreen.width = CANVAS_SIZE * 2;
      offscreen.height =
        CANVAS_SIZE * 2;

      const ctx =
        offscreen.getContext("2d");

      if (!ctx) return;

      ctx.scale(2, 2);

      drawAll({
        ctx,
        size: CANVAS_SIZE,
        productImg,
        logo: logoImg,
        logoPos,
        logoSize,
        logoRotation,
        text: customText,
        textPos,
        textSize,
        textColor,
        textRotation,
        fontFamily,
      });

      setPreviewDataUrl(
        offscreen.toDataURL(
          "image/png",
          1
        )
      );
    } catch (err) {
      console.error(err);

      setPreviewError(true);
    }
  };

  const handleConfirmDownload = () => {
    if (!previewDataUrl) return;

    const link =
      document.createElement("a");

    link.href = previewDataUrl;

    link.download = `${name
      .replace(/\s+/g, "-")
      .toLowerCase()}-customized.png`;

    link.click();

    setShowPreviewModal(false);
  };

  const getCursor = () => {
    if (dragging) return "grabbing";

    if (logoImg || customText.trim()) {
      return "grab";
    }

    return "default";
  };


  return (
    <>
      {/* LOGIN MODAL */}

      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl border border-[#e8e4df]">
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#e8f0ea] flex items-center justify-center mb-4">
                <span className="text-lg">
                  🔒
                </span>
              </div>

              <button
                onClick={() =>
                  setShowLoginModal(false)
                }
                className="text-[#8fa989] hover:text-[#2d4a35] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="text-lg font-bold text-[#1a2e1f] mb-1.5">
              Sign in to continue
            </h2>

            <p className="text-sm text-[#8fa989] leading-relaxed mb-6">
              Login to customize
              products, save wishlist
              items, and add to cart.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowLoginModal(false)
                }
                className="flex-1 h-11 rounded-xl border border-[#dde8df] text-sm font-semibold text-[#6b8070] hover:bg-[#f0f6f1] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  router.push("/login")
                }
                className="flex-1 h-11 rounded-xl bg-[#2d4a35] text-white text-sm font-bold hover:bg-[#1f3526] transition-colors shadow-md shadow-[#2d4a35]/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Eye size={18} />

                <h3 className="font-bold text-lg">
                  Preview Design
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowPreviewModal(false)
                }
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

                    <p>
                      Failed to generate
                      preview
                    </p>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() =>
                  setShowPreviewModal(false)
                }
                className="flex-1 h-12 rounded-2xl border hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleConfirmDownload
                }
                disabled={!previewDataUrl}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2",
                  previewDataUrl
                    ? "bg-[#1f3526] hover:bg-[#294832]"
                    : "bg-gray-300 cursor-not-allowed"
                )}
              >
                <ImageDown size={18} />

                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CARD */}

      <div className="rounded-3xl border border-[#e2ece4] bg-white overflow-hidden shadow-md">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#edf4ef] bg-gradient-to-r from-[#f4f9f5] to-[#eef5f0]">
          <div className="w-9 h-9 rounded-xl bg-[#2d4a35] flex items-center justify-center">
            <Sparkles
              size={15}
              className="text-white"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-[#1a2e1e]">
              Customize Your Product
            </p>

            <p className="text-xs text-[#8aaa90]">
              Drag logo/text to reposition
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Tabs */}

          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#eef5f0] border">
            {(
              ["image", "text"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (
                    requireLogin()
                  )
                    return;

                  setActiveTab(tab);
                }}
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold transition-all",
                  activeTab === tab
                    ? "bg-white shadow text-[#1f3526]"
                    : "text-[#7a9882]"
                )}
              >
                {tab === "image"
                  ? "Upload Image"
                  : "Custom Text"}
              </button>
            ))}
          </div>

          {/* Upload */}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />

          {activeTab === "image" && (
            <div className="space-y-4">
              <div
                onClick={() => {
                  if (
                    requireLogin()
                  )
                    return;

                  fileRef.current?.click();
                }}
                className="flex items-center gap-3 p-4 rounded-2xl border border-dashed cursor-pointer hover:bg-[#f7faf8] transition-colors"
              >
                <Upload size={18} />

                <div>
                  <p className="font-semibold">
                    Upload Logo
                  </p>

                  <p className="text-xs text-gray-500">
                    PNG, JPG, SVG
                  </p>
                </div>
              </div>

              {logoImg && (
                <div className="space-y-4 rounded-2xl border p-4 bg-[#f8fbf9]">
                  <div>
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span>Logo Size</span>

                      <span>
                        {logoSize}px
                      </span>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={250}
                      value={logoSize}
                      onChange={(e) =>
                        setLogoSize(
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span>
                        Rotation
                      </span>

                      <span>
                        {logoRotation}°
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={logoRotation}
                      onChange={(e) =>
                        setLogoRotation(
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setLogoRotation(
                          (prev) =>
                            prev - 15
                        )
                      }
                      className="flex-1 h-11 rounded-xl border flex items-center justify-center gap-2 hover:bg-white"
                    >
                      <RotateCcw size={16} />
                      Left
                    </button>

                    <button
                      onClick={() =>
                        setLogoRotation(
                          (prev) =>
                            prev + 15
                        )
                      }
                      className="flex-1 h-11 rounded-xl border flex items-center justify-center gap-2 hover:bg-white"
                    >
                      <RotateCw size={16} />
                      Right
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-4 rounded-2xl border p-4 bg-[#f8fbf9]">
              <div>
                <label className="text-sm font-semibold block mb-2">
                  Custom Text
                </label>

                <input
                  type="text"
                  value={customText}
                  onChange={(e) =>
                    setCustomText(
                      e.target.value
                    )
                  }
                  placeholder="Enter your text"
                  className="w-full h-11 rounded-xl border px-4 outline-none focus:ring-2 focus:ring-[#2d4a35]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span>
                    Text Size
                  </span>

                  <span>
                    {textSize}px
                  </span>
                </div>

                <input
                  type="range"
                  min={14}
                  max={80}
                  value={textSize}
                  onChange={(e) =>
                    setTextSize(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Text Color
                </label>

                <input
                  type="color"
                  value={textColor}
                  onChange={(e) =>
                    setTextColor(
                      e.target.value
                    )
                  }
                  className="w-full h-11 rounded-xl border p-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Font Family
                </label>

                <select
                  value={fontFamily}
                  onChange={(e) =>
                    setFontFamily(
                      e.target.value
                    )
                  }
                  className="w-full h-11 rounded-xl border px-4 outline-none"
                >
                  <option value="Georgia">
                    Georgia
                  </option>

                  <option value="Arial">
                    Arial
                  </option>

                  <option value="Verdana">
                    Verdana
                  </option>

                  <option value="Times New Roman">
                    Times New Roman
                  </option>

                  <option value="Courier New">
                    Courier New
                  </option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm font-medium">
                  <span>
                    Rotation
                  </span>

                  <span>
                    {textRotation}°
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={360}
                  value={textRotation}
                  onChange={(e) =>
                    setTextRotation(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Canvas */}

          <div className="relative rounded-3xl border border-[#dfe7e1] bg-white shadow-sm overflow-hidden p-3 mt-5">
            <button
              onClick={
                handleOpenPreview
              }
              className="absolute top-4 right-4 z-10 w-11 h-11 rounded-2xl bg-[#1f3526] text-white flex items-center justify-center shadow-lg hover:bg-[#294832]"
            >
              <Download size={18} />
            </button>

            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onMouseDown={
                handleCanvasMouseDown
              }
              onMouseMove={
                handleCanvasMouseMove
              }
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              className="w-full h-auto rounded-2xl bg-[#f8faf8]"
              style={{
                cursor: getCursor(),
                display: "block",
              }}
            />
          </div>

          {/* Price */}

          <div className="rounded-2xl border p-4 space-y-2 bg-[#f7fbf8]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">
                {name}
              </span>

              <span className="font-semibold">
                ${price.toFixed(2)}
              </span>
            </div>

            {/* ─── Quantity Selector ─── */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-gray-700">
                Quantity
              </span>

              <div className="flex items-center gap-1 rounded-xl border border-[#dde8df] bg-white overflow-hidden">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center transition-colors",
                    quantity <= 1
                      ? "text-[#c5d9ca] cursor-not-allowed"
                      : "text-[#2d4a35] hover:bg-[#eef5f0]"
                  )}
                >
                  <Minus size={14} />
                </button>

                <span className="w-8 text-center text-sm font-bold text-[#1a2e1e] select-none">
                  {quantity}
                </span>

                <button
                  onClick={increaseQuantity}
                  className="w-9 h-9 flex items-center justify-center text-[#2d4a35] hover:bg-[#eef5f0] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold text-[#1a2e1e]">
              <span>Total</span>

              <span>
                ${(price * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buttons */}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (requireLogin()) return;

                setShowModal(true);
              }}
              className={cn(
                "flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors",
                inCart
                  ? "bg-[#e8f0ea] text-[#4a7a58]"
                  : "bg-[#1f3526] text-white hover:bg-[#294832]"
              )}
            >
              <ShoppingCart size={16} />

              {inCart
                ? "Added to Cart"
                : "Add to Cart"}
            </button>

            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors",
                wishlistLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              )}
            >
              {wishlistLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Heart
                  size={18}
                  fill={
                    inWishlist
                      ? "#e05555"
                      : "none"
                  }
                  className={
                    inWishlist
                      ? "text-[#e05555]"
                      : "text-[#7a9882]"
                  }
                />
              )}
            </button>
          </div>

          <AddToCartModal
            open={showModal}
            onClose={() =>
              setShowModal(false)
            }
            productId={productId}
            variantId={variantId}
            price={price}
            name={name}
            initialQuantity={quantity}
            onSuccess={() => {
              setInCart(true);

              onReload?.();
            }}
          />
        </div>
      </div>
    </>
  );
}