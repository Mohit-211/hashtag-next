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

/* ───────────────────────────────────────────────────────────── */

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

/* ───────────────────────────────────────────────────────────── */

export default function ProductDetail({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  const [variantData, setVariantData] = useState<Variant | null>(null);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  /* ── auth ── */

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn =
    mounted &&
    typeof window !== "undefined" &&
    !!localStorage.getItem("hastagBillionaire");

  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireLogin = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }

    return false;
  };

  /* ── cart ── */

  const [inCart, setInCart] = useState(false);

  const [showCartModal, setShowCartModal] = useState(false);

  /* ── customize loading ── */

 const [customizeLoading, setCustomizeLoading] =
  useState(false);

  /* ── wishlist ── */

  const {
    wishlist,
    addToWishlist,
    removeItem,
    fetchWishlist,
  } = useWishlist();

  const [wishlistLoading, setWishlistLoading] =
    useState(false);

  /* ── quantity ── */

  const [quantity, setQuantity] = useState(1);

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    if (
      variantData?.max_order_quantity &&
      quantity >= variantData.max_order_quantity
    ) {
      return;
    }

    setQuantity((prev) => prev + 1);
  };

  /* ── wishlist item ── */

  const wishlistItem = wishlist.find(
    (item) =>
      item.product_id === Number(product?.id) &&
      item.variant_id === variantData?.id
  );

  const inWishlist = !!wishlistItem;

  /* ── fetch product ── */

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("hastagBillionaire")
          : null;

      const res = token
        ? await ProductDetailApi(id)
        : await ProductDetailGuestApi(id);

      const data = res?.data?.data || res?.data;

      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  /* ── default variant ── */

  useEffect(() => {
    if (!product?.variants?.length) return;

    const firstVariant = product.variants[0];

    setSelectedColor(firstVariant.color);

    setSelectedSize(firstVariant.size_details);

    setVariantData(firstVariant);

    setInCart(Boolean(firstVariant.is_in_cart));

    setQuantity(firstVariant.min_order_quantity || 1);
  }, [product]);

  /* ── update variant ── */

  useEffect(() => {
    if (!product || !selectedColor || !selectedSize)
      return;

    const matchedVariant = product.variants.find(
      (variant) =>
        variant.color === selectedColor &&
        variant.size_id === selectedSize.id
    );

    if (matchedVariant) {
      setVariantData(matchedVariant);

      setInCart(Boolean(matchedVariant.is_in_cart));

      setQuantity(
        matchedVariant.min_order_quantity || 1
      );
    }
  }, [selectedColor, selectedSize, product]);

  /* ── handlers ── */

  const handleColorChange = (color: string) => {
    setSelectedColor(color);

    const firstVariantForColor = product?.variants.find(
      (variant) => variant.color === color
    );

    if (firstVariantForColor) {
      setSelectedSize(firstVariantForColor.size_details);

      setVariantData(firstVariantForColor);

      setInCart(
        Boolean(firstVariantForColor.is_in_cart)
      );
    }
  };

  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
  };

  /* ── wishlist ── */

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
          image:
            displayAttachments?.[0]?.file_uri ||
            displayAttachments?.[0]?.url ||
            "",
        });
      }

      await fetchWishlist();

      await fetchProduct();
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  /* ── customize ── */

const handleCustomize = async () => {
  if (!product || !variantData) return;

  try {
    setCustomizeLoading(true);

    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const image =
      displayAttachments?.[
        activeGalleryIndex
      ]?.file_uri ||
      displayAttachments?.[0]?.file_uri ||
      "";

    const params = new URLSearchParams({
      productId: product.id,
      variantId: String(variantData.id),
      price: String(displayPrice),
      name: product.name,
      image,
    });

    router.push(
      `/customization/${slug}?${params.toString()}`
    );
  } catch (error) {
    console.error(error);
  } finally {
    setCustomizeLoading(false);
  }
};

  /* ── loading ── */

  if (loading) {
    return (
      <section className="min-h-screen bg-[#faf9f7] py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="animate-pulse grid lg:grid-cols-2 gap-10">
            <div className="aspect-square rounded-3xl bg-[#e8e4df]" />

            <div className="space-y-4">
              <div className="h-10 w-3/4 rounded-xl bg-[#e8e4df]" />

              <div className="h-8 w-1/4 rounded-xl bg-[#e8e4df]" />

              <div className="h-28 rounded-2xl bg-[#e8e4df]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── not found ── */

  if (!product) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-[#1f3526]">
            Product not found
          </p>
        </div>
      </section>
    );
  }

  /* ── derived ── */

  const displayPrice = variantData?.price
    ? Number(variantData.price)
    : product.price;

 const displayAttachments =
  variantData?.images &&
  variantData.images.length > 0
    ? variantData.images.map((img) => ({
        ...img,
        url: img.file_name?.startsWith("http")
          ? img.file_name
          : `${BASE_URL}${img.file_uri}`,
      }))
    : product?.attachments || [];
  const category =
    product?.categories?.[0]
      ?.parent_categories?.[0];

  /* ───────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── LOGIN MODAL ── */}

      {showLoginModal && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[#1f3526]">
                Login Required
              </h2>

              <button
                onClick={() =>
                  setShowLoginModal(false)
                }
                className="text-[#7a9882]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-[#6b7280] leading-6 mb-6">
              Please sign in to continue with cart,
              wishlist and customization features.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowLoginModal(false)
                }
                className="flex-1 h-11 rounded-xl border border-[#d8e5db]"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  router.push("/login")
                }
                className="flex-1 h-11 rounded-xl bg-[#1f3526] text-white font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── breadcrumb ── */}

      <div className="border-b border-[#ece8e2] bg-white sticky top-0 z-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-2 py-4 text-sm">
            <a
              href="/"
              className="text-[#7a9882] hover:text-[#1f3526]"
            >
              Home
            </a>

            <span>/</span>

            <a
              href="/categories"
              className="text-[#7a9882] hover:text-[#1f3526]"
            >
              Products
            </a>

            {category?.name && (
              <>
                <span>/</span>

                <span className="text-[#7a9882]">
                  {category.name}
                </span>
              </>
            )}

            <span>/</span>

            <span className="text-[#1f3526] font-medium truncate">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── content ── */}

      <section className="py-10 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
            {/* gallery */}

            <div className="lg:sticky lg:top-[90px]">
              <ProductGallery
                attachments={displayAttachments}
                onActiveChange={
                  setActiveGalleryIndex
                }
              />
            </div>

            {/* right side */}

            <div className="space-y-6">
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
                variantStock={
                  variantData?.stock ?? null
                }
                variantSku={
                  variantData?.sku ?? null
                }
                variantLoading={false}
              />

              {/* customize */}

              <button
  onClick={handleCustomize}
  disabled={customizeLoading}
  className={cn(
    "w-full h-12 rounded-2xl border-2 border-[#1f3526] font-bold flex items-center justify-center gap-2 transition-all duration-200",
    customizeLoading
      ? "bg-[#1f3526] text-white cursor-not-allowed"
      : "text-[#1f3526] hover:bg-[#1f3526] hover:text-white"
  )}
>
  {customizeLoading ? (
    <div className="flex items-center gap-2">
      <Spin
      
        className="animate-spin"
      />

      <span>Loading...</span>
    </div>
  ) : (
    <>
      <Sparkles size={16} />
      Customize This Product
    </>
  )}
</button>

              {/* quantity */}

              {variantData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6b7280]">
                      Quantity
                    </span>

                    <div className="flex items-center overflow-hidden rounded-xl border border-[#dbe6de]">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center",
                          quantity <= 1
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-[#eef5f0]"
                        )}
                      >
                        <Minus size={14} />
                      </button>

                      <div className="w-10 text-center font-semibold">
                        {quantity}
                      </div>

                      <button
                        onClick={increaseQuantity}
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#eef5f0]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* buttons */}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (requireLogin())
                          return;

                        setShowCartModal(true);
                      }}
                      className={cn(
                        "flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all",
                        inCart
                          ? "bg-[#e8f0ea] text-[#4a7a58]"
                          : "bg-[#1f3526] text-white hover:bg-[#294832]"
                      )}
                    >
                      <ShoppingCart size={16} />

                      {inCart
                        ? "Added To Cart"
                        : "Add To Cart"}
                    </button>

                    <button
                      onClick={handleWishlist}
                      disabled={wishlistLoading}
                      className="w-12 h-12 rounded-2xl border border-[#dbe6de] flex items-center justify-center hover:bg-[#fef3f3]"
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
                              : "transparent"
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
                </div>
              )}
            </div>
          </div>

          {/* accordion */}

          <div className="mt-14">
            <ProductAccordion
              description={product.description}
            />
          </div>

          {/* related */}

          <div className="mt-14">
            <RelatedProducts
              category_id={category?.id}
            />
          </div>
        </div>
      </section>

      {/* ── add to cart modal ── */}

      {variantData && (
        <AddToCartModal
          open={showCartModal}
          onClose={() =>
            setShowCartModal(false)
          }
          productId={Number(product.id)}
          variantId={variantData.id}
          price={displayPrice}
          name={product.name}
          initialQuantity={quantity}
          onSuccess={() => {
            setInCart(true);

            fetchProduct();
          }}
        />
      )}
    </div>
  );
}