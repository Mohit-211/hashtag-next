// ✅ KEY FIXES IN THIS FILE:
// 1. Line ~145: Fixed router.push syntax from `{$variantData?.id}` to `${variantData.id}`
// 2. Added null check for variantData

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Sparkles,
  Loader2,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import AddToCartModal from "@/components/common/AddToCartModal";
import {
  ProductDetailApi,
  ProductDetailGuestApi,
} from "@/api/operations/product.api";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import { Spin } from "antd";

/* ───────────────────────────────────────────────── types */
interface Size {
  id: number;
  name: string;
  measurements?: string;
}
interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}
interface Variant {
  id: number;
  product_id: number;
  sku: string;
  color: string;
  color_code: string;
  size: string;
  size_id: number;
  price: string;
  original_price: string;
  stock: number;
  min_order_quantity: number;
  max_order_quantity: number | null;
  is_active: boolean;
  is_in_cart?: boolean;
  is_in_wishlist?: boolean;
  wishlist_id?: number | null;
  images: VariantImage[];
  size_details: Size;
}
interface Product {
  brand: any;
  id: string;
  name: string;
  price: number;
  image: string;
   original_price: number;
  description?: string;
  sizes: Size[];
  attachments: any[];
  categories: any[];
  variants: Variant[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ───────────────────────────────────────────────── component */
export default function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<Variant | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  /* auth */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn =
    mounted && typeof window !== "undefined" && !!localStorage.getItem("hastagBillionaire");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const requireLogin = () => {
    if (!isLoggedIn) { setShowLoginModal(true); return true; }
    return false;
  };

  /* cart */
  const [inCart, setInCart] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  /* customize */
  const [customizeLoading, setCustomizeLoading] = useState(false);

  /* wishlist */
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  /* quantity — kept for AddToCartModal */
  const [quantity, setQuantity] = useState(1);

  /* wishlist item */
  const wishlistItem = wishlist.find(
    (item) => item.product_id === Number(product?.id) && item.variant_id === variantData?.id
  );
  const inWishlist = !!wishlistItem;

  /* fetch */
  const fetchProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("hastagBillionaire") : null;
      const res = token ? await ProductDetailApi(id) : await ProductDetailGuestApi(id);
      const data = res?.data?.data || res?.data;
      setProduct(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchProduct(); }, [id]);

  /* default variant */
  useEffect(() => {
    if (!product?.variants?.length) return;
    const first = product.variants[0];
    setSelectedColor(first.color);
    setSelectedSize(first.size_details);
    setVariantData(first);
    setInCart(Boolean(first.is_in_cart));
    setQuantity(first.min_order_quantity || 1);
  }, [product]);

  /* update variant */
  useEffect(() => {
    if (!product || !selectedColor || !selectedSize) return;
    const match = product.variants.find(
      (v) => v.color === selectedColor && v.size_id === selectedSize.id
    );
    if (match) {
      setVariantData(match);
      setInCart(Boolean(match.is_in_cart));
      setQuantity(match.min_order_quantity || 1);
    }
  }, [selectedColor, selectedSize, product]);

  /* handlers */
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const first = product?.variants.find((v) => v.color === color);
    if (first) {
      setSelectedSize(first.size_details);
      setVariantData(first);
      setInCart(Boolean(first.is_in_cart));
    }
  };
  const handleSizeChange = (size: Size) => setSelectedSize(size);

  const handleWishlist = async () => {
    if (!product || !variantData) return;
    if (requireLogin()) return;
    try {
      setWishlistLoading(true);
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id);
      } else {
        await addToWishlist({
          product_id: Number(product.id),
          variant_id: variantData.id,
          name: product.name,
          price: displayPrice,
          image: displayAttachments?.[0]?.file_uri || displayAttachments?.[0]?.url || "",
        });
      }
      await fetchWishlist();
      await fetchProduct();
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
    }
  };

  /* ✅ FIXED: correct syntax with ${} and null check */
  const handleCustomize = () => {
    if (!product || !variantData) return;
    router.push(`/customization/${variantData.id}`);
  };

  /* ── skeleton ── */
  if (loading) {
    return (
      <section className="min-h-screen py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="animate-pulse grid lg:grid-cols-2 gap-10">
            <div className="space-y-3">
              <div className="aspect-[4/5]" style={{ background: "#e2e2e2" }} />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-16" style={{ background: "#e2e2e2" }} />
                ))}
              </div>
            </div>
            <div className="space-y-5 pt-4">
              <div className="h-3 w-1/3" style={{ background: "#e2e2e2" }} />
              <div className="h-9 w-4/5" style={{ background: "#e2e2e2" }} />
              <div className="h-7 w-1/4" style={{ background: "#e2e2e2" }} />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full" style={{ background: "#e2e2e2" }} />
                <div className="h-3 w-5/6" style={{ background: "#e2e2e2" }} />
                <div className="h-3 w-3/4" style={{ background: "#e2e2e2" }} />
              </div>
              <div className="h-[52px] w-full" style={{ background: "#ccc" }} />
              <div className="h-[52px] w-full" style={{ background: "#ccc" }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section
        className="min-h-[60vh] flex items-center justify-center"
        style={{ background: "#f5f5f5" }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 mx-auto flex items-center justify-center"
            style={{ background: "#111" }}
          >
            <ShoppingCart size={24} color="#f0c419" />
          </div>
          <p
            className="text-lg font-bold tracking-widest uppercase"
            style={{ color: "#111", fontFamily: "var(--font-heading)" }}
          >
            Product Not Found
          </p>
          <p className="text-sm" style={{ color: "#666" }}>
            This item may have been removed or is unavailable.
          </p>
          <button
            onClick={() => router.push("/categories")}
            className="mt-2 text-sm font-semibold underline underline-offset-4 hover:opacity-60 transition-opacity"
            style={{ color: "#111" }}
          >
            Browse all products
          </button>
        </div>
      </section>
    );
  }

  /* derived */
const displayPrice =
  variantData?.original_price
    ? Number(variantData.original_price)
    : product.price;
  const displayAttachments =
    variantData?.images && variantData.images.length > 0
      ? variantData.images.map((img) => ({
        ...img,
        url: img.file_name?.startsWith("http") ? img.file_name : `${BASE_URL}${img.file_uri}`,
      }))
      : product?.attachments || [];
  const category = product?.categories?.[0]?.parent_categories?.[0];
  const isLowStock = variantData?.stock != null && variantData.stock > 0 && variantData.stock <= 5;

  /* ───────────────────────────────────────────────── render */
  return (
    <div className="min-h-screen">

      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Sign in to continue</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2 bg-black text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-5 py-2 border border-black"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BREADCRUMB ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto max-w-7xl px-4">
          <nav className="flex items-center gap-2 py-3 text-sm">
            <a href="/" className="text-gray-500 hover:text-black">Home</a>
            <ChevronRight size={14} className="text-gray-300" />
            <a href="/categories" className="text-gray-500 hover:text-black">Products</a>
            {category?.name && (
              <>
                <ChevronRight size={14} className="text-gray-300" />
                <a href={`/categories/${category.id}`} className="text-gray-500 hover:text-black">
                  {category.name}
                </a>
              </>
            )}
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-semibold text-black truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="py-8 lg:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-[55%_45%] gap-8 xl:gap-14">

            {/* ── GALLERY ── */}
            <div className="lg:sticky lg:top-[50px] self-start">
              <ProductGallery
                attachments={displayAttachments}
                onActiveChange={setActiveGalleryIndex}
              />
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="flex flex-col gap-5">

              {/* category pill */}
              {category?.name && (
                <span
                  className="inline-flex items-center gap-1.5 self-start text-xs font-bold tracking-widest uppercase px-3 py-1.5"
                  style={{
                    background: "#f0c419",
                    color: "#111",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {category.name}
                </span>
              )}

              {/* product info */}
              <ProductInfo
                name={product.name}
                price={displayPrice}
                description={product.description}
                variants={product.variants}
                sizes={product.sizes}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                variantStock={variantData?.stock ?? null}
                variantSku={variantData?.sku ?? null}
                variantLoading={false}
                brandName={product?.brand?.name}
                brandLogo={product?.brand?.logo_url}
              />

              {/* low stock badge */}
              {isLowStock && (
                <div
                  className="flex items-center gap-2 px-4 py-3"
                  style={{ background: "#fff8ed", borderLeft: "3px solid #f59e0b" }}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                    style={{ background: "#f59e0b" }}
                  />
                  <p
                    className="text-xs font-bold"
                    style={{ color: "#92640a", fontFamily: "var(--font-heading)" }}
                  >
                    Only {variantData?.stock} left in stock — order soon
                  </p>
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="flex flex-col gap-3 pt-1">

                {/* Wishlist */}
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={cn(
                    "w-full h-[52px] flex items-center justify-center gap-2.5 text-sm font-bold tracking-widest uppercase transition-all duration-150 active:scale-[0.98]"
                  )}
                  style={{
                    fontFamily: "var(--font-heading)",
                    background: inWishlist ? "#111" : "transparent",
                    color: inWishlist ? "#f0c419" : "#111",
                    border: "2px solid #111",
                  }}
                >
                  {wishlistLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Heart
                      size={16}
                      fill={inWishlist ? "#f0c419" : "none"}
                      color={inWishlist ? "#f0c419" : "#111"}
                    />
                  )}
                  {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
                </button>

                {/* Customize — ✅ now passes variantId correctly */}
                <button
                  onClick={handleCustomize}
                  disabled={customizeLoading}
                  className={cn(
                    "group w-full h-[52px] flex items-center justify-center gap-2.5 text-sm font-bold tracking-widest uppercase transition-all duration-150 active:scale-[0.98]",
                    customizeLoading ? "opacity-80 cursor-not-allowed" : ""
                  )}
                  style={{
                    fontFamily: "var(--font-heading)",
                    background: "#f0c419",
                    color: "#111",
                    border: "none",
                  }}
                >
                  {customizeLoading ? (
                    <>
                      <Spin className="animate-spin" />
                      <span>Preparing customizer…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={16}
                        className="transition-transform duration-300 group-hover:rotate-12"
                      />
                      Customize This Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── ACCORDION ── */}
          <div className="mt-16">
            <ProductAccordion description={product.description} />
          </div>

          {/* ── RELATED ── */}
          <div className="mt-16">
            <RelatedProducts category_id={category?.id} />
          </div>
        </div>
      </section>

      {/* ── ADD TO CART MODAL ── */}
      {variantData && (
        <AddToCartModal
          open={showCartModal}
          onClose={() => setShowCartModal(false)}
          productId={Number(product.id)}
          variantId={variantData.id}
          price={displayPrice}
          name={product.name}
          initialQuantity={quantity}
          onSuccess={() => { setInCart(true); fetchProduct(); }}
        />
      )}
    </div>
  );
}