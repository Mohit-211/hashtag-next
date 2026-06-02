"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  Sparkles,
  Loader2,
  Minus,
  Plus,
  X,
  ChevronRight,
  CheckCircle2,
  Truck,
  RotateCcw,
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
  id: string;
  name: string;
  price: number;
  image: string;
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

  /* quantity */
  const [quantity, setQuantity] = useState(1);
  const decreaseQuantity = () => setQuantity((p) => Math.max(1, p - 1));
  const increaseQuantity = () => {
    if (variantData?.max_order_quantity && quantity >= variantData.max_order_quantity) return;
    setQuantity((p) => p + 1);
  };

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

  const handleCustomize = async () => {
    if (!product || !variantData) return;
    try {
      setCustomizeLoading(true);
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const image =
        displayAttachments?.[activeGalleryIndex]?.file_uri ||
        displayAttachments?.[0]?.file_uri || "";
      const params = new URLSearchParams({
        productId: product.id,
        variantId: String(variantData.id),
        price: String(displayPrice),
        name: product.name,
        image,
      });
      router.push(`/customization/${slug}?${params.toString()}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomizeLoading(false);
    }
  };

  /* ── skeleton ── */
  if (loading) {
    return (
      <section className="min-h-screen  py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="animate-pulse grid lg:grid-cols-2 gap-12">
            {/* gallery skeleton */}
            <div className="space-y-3">
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-[#ede9e3] to-[#e0dbd2]" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl bg-[#e0dbd2]" />
                ))}
              </div>
            </div>
            {/* info skeleton */}
            <div className="space-y-5 pt-4">
              <div className="h-3 w-1/3 rounded-full bg-[#e0dbd2]" />
              <div className="h-9 w-4/5 rounded-xl bg-[#e0dbd2]" />
              <div className="h-7 w-1/4 rounded-xl bg-[#e0dbd2]" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded-full bg-[#e0dbd2]" />
                <div className="h-3 w-5/6 rounded-full bg-[#e0dbd2]" />
                <div className="h-3 w-3/4 rounded-full bg-[#e0dbd2]" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-[#e0dbd2]" />
              <div className="h-12 w-full rounded-2xl bg-[#d4cfc7]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-[#f8f6f2]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#e8e4de] flex items-center justify-center">
            <ShoppingCart size={24} className="text-[#9e9589]" />
          </div>
          <p className="text-lg font-semibold text-[#1f3526]">Product not found</p>
          <p className="text-sm text-[#8a8279]">This item may have been removed or is unavailable.</p>
          <button
            onClick={() => router.push("/categories")}
            className="mt-2 text-sm text-[#1f3526] underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            Browse all products
          </button>
        </div>
      </section>
    );
  }

  /* derived */
  const displayPrice = variantData?.price ? Number(variantData.price) : product.price;
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
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
            style={{ boxShadow: "0 32px 80px -12px rgba(31,53,38,0.25)" }}
          >
            {/* close */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f0ece6] flex items-center justify-center text-[#6b7280] hover:bg-[#e5e0d8] transition-colors"
            >
              <X size={14} />
            </button>

            {/* icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#f0f7f2] flex items-center justify-center mb-5">
              <Shield size={24} className="text-[#1f3526]" />
            </div>

            <h2 className="text-xl font-bold text-[#1f3526] tracking-tight mb-2">
              Sign in to continue
            </h2>
            <p className="text-sm text-[#7a7368] leading-6 mb-7">
              Access your cart, wishlist, and customization tools by signing into your account.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/login")}
                className="w-full h-12 rounded-2xl bg-[#1f3526] text-white text-sm font-semibold tracking-wide hover:bg-[#2d4e37] active:scale-[0.98] transition-all duration-150"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full h-12 rounded-2xl border border-[#dbe6de] text-[#1f3526] text-sm font-medium hover:bg-[#f0f7f2] active:scale-[0.98] transition-all duration-150"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BREADCRUMB ── */}
      <div className="border-b border-[#ece8e2] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-1.5 py-3.5 text-xs text-[#9e9589]">
            <a href="/" className="hover:text-[#1f3526] transition-colors">Home</a>
            <ChevronRight size={12} className="shrink-0 opacity-50" />
            <a href="/categories" className="hover:text-[#1f3526] transition-colors">Products</a>
            {category?.name && (
              <>
                <ChevronRight size={12} className="shrink-0 opacity-50" />
                <a href={`/categories/${category.id}`} className="hover:text-[#1f3526] transition-colors">
                  {category.name}
                </a>
              </>
            )}
            <ChevronRight size={12} className="shrink-0 opacity-50" />
            <span className="text-[#1f3526] font-medium truncate max-w-[160px] sm:max-w-xs">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="py-10 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-[55%_45%] gap-10 xl:gap-16">

            {/* ── GALLERY ── */}
            <div className="lg:sticky lg:top-[72px] self-start">
              <ProductGallery
                attachments={displayAttachments}
                onActiveChange={setActiveGalleryIndex}
              />
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="space-y-7">

              {/* category pill */}
              {category?.name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#4a7a58] bg-[#eef7f1] px-3 py-1.5 rounded-full">
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
              />

              {/* low stock badge */}
              {isLowStock && (
                <div className="flex items-center gap-2 bg-[#fff8ed] border border-[#fde5b4] rounded-2xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                  <p className="text-xs font-semibold text-[#92640a]">
                    Only {variantData?.stock} left in stock — order soon
                  </p>
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="space-y-3 pt-1">
                {/* Customize */}
                <button
                  onClick={handleCustomize}
                  disabled={customizeLoading}
                  className={cn(
                    "group w-full h-13 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 border-2 border-[#1f3526]",
                    customizeLoading
                      ? "bg-[#1f3526] text-white cursor-not-allowed opacity-80"
                      : "bg-white text-[#1f3526] hover:bg-[#1f3526] hover:text-white active:scale-[0.98]"
                  )}
                  style={{ height: "52px" }}
                >
                  {customizeLoading ? (
                    <span className="flex items-center gap-2">
                      <Spin className="animate-spin" />
                      Preparing customizer…
                    </span>
                  ) : (
                    <>
                      <Sparkles size={16} className="transition-transform duration-300 group-hover:rotate-12" />
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