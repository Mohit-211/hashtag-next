"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoginPromptModal from "@/components/auth/LoginPromptModal";
import {
  currentPath,
  hasAuthToken,
  loginUrl,
  peekPendingAuthAction,
  savePendingAuthAction,
  takePendingAuthAction,
  type LoginResumeRequest,
} from "@/lib/authRedirect";
import { clearPendingFiles, savePendingFiles } from "@/lib/pendingAuthFiles";
import { GetWishlistApi } from "@/api/operations/wishlist.api";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  Sparkles,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isGrandCategory } from "@/lib/productFamily";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import type { ProductCategoryRef } from "@/data/typesproduct";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductAccordion from "@/components/product/ProductAccordion";
import {
  ProductDetailApi,
  ProductDetailGuestApi,
} from "@/api/operations/product.api";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import AddProductConfigurationModal from "@/components/product/Addproductconfigurationmodal/Addproductconfigurationmodal";
import AddToCartModal, { type ConfiguredVariant } from "@/components/common/AddToCartModal";
import ManualCustomizationPage from "@/components/product/ManualCustomizationPage";
import { useCart } from "@/contexts/CartContext";
import { parseManualMeta, parseManualOptionValues } from "@/components/product/customization/Productcustomizationpage";
/* ───────────────────────────────────────────────── types */
interface Size {
  id: number;
  name: string;
  type?: string;
  measurements?: string;
  display_style?: string | null;
  is_active?: boolean;
}
interface VariantImage {
  id: number;
  file_name: string;
  file_uri: string;
  is_primary: boolean;
}
interface Variant {
  /** SAGE pricing tiers; `net` is the customer price for that tier. */
  pricing_tiers_customer?: { net?: number }[] | null;
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
  meta?: string | null;
  supplier?: string | null;
}
interface Product {
  brand?: { name?: string; logo_url?: string | null } | null;
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  sizes: Size[];
  attachments: { file_uri: string; file_name?: string; url?: string }[];
  categories: ProductCategoryRef[];
  variants: Variant[];
  meta?: string | null;
}

/* MANUAL-supplier products describe their options (Pages / Size / Color …)
 * in product.meta, and each variant's meta lists the value it has for each. */
interface ManualOptionGroup {
  name: string;
  values: string[];
  /** Backend-controlled UI for the group (dropdown / radio / checkbox / button / color). */
  displayStyle?: string;
}
/** Shape of one entry in a MANUAL product's `meta.options`. */
interface RawManualOption {
  name?: unknown;
  display_style?: string;
  values?: Array<{ name?: unknown; display_style?: string } | null>;
}
const parseJson = (raw?: string | null): { options?: unknown; option_values?: unknown } | null => {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return typeof obj === "string" ? JSON.parse(obj) : obj;
  } catch {
    return null;
  }
};
const getManualOptionGroups = (product: Product): ManualOptionGroup[] => {
  // display_style lives on product.sizes (one row per option value), keyed by
  // its type — use it even when the option list itself comes from meta.
  const sizeStyles = new Map<string, string>();
  (product.sizes ?? []).forEach((s) => {
    const key = (s.type?.trim() || "Size").toLowerCase();
    if (s.display_style && !sizeStyles.has(key)) sizeStyles.set(key, s.display_style);
  });
  const options = parseJson(product.meta)?.options;
  if (Array.isArray(options) && options.length > 0) {
    return (options as RawManualOption[])
      .map((o) => {
        const name = String(o?.name ?? "").trim();
        return {
          name,
          values: (Array.isArray(o?.values) ? o.values : []).map((v) => String(v?.name ?? "").trim()).filter(Boolean),
          displayStyle:
            o?.display_style ??
            (Array.isArray(o?.values) ? o.values.find((v) => v?.display_style)?.display_style : undefined) ??
            sizeStyles.get(name.toLowerCase()),
        };
      })
      .filter((g: ManualOptionGroup) => g.name && g.values.length > 0);
  }
  // No meta options — fall back to product.sizes grouped by their type.
  const groups = new Map<string, ManualOptionGroup>();
  product.sizes.forEach((s) => {
    if (s.is_active === false) return;
    const key = s.type?.trim() || "Size";
    const group = groups.get(key) ?? { name: key, values: [] };
    const val = s.name.trim();
    if (val && !group.values.includes(val)) group.values.push(val);
    if (!group.displayStyle && s.display_style) group.displayStyle = s.display_style;
    groups.set(key, group);
  });
  return Array.from(groups.values()).filter((g) => g.values.length > 0);
};
const getVariantOptionValues = (v: Variant): Record<string, string> => {
  const out: Record<string, string> = {};
  parseManualOptionValues(parseJson(v.meta)?.option_values).forEach((ov) => {
    out[ov.name] = ov.value;
  });
  return out;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/** Logged-in shoppers get their cart/wishlist flags; guests use the public endpoint. */
const fetchProductData = async (id: string): Promise<Product | null> => {
  const res = hasAuthToken() ? await ProductDetailApi(id) : await ProductDetailGuestApi(id);
  return res?.data?.data || res?.data || null;
};

/* ── actions resumed after a login round trip (see lib/authRedirect) ── */
export const PRODUCT_ADD_TO_CART_ACTION = "product:add-to-cart";
export const PRODUCT_WISHLIST_ACTION = "product:wishlist";
interface ProductResumePayload {
  productId: string;
  variantId: number;
  quantity: number;
}

/* ───────────────────────────────────────────────── component */
export default function ProductDetail({ id, variantId }: { id: string; variantId?: string | null }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [variantData, setVariantData] = useState<Variant | null>(null);
  /* auth */
  const isLoggedIn = useIsLoggedIn();
  const [showLoginModal, setShowLoginModal] = useState(false);
  // The action to resume after login; saved only once the user picks "Sign in".
  const loginResumeRef = useRef<LoginResumeRequest | null>(null);
  const requireLogin = (resume?: LoginResumeRequest) => {
    if (isLoggedIn) return false;
    loginResumeRef.current = resume ?? null;
    setShowLoginModal(true);
    return true;
  };
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);
  const goToLogin = async () => {
    if (redirectingToLogin) return;
    setRedirectingToLogin(true);
    // Come back to this exact variant.
    const returnTo = currentPath({ variant_id: variantData?.id });
    const resume = loginResumeRef.current;
    if (resume) {
      const action = savePendingAuthAction(resume.type, resume.payload, returnTo);
      if (action && resume.files?.length) await savePendingFiles(action.id, resume.files);
    }
    router.push(loginUrl(returnTo));
  };
  // "Products" crumb returns to the filtered listing the shopper came from.
  const backToProducts = (e: React.MouseEvent) => {
    const returnUrl = sessionStorage.getItem("categoriesReturnUrl");
    if (!returnUrl) return;
    e.preventDefault();
    router.push(returnUrl);
  };
  const cancelLogin = () => {
    if (loginResumeRef.current?.files?.length) clearPendingFiles();
    loginResumeRef.current = null;
    setShowLoginModal(false);
  };

  /* cart */
  const [inCart, setInCart] = useState(false);
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customizationJson, setCustomizationJson] = useState<string>("");
  const [configuredVariants, setConfiguredVariants] = useState<ConfiguredVariant[]>([]);
  const { refreshCart } = useCart();

  /* wishlist */
  const { wishlist, addToWishlist, removeItem, fetchWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  /* quantity */
  const [quantity, setQuantity] = useState(1);

  /* MANUAL options */
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const isManualProduct = useMemo(
    () => !!product?.variants?.some((v) => (v.supplier ?? "").toUpperCase() === "MANUAL"),
    [product]
  );
  const manualOptionGroups = useMemo(
    () => (product && isManualProduct ? getManualOptionGroups(product) : []),
    [product, isManualProduct]
  );
  const manualVariantOptions = useMemo(
    () => new Map((isManualProduct ? product?.variants ?? [] : []).map((v) => [v.id, getVariantOptionValues(v)])),
    [product, isManualProduct]
  );

  /* wishlist item */
  const wishlistItem = wishlist.find(
    (item) => item.product_id === Number(product?.id) && item.variant_id === variantData?.id
  );
  const inWishlist = !!wishlistItem;

  /* fetch — the page is keyed by product/variant, so this runs once per product */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchProductData(id)
      .then((data) => {
        if (cancelled || !data) return;
        setProduct(data);
        if (!data.variants?.length) return;
        // Start on the variant from the URL, else the first one.
        const preselected = variantId ? data.variants.find((v) => v.id === Number(variantId)) : undefined;
        const initial = preselected || data.variants[0];
        const isManual = data.variants.some((v) => (v.supplier ?? "").toUpperCase() === "MANUAL");
        setSelectedColor(initial.color);
        setSelectedSize(initial.size_details);
        setVariantData(initial);
        setSelectedOptions(isManual ? getVariantOptionValues(initial) : {});
        setInCart(Boolean(initial.is_in_cart));
        setQuantity(initial.min_order_quantity || 1);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, variantId]);

  /** Re-fetch after adding to cart (fresh `is_in_cart` flags) without the
   *  loading skeleton and without touching the shopper's selection. */
  const refreshProduct = async () => {
    try {
      const data = await fetchProductData(id);
      if (!data) return;
      setProduct(data);
      const current = data.variants?.find((v) => v.id === variantData?.id);
      if (current) setVariantData(current);
    } catch (e) {
      console.error(e);
    }
  };

  /** Pick the variant for a colour/size combination (sizeless products match on colour). */
  const selectColorSize = (color: string, size: Size | null) => {
    const match = product?.variants.find((v) =>
      !v.size_id ? v.color === color : v.color === color && !!size && v.size_id === size.id
    );
    if (!match) return;
    setVariantData(match);
    setInCart(Boolean(match.is_in_cart));
    setQuantity(match.min_order_quantity || 1);
  };
  /* handlers */
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const first = product?.variants.find((v) => v.color === color);
    if (first) {
      setSelectedSize(first.size_details);
      selectColorSize(color, first.size_details);
    }
  };
  const handleSizeChange = (size: Size) => {
    setSelectedSize(size);
    if (selectedColor) selectColorSize(selectedColor, size);
  };

  // Prefer the variant matching every selected option; if that combination
  // doesn't exist, jump to the first variant carrying the clicked value.
  const handleOptionChange = (name: string, value: string) => {
    if (!product) return;
    const next = { ...selectedOptions, [name]: value };
    const matches = (v: Variant, want: Record<string, string>) => {
      const opts = manualVariantOptions.get(v.id) ?? {};
      return Object.entries(want).every(([k, val]) => opts[k] === val);
    };
    const match =
      product.variants.find((v) => matches(v, next)) ||
      product.variants.find((v) => matches(v, { [name]: value }));
    if (!match) return;
    setSelectedOptions(manualVariantOptions.get(match.id) ?? next);
    setVariantData(match);
    setInCart(Boolean(match.is_in_cart));
    setQuantity(match.min_order_quantity || 1);
  };

  const resumePayload = (): ProductResumePayload | null =>
    product && variantData ? { productId: String(product.id), variantId: variantData.id, quantity } : null;

  const handleWishlist = async () => {
    if (!product || !variantData) return;
    if (requireLogin({ type: PRODUCT_WISHLIST_ACTION, payload: resumePayload() })) return;
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
    if (isDirectAdd) return;
    router.push(`/customization/${product.id}/${variantData.id}`);
  };

  const handleAddToCart = () => {
    if (!product || !variantData) return;
    if (requireLogin({ type: PRODUCT_ADD_TO_CART_ACTION, payload: resumePayload() })) return;
    setShowConfigurationModal(true);
  };

  const selectVariant = (v: Variant) => {
    setSelectedColor(v.color);
    setSelectedSize(v.size_details);
    setVariantData(v);
    setSelectedOptions(manualVariantOptions.get(v.id) ?? {});
    setInCart(Boolean(v.is_in_cart));
  };

  // Add only — never toggle off something already saved.
  const resumeAddToWishlist = async (v: Variant) => {
    if (!product) return;
    try {
      setWishlistLoading(true);
      const res = await GetWishlistApi();
      const items: { product_id: number; variant_id?: number }[] = res?.data?.data ?? [];
      const exists = items.some((i) => i.product_id === Number(product.id) && i.variant_id === v.id);
      if (!exists) {
        const image =
          v.images?.[0]?.file_uri || product.attachments?.[0]?.file_uri || "";
        await addToWishlist({
          product_id: Number(product.id),
          variant_id: v.id,
          name: product.name,
          price: Number(v.price) || 0,
          image,
        });
      }
      await fetchWishlist();
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
    }
  };

  /* ── resume after login ──
     Back from /login (or from a cancelled login) with a pending action for
     this product: re-select the saved variant + quantity, then — only when
     actually logged in — take the action (which removes it, so it runs once)
     and continue it. */
  const resumeCheckedRef = useRef(false);
  useEffect(() => {
    resumeCheckedRef.current = false;
  }, [id]);
  useEffect(() => {
    if (!product || !variantData || resumeCheckedRef.current) return;
    const forThisProduct = (p: ProductResumePayload) => String(p?.productId) === String(product.id);
    const pending =
      peekPendingAuthAction<ProductResumePayload>(PRODUCT_ADD_TO_CART_ACTION, forThisProduct) ??
      peekPendingAuthAction<ProductResumePayload>(PRODUCT_WISHLIST_ACTION, forThisProduct);
    if (!pending) {
      resumeCheckedRef.current = true;
      return;
    }
    const target = product.variants.find((v) => v.id === Number(pending.payload.variantId));
    if (target && target.id !== variantData.id) {
      // Select the saved variant first; this effect runs again once it is active.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage
      selectVariant(target);
      return;
    }
    resumeCheckedRef.current = true;
    if (pending.payload.quantity > 0) setQuantity(pending.payload.quantity);

    // Login was cancelled: selections are back, the action waits for a login.
    if (!hasAuthToken()) return;
    if (!takePendingAuthAction(pending.type, forThisProduct)) return;

    if (pending.type === PRODUCT_ADD_TO_CART_ACTION) {
      setShowConfigurationModal(true);
      toast.success("Welcome back! Pick up where you left off.");
    } else {
      resumeAddToWishlist(target ?? variantData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, variantData]);

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

        const unitPrice = Number(v.price);
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
      <section className="container max-w-7xl py-6 lg:py-10" aria-busy="true" aria-label="Loading product">
        <div className="mb-6 h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-14">
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-muted" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 w-16 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
          <div className="space-y-5 pt-2">
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-9 w-4/5 rounded bg-muted" />
            <div className="h-7 w-1/4 rounded bg-muted" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
            </div>
            <div className="mt-6 h-12 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </section>
    );
  }
  if (!product) {
    return (
      <section className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This product may have been removed or is no longer available.
        </p>
        <Button asChild variant="hero">
          <Link href="/categories?view=all">Browse all products</Link>
        </Button>
      </section>
    );
  }

  const sageNetPrice =
    variantData?.supplier === "SAGE"
      ? product?.variants[0]?.pricing_tiers_customer?.[0]?.net
      : undefined;
  const displayPrice = sageNetPrice != null
    ? sageNetPrice
    : variantData?.price != null
      ? Number(variantData.price)
      : Number(product?.price ?? 0);

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
  const isPreMade = isGrandCategory(grandCategory?.title, "preMade");
  // MANUAL-supplier products skip the customizer — they customize and add to
  // cart inline via ManualCustomizationPage.
  const isManualSupplier = isManualProduct;
  const isDirectAdd = isPreMade || isManualSupplier;
  const isApparel = isGrandCategory(grandCategory?.title, "apparel");
  const isPromo = isGrandCategory(grandCategory?.title, "promo");

  const configModalVariants = product.variants.map((v) => ({
    ...v,
    price: Number(v.price)
  }));
  const configModalSelectedVariant = variantData
    ? {
      ...variantData,
      price: Number(variantData.price),

    }
    : undefined;

  // Values that no variant carries can't be picked.
  const manualOptions = manualOptionGroups.map((g) => ({
    name: g.name,
    displayStyle: g.displayStyle,
    values: g.values.map((value) => ({
      value,
      available: Array.from(manualVariantOptions.values()).some((opts) => opts[g.name] === value),
    })),
  }));
  const manualPricing = isManualSupplier ? parseManualMeta(variantData?.meta) : null;
  const manualVariantLabel =
    manualOptionGroups.map((g) => selectedOptions[g.name]).filter(Boolean).join(" / ") || variantData?.sku || "";

  /* ───────────────────────────────────────────────── render */
  return (
    <div>
      <LoginPromptModal open={showLoginModal} onSignIn={goToLogin} onCancel={cancelLogin} />

      <section className="container max-w-7xl py-6 lg:py-10">
        {/* ── BREADCRUMB ── */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <ol className="flex min-w-0 items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={12} /></li>
            <li>
              <Link href="/categories?view=all" onClick={backToProducts} className="transition-colors hover:text-foreground">
                Products
              </Link>
            </li>
            {category?.title && (
              <>
                <li aria-hidden="true"><ChevronRight size={12} /></li>
                <li className="capitalize">{category.title}</li>
              </>
            )}
            <li aria-hidden="true" className="hidden sm:block"><ChevronRight size={12} /></li>
            <li className="hidden min-w-0 truncate font-medium text-foreground sm:block" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-14">
          {/* ── GALLERY ── */}
          <div className="self-start lg:sticky lg:top-24">
            <ProductGallery attachments={displayAttachments} />
          </div>

          {/* ── DETAILS & PURCHASE ── */}
          <div className="flex min-w-0 flex-col gap-6">
            {category?.title && (
              <span className="inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                {category.title}
              </span>
            )}

            <ProductInfo
              name={product.name}
              price={displayPrice}
              variants={product.variants}
              sizes={product.sizes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={handleColorChange}
              onSizeChange={handleSizeChange}
              brandName={product?.brand?.name}
              brandLogo={product?.brand?.logo_url}
              manualOptions={isManualSupplier ? manualOptions : undefined}
              selectedOptions={selectedOptions}
              onOptionChange={handleOptionChange}
              manualPricing={manualPricing}
            />

            {/* MANUAL-supplier products customize and add to cart inline. */}
            {isManualSupplier && variantData && (
              <ManualCustomizationPage
                productId={product.id}
                variant={variantData}
                variantLabel={manualVariantLabel}
                onBeforeAdd={requireLogin}
                onAdded={refreshCart}
              />
            )}

            <div className="flex flex-col gap-3">
              {/* Customize (apparel / promo) or Add to Cart (Pre-Made). */}
              {isManualSupplier ? null : isPreMade ? (
                <Button
                  variant={inCart ? "secondary" : "hero"}
                  size="lg"
                  className="h-12 w-full"
                  onClick={handleAddToCart}
                  disabled={inCart}
                >
                  {inCart ? <CheckCircle2 /> : <ShoppingCart />}
                  {inCart ? "In your cart" : "Add to cart"}
                </Button>
              ) : (
                <Button variant="hero" size="lg" className="group h-12 w-full" onClick={handleCustomize}>
                  <Sparkles className="transition-transform duration-300 group-hover:rotate-12" />
                  Customize this product
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className={cn("h-12 w-full", inWishlist && "bg-foreground text-background hover:bg-foreground/90")}
                onClick={handleWishlist}
                disabled={wishlistLoading}
                aria-pressed={inWishlist}
              >
                {wishlistLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Heart fill={inWishlist ? "currentColor" : "none"} className={cn(inWishlist && "text-primary")} />
                )}
                {inWishlist ? "Saved" : "Save for later"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── DETAILS ── */}
        <div className="mt-14 lg:mt-20">
          <ProductAccordion description={product.description} />
        </div>
      </section>

      {/* ── CONFIGURATION MODAL (mounted per opening, so it starts fresh) ── */}
      {showConfigurationModal && variantData && (
        <AddProductConfigurationModal
          open={showConfigurationModal}
          onClose={() => setShowConfigurationModal(false)}
          onConfirm={handleConfigurationComplete}
          productName={product.name}
          variants={configModalVariants}
          sizes={product.sizes}
          selectedVariant={configModalSelectedVariant}
          mode="premade"
          isSubmitting={configurationLoading}
          isApparel={isApparel}
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
              ? configuredVariants.reduce((sum, cv) => sum + cv.totalQty, 0)
              : quantity
          }
          sageMetaStr={variantData.meta ?? null}
          customization={customizationJson}
          canvasBlob={null}
          printPricePerPiece={0}
          digitizingFee={0}
          configuredVariants={configuredVariants.length > 0 ? configuredVariants : undefined}
          isApparel={isApparel}
          onSuccess={() => {
            refreshCart();
            setInCart(true);
            setShowCartModal(false);
            setConfiguredVariants([]);
            refreshProduct();
          }}
        />
      )}

    </div>
  );
}