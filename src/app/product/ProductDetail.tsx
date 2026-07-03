// components/product/ProductDetail.tsx

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
  CheckCircle2,
} from "lucide-react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";
import {
  ProductDetailApi,
  ProductDetailGuestApi,
} from "@/api/operations/product.api";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import { Spin } from "antd";
import AddProductConfigurationModal from "@/components/product/Addproductconfigurationmodal/Addproductconfigurationmodal";
import AddToCartModal from "@/components/common/AddToCartModal";

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
  meta?: string | null;
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
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customizationJson, setCustomizationJson] = useState<string>("");
  const [configuredVariants, setConfiguredVariants] = useState<any[]>([]);

  /* customize */
  const [customizeLoading, setCustomizeLoading] = useState(false);

  /* wishlist */
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  /* quantity */
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
      console.log(res,"res")
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
  if (!product || !selectedColor) return;

  const match = product.variants.find((v) => {
    // Promo / Pre-Made products: no size
    if (!v.size_id) {
      return v.color === selectedColor;
    }

    // Apparel: color + size
    return (
      v.color === selectedColor &&
      selectedSize &&
      v.size_id === selectedSize.id
    );
  });

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

  const handleCustomize = () => {
    if (!product || !variantData) return;
    // Pre-Made products never go through the full customization page —
    // they use the lightweight configuration modal + AddToCartModal flow
    // straight from this page instead.
    if (isPreMade) return;
    router.push(`/customization/${product.id}/${variantData.id}`);
  };

  const handleAddToCart = () => {
    if (!product || !variantData) return;
    if (requireLogin()) return;
    setShowConfigurationModal(true);
  };

  const handleConfigurationComplete = async (config: {
    selectedColor: string;
    selectedSizes: Array<{ variant_id: number; quantity: number; size_name: string }>;
    addAlso: boolean;
  }) => {
    if (!product || !variantData) return;

    try {
      setConfigurationLoading(true);

      // Skip (addAlso === false / no rows selected) — nothing to build.
      if (config.selectedSizes.length === 0) {
        setShowConfigurationModal(false);
        return;
      }

      // ── Group every selected row by the ACTUAL variant's color ──
      // Each row in the config modal can point at a completely different
      // variant (different color, different size) — the old code lumped
      // every row into ONE entry keyed to `variantData.id` (whatever
      // variant happened to be loaded when the page opened), so picking
      // 2+ different variants silently mislabeled or dropped rows in the
      // cart modal. Grouping by color here mirrors exactly what
      // mergeVariantIntoList() does on the full customization page: one
      // ConfiguredVariant per distinct color, with a sizes[] array holding
      // every variant/size/qty line under that color.
      const groups = new Map<
        string,
        {
          variantId: number;
          color: string;
          colorCode: string;
          images: VariantImage[];
          sizes: Array<{
            variant_id: number;
            size_id: number | null;
            size: string;
            quantity: number;
            unit_price: number;
            decoration_unit_price: number;
          }>;
        }
      >();

      config.selectedSizes.forEach((s) => {
        const v = product.variants.find((vv) => vv.id === s.variant_id);
        if (!v) return; // shouldn't happen, but never build a line with no real variant behind it

        const unitPrice = v.original_price ? Number(v.original_price) : Number(v.price ?? displayPrice);
        const colorKey = v.color || config.selectedColor || "Selected Variant";

        const sizeLine = {
          variant_id: s.variant_id,
          size_id: v.size_id ?? null,
          size: s.size_name || v.size_details?.name || v.size || "—",
          quantity: s.quantity,
          unit_price: unitPrice,
          decoration_unit_price: 0, // Pre-Made never carries decoration
        };

        const existing = groups.get(colorKey);
        if (existing) {
          // Same color already has a group — merge this size line in
          // (replace if the exact same variant_id repeats, else push new).
          const dupeIdx = existing.sizes.findIndex((sz) => sz.variant_id === s.variant_id);
          if (dupeIdx > -1) existing.sizes[dupeIdx] = sizeLine;
          else existing.sizes.push(sizeLine);
        } else {
          groups.set(colorKey, {
            variantId: v.id, // representative variant for this color group
            color: colorKey,
            colorCode: v.color_code,
            images: v.images ?? [],
            sizes: [sizeLine],
          });
        }
      });

      // ── Turn each color group into a fully-priced ConfiguredVariant ──
      const builtConfiguredVariants = Array.from(groups.values()).map((g) => {
        const totalQty = g.sizes.reduce((sum, s) => sum + s.quantity, 0);
        const productTotal = g.sizes.reduce((sum, s) => sum + s.unit_price * s.quantity, 0);
        const decorationTotal = 0; // Pre-Made
        return {
          variantId: g.variantId,
          variantName: g.color,
          color: g.color,
          colorCode: g.colorCode,
          images: g.images,
          sizes: g.sizes,
          totalQty,
          totalPrice: productTotal + decorationTotal,
          productTotal,
          decorationTotal,
        };
      });

      setConfiguredVariants(builtConfiguredVariants);
      setCustomizationJson(
        JSON.stringify({
          product_id: product.id,
          customizations: builtConfiguredVariants.flatMap((cv) =>
            cv.sizes.map((s) => ({
              variant_id: s.variant_id,
              color: cv.color,
              size: s.size,
              quantity: s.quantity,
              product_price: s.unit_price,
              decoration_price: 0,
              total_price: s.unit_price * s.quantity,
            }))
          ),
          variants: builtConfiguredVariants.map((cv) => ({
            variant_id: cv.variantId,
            sizes: cv.sizes.map((s) => ({
              size_id: s.size_id,
              variant_id: s.variant_id,
              quantity: s.quantity,
            })),
          })),
        })
      );

      setShowConfigurationModal(false);
      setShowCartModal(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setConfigurationLoading(false);
    }
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
              </div>
              <div className="h-12 w-full mt-6" style={{ background: "#e2e2e2" }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="min-h-screen flex items-center justify-center py-10">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <a href="/categories" className="text-black underline">Back to Products</a>
        </div>
      </section>
    );
  }

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
  // Grand category tells us the product family (e.g. "Pre-Made products" vs customizable apparel)
  const grandCategory = category?.grand_categories?.[0];
  const isPreMade = grandCategory?.title === "Pre-Made products";
  // NOTE: adjust these two titles to match whatever your backend actually
  // sends for the other grand categories — "Pre-Made products" was the only
  // confirmed value, these two are best-guess placeholders.
  const isApparel = grandCategory?.title === "Apparel";
  const isPromo = grandCategory?.title === "Promo Products";
  const isLowStock = variantData?.stock != null && variantData.stock > 0 && variantData.stock <= 5;

  /* AddProductConfigurationModal has its OWN local `Variant` type with
     `price: number` (this file's `Variant.price` is `string`, straight
     from the API). Same type name, structurally different — TS treats
     them as unrelated and refuses the array assignment. Coerce price
     (and original_price) to number here, once, right before handing
     variants to the modal, instead of changing either component's type. */
  const configModalVariants = product.variants.map((v) => ({
    ...v,
    price: Number(v.price),
    original_price: v.original_price != null ? Number(v.original_price) : undefined,
  }));
  const configModalSelectedVariant = variantData
    ? {
        ...variantData,
        price: Number(variantData.price),
        original_price:
          variantData.original_price != null ? Number(variantData.original_price) : undefined,
      }
    : undefined;

  /* ───────────────────────────────────────────────── render */
  return (
    <div className="min-h-screen">

      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="text-center bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Sign in to continue</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2 bg-black text-white rounded"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-5 py-2 border border-black rounded"
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

                {/* Customize (apparel) OR Add to Cart (Pre-Made products) */}
                {isPreMade ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-[52px] flex items-center justify-center gap-2.5 text-sm font-bold tracking-widest uppercase transition-all duration-150 active:scale-[0.98]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      background: inCart ? "#666" : "#111",
                      color: inCart ? "#999" : "#fff",
                      border: "none",
                    }}
                    disabled={inCart}
                  >
                    {inCart ? (
                      <>
                        <CheckCircle2 size={16} />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Add to Cart
                      </>
                    )}
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          </div>

          {/* ── ACCORDION ── */}
          <div className="mt-32">
            <ProductAccordion description={product.description} />
          </div>
        </div>
      </section>

      {/* ── CONFIGURATION MODAL ── */}
      {variantData && (
        <AddProductConfigurationModal
          open={showConfigurationModal}
          onClose={() => setShowConfigurationModal(false)}
          onConfirm={handleConfigurationComplete}
          productId={Number(product.id)}
          productName={product.name}
          variants={configModalVariants}
          sizes={product.sizes}
          selectedVariant={configModalSelectedVariant}
          mode="premade"
          isSubmitting={configurationLoading}
          // ✅ category flags
          isApparel={isApparel}
          isPreMade={isPreMade}
          isPromo={isPromo}
        />
      )}

      {/* ── ADD TO CART MODAL — Pre-Made goes straight here from the
           configuration modal above, never through /customization/... ── */}
      {product && variantData && (
        <AddToCartModal
          open={showCartModal}
          onClose={() => setShowCartModal(false)}
          productId={Number(product.id)}
          variantId={variantData.id}
          name={product.name}
          price={displayPrice}
          initialQuantity={
            configuredVariants.length > 0
              ? configuredVariants.reduce((sum: number, cv: any) => sum + cv.totalQty, 0)
              : quantity
          }
          sageMetaStr={variantData.meta ?? null}
          customization={customizationJson}
          canvasBlob={null}
          printPricePerPiece={0}
          digitizingFee={0}
          configuredVariants={configuredVariants.length > 0 ? configuredVariants : undefined}
          // ✅ category flags
          isApparel={isApparel}
          isPreMade={isPreMade}
          isPromo={isPromo}
          onSuccess={() => {
            setInCart(true);
            setShowCartModal(false);
            setConfiguredVariants([]);
            fetchProduct();
          }}
        />
      )}
    </div>
  );
}