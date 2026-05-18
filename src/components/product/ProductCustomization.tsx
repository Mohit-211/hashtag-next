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
import { Button } from "@/components/ui/button";
import { message } from "antd";
import { useRouter } from "next/navigation";

import AddToCartModal from "@/components/common/AddToCartModal";

import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface Props {
  productId: number;
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

/* ───────────────────────────────────────────────────────────── */
/* IMAGE HELPER */
/* ───────────────────────────────────────────────────────────── */

const toBase64ViaSameOrigin = async (
  url: string
): Promise<string> => {
  const proxied = `/api/proxy-image?url=${encodeURIComponent(
    url
  )}`;

  const response = await fetch(proxied);

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () =>
      resolve(reader.result as string);

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
};

export default function ProductCustomization({
  productId,
  variantId,
  price,
  name,
  productImage,
  is_in_cart,
  onReload,
}: Props) {
  const router = useRouter();

  const { refreshCart } = useCart();

  const {
    wishlist,
    addToWishlist,
    removeItem,
  } = useWishlist();

  // ✅ TOKEN CONDITION
  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  /* ---------------- TAB ---------------- */

  const [activeTab, setActiveTab] = useState<
    "image" | "text"
  >("image");

  /* ---------------- PRODUCT IMAGE ---------------- */

  const [previewImage, setPreviewImage] =
    useState("");

  /* ---------------- LOGO ---------------- */

  const [logo, setLogo] = useState<
    string | null
  >(null);

  const [logoSize, setLogoSize] =
    useState(80);

  const [rotation, setRotation] =
    useState(0);

  const [position, setPosition] =
    useState({
      x: 120,
      y: 120,
    });

  /* ---------------- TEXT ---------------- */

  const [customText, setCustomText] =
    useState("Your Text");

  const [textSize, setTextSize] =
    useState(28);

  const [textColor, setTextColor] =
    useState("#000000");

  const [textRotation, setTextRotation] =
    useState(0);

  const [fontFamily, setFontFamily] =
    useState("Arial");

  const [fontWeight, setFontWeight] =
    useState("700");

  const [fontStyle, setFontStyle] =
    useState("normal");

  const [textPosition, setTextPosition] =
    useState({
      x: 120,
      y: 320,
    });

  /* ---------------- DRAG ---------------- */

  const [dragging, setDragging] =
    useState(false);

  const [dragOffset, setDragOffset] =
    useState({
      x: 0,
      y: 0,
    });

  const [draggingText, setDraggingText] =
    useState(false);

  const [
    textDragOffset,
    setTextDragOffset,
  ] = useState({
    x: 0,
    y: 0,
  });

  /* ---------------- OTHER ---------------- */

  const [downloading, setDownloading] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [
    showLoginModal,
    setShowLoginModal,
  ] = useState(false);

  const [loadingWishlist, setLoadingWishlist] =
    useState(false);

  const previewRef =
    useRef<HTMLDivElement>(null);

  const fileRef =
    useRef<HTMLInputElement>(null);

  /* ---------------- WISHLIST ---------------- */

  const item = wishlist.find(
    (w) =>
      w.product_id === productId &&
      (variantId
        ? w.variant_id === variantId
        : true)
  );

  const isWishlisted = !!item;

  /* ───────────────────────────────────────────────────────────── */
  /* LOGIN CHECK */
  /* ───────────────────────────────────────────────────────────── */

  const requireLogin = () => {
    setShowLoginModal(true);
  };

  /* ───────────────────────────────────────────────────────────── */
  /* LOAD PRODUCT IMAGE */
  /* ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!productImage) return;

    let cancelled = false;

    const load = async () => {
      try {
        const base64 =
          await toBase64ViaSameOrigin(
            productImage
          );

        if (!cancelled) {
          setPreviewImage(base64);
        }
      } catch (err) {
        console.error(
          "Failed to load product image:",
          err
        );
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [productImage]);

  /* ───────────────────────────────────────────────────────────── */
  /* UPLOAD */
  /* ───────────────────────────────────────────────────────────── */

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setLogo(reader.result as string);

      setPosition({
        x: 120,
        y: 120,
      });

      setRotation(0);

      setLogoSize(80);
    };

    reader.readAsDataURL(file);
  };

  /* ───────────────────────────────────────────────────────────── */
  /* DRAG */
  /* ───────────────────────────────────────────────────────────── */

  const handleMouseDown = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!previewRef.current) return;

    const b =
      previewRef.current.getBoundingClientRect();

    setDragging(true);

    setDragOffset({
      x: e.clientX - b.left - position.x,
      y: e.clientY - b.top - position.y,
    });
  };

  const handleTextMouseDown = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!previewRef.current) return;

    const b =
      previewRef.current.getBoundingClientRect();

    setDraggingText(true);

    setTextDragOffset({
      x:
        e.clientX -
        b.left -
        textPosition.x,

      y:
        e.clientY -
        b.top -
        textPosition.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!previewRef.current) return;

      const b =
        previewRef.current.getBoundingClientRect();

      if (dragging) {
        const x =
          e.clientX -
          b.left -
          dragOffset.x;

        const y =
          e.clientY -
          b.top -
          dragOffset.y;

        setPosition({
          x: Math.max(
            0,
            Math.min(
              b.width - logoSize,
              x
            )
          ),

          y: Math.max(
            0,
            Math.min(
              b.height - logoSize,
              y
            )
          ),
        });
      }

      if (draggingText) {
        setTextPosition({
          x:
            e.clientX -
            b.left -
            textDragOffset.x,

          y:
            e.clientY -
            b.top -
            textDragOffset.y,
        });
      }
    },
    [
      dragging,
      dragOffset,
      logoSize,
      draggingText,
      textDragOffset,
    ]
  );

  /* ───────────────────────────────────────────────────────────── */
  /* DOWNLOAD */
  /* ───────────────────────────────────────────────────────────── */

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      setDownloading(true);

      const canvas =
        await html2canvas(
          previewRef.current,
          {
            useCORS: true,
            allowTaint: false,
            scale: 4,
            backgroundColor: "#ffffff",
          }
        );

      const image = canvas.toDataURL(
        "image/png",
        1.0
      );

      const link =
        document.createElement("a");

      link.href = image;

      link.download =
        "customized-product.png";

      link.click();
    } catch (err) {
      console.error(
        "Download failed:",
        err
      );
    } finally {
      setDownloading(false);
    }
  };

  /* ───────────────────────────────────────────────────────────── */
  /* WISHLIST */
  /* ───────────────────────────────────────────────────────────── */

  const handleWishlist = async () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    if (loadingWishlist) return;

    setLoadingWishlist(true);

    try {
      if (isWishlisted && item) {
        await removeItem(item.id);

        message.success(
          "Removed from wishlist"
        );
      } else {
        await addToWishlist({
          product_id: productId,
          variant_id: variantId,
          name,
          price,
        });

        message.success(
          "Added to wishlist ❤️"
        );
      }

      onReload?.();
    } finally {
      setLoadingWishlist(false);
    }
  };

  const total = price;

  return (
    <>
      {/* LOGIN MODAL */}

      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1f3526]">
                  Please Login
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  You need to login first to
                  customize products, add
                  wishlist items, and add
                  products to cart.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowLoginModal(false)
                }
                className="text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setShowLoginModal(false)
                }
              >
                Cancel
              </Button>

              <Button
                className="flex-1"
                onClick={() =>
                  router.push("/login")
                }
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN UI */}

      <div className="rounded-2xl border border-[#dde8df] bg-white overflow-hidden shadow-sm">
        <div className="p-5 space-y-4">
          {/* TABS */}

          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#eef5f0] border border-[#dde8df]">
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin();
                  return;
                }

                setActiveTab("image");
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-semibold transition-all",
                activeTab === "image"
                  ? "bg-white shadow-sm text-[#1f3526]"
                  : "text-[#6c8773]"
              )}
            >
              Upload Image
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  requireLogin();
                  return;
                }

                setActiveTab("text");
              }}
              className={cn(
                "h-11 rounded-xl text-sm font-semibold transition-all",
                activeTab === "text"
                  ? "bg-white shadow-sm text-[#1f3526]"
                  : "text-[#6c8773]"
              )}
            >
              Custom Text
            </button>
          </div>

          {/* PREVIEW */}

          <div
            ref={previewRef}
            onMouseMove={handleMouseMove}
            onMouseUp={() => {
              setDragging(false);
              setDraggingText(false);
            }}
            onMouseLeave={() => {
              setDragging(false);
              setDraggingText(false);
            }}
            className="relative w-full h-[600px] rounded-2xl overflow-hidden border bg-white"
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt="Product"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-gray-400 flex items-center justify-center h-full">
                Loading product…
              </div>
            )}

            {logo && (
              <img
                src={logo}
                alt="Logo"
                draggable={false}
                onMouseDown={
                  handleMouseDown
                }
                className="absolute object-contain cursor-grab"
                style={{
                  width: logoSize,
                  height: logoSize,
                  left: position.x,
                  top: position.y,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            )}

            {customText.trim() && (
              <div
                onMouseDown={
                  handleTextMouseDown
                }
                className="absolute cursor-grab whitespace-pre-line"
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
                }}
              >
                {customText}
              </div>
            )}
          </div>

          {/* FILE INPUT */}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />

          {/* ACTIONS */}

          <div className="flex gap-3">
            {is_in_cart ? (
              <Button
                onClick={() =>
                  router.push("/cart")
                }
                className="flex-1 h-12 rounded-xl"
              >
                <ShoppingCart
                  size={16}
                  className="mr-2"
                />
                Go To Cart
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!isLoggedIn) {
                    requireLogin();
                    return;
                  }

                  setShowModal(true);
                }}
                className="flex-1 h-12 rounded-xl"
              >
                <ShoppingCart
                  size={16}
                  className="mr-2"
                />
                Add To Cart
              </Button>
            )}

            <Button
              onClick={handleWishlist}
              disabled={loadingWishlist}
              variant="outline"
              className="h-12 w-12 rounded-xl"
            >
              <Heart
                size={18}
                className={
                  isWishlisted
                    ? "fill-red-500 text-red-500"
                    : ""
                }
              />
            </Button>

            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="h-12 rounded-xl"
            >
              <Download
                size={16}
                className="mr-2"
              />

              {downloading
                ? "Downloading..."
                : "Download"}
            </Button>
          </div>
        </div>
      </div>

      {/* ADD TO CART MODAL */}

      <AddToCartModal
        open={showModal}
        onClose={() =>
          setShowModal(false)
        }
        productId={productId}
        variantId={variantId}
        price={total}
        name={name}
        onSuccess={() => {
          refreshCart();
          onReload?.();
        }}
      />
    </>
  );
}