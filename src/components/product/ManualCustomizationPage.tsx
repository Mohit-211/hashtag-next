"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Crop, FileImage, ImagePlus, Loader2, Minus, Plus, ShoppingCart, Sparkles, Trash2, Type, Undo2, UploadCloud } from "lucide-react";
import ImageCropDialog from "@/components/product/ImageCropDialog";
import {
  hasAuthToken,
  peekPendingAuthAction,
  takePendingAuthAction,
  type LoginResumeRequest,
} from "@/lib/authRedirect";
import { clearPendingFiles, loadPendingFiles, type PendingFileEntry } from "@/lib/pendingAuthFiles";
import { cn } from "@/lib/utils";
import { ProductAddonsApi, ProductCustomizationsApi } from "@/api/operations/product.api";
import { ManualAddToCartApi } from "@/api/operations/cart.api";
import { buildManualCartRequest, MANUAL_CART_TYPE } from "@/components/product/manualCartPayload";
import { type ProductAddon } from "@/components/product/AddOnSuggestions";
import AddOnModal from "@/components/product/AddOnModal";
import {
  findManualTier,
  getManualUnitPrice,
  getPromoMinQty,
  parseManualMeta,
} from "@/components/product/customization/Productcustomizationpage";
import { calculateVariantTotal, formatMoney } from "@/components/product/customization/pricing";

/* ── GET customization-option/product/:id/customizations ── */
interface CustomizationTier {
  id: number;
  min_quantity: number;
  max_quantity: number | null;
  price: string;
  is_active: boolean;
}
interface CustomizationOptionValue {
  id: number;
  customization_option_id: number;
  name: string;
  pricing_type: "FIXED" | "TIERED";
  fixed_price: string | null;
  is_active: boolean;
  pricing?: CustomizationTier[];
}
interface CustomizationOption {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  allow_text_input: boolean;
  allow_image_upload: boolean;
  is_active: boolean;
  /** Every value the option defines, with its pricing tiers. */
  values: CustomizationOptionValue[];
}
interface ProductCustomization {
  id: number;
  product_id: number;
  customization_option_id: number;
  is_active: boolean;
  option: CustomizationOption;
  /** The subset of option values enabled for this product. */
  values: {
    id: number;
    customization_option_value_id: number;
    is_active: boolean;
    value: CustomizationOptionValue;
  }[];
}

interface Selection {
  valueId: number | null;
  text: string;
  images: UploadedImage[];
}

interface UploadedImage {
  id: string;
  /** What gets uploaded — the cropped version once the image has been cropped. */
  file: File;
  /** The file as picked; crops always start from this. */
  original: File;
}

export interface ManualCustomizationVariant {
  id: number;
  price: string | number;
  size?: string | null;
  size_id?: number | null;
  stock?: number | null;
  min_order_quantity?: number | null;
  meta?: string | null;
  images?: unknown[];
}

export const MANUAL_ADD_TO_CART_ACTION = "product:manual-add-to-cart";
interface ManualResumePayload {
  productId: string;
  variantId: number;
  qty: number;
  selections: {
    customizationId: number;
    valueId: number | null;
    text: string;
    /** Files are in IndexedDB under "<customizationId>:<id>:original|file". */
    images: { id: string; cropped: boolean }[];
  }[];
  addons?: ProductAddon[];
}

const TEXT_MAX = 100;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MAX_COUNT = 5;

/* ── accepted uploads: SVG, AI only ──
   A file is accepted when either its extension or its MIME type matches:
   browsers often report SVG/AI with an empty or generic type
   (AI is usually "application/postscript", "application/pdf" or ""). */
const RASTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const RASTER_MIME = ["image/jpeg", "image/png", "image/webp"];
const UPLOAD_EXTENSIONS = ["svg", "ai"];
const UPLOAD_MIME = ["image/svg+xml", "application/postscript", "application/illustrator"];
const UPLOAD_ACCEPT = [...UPLOAD_EXTENSIONS.map((e) => `.${e}`), ...UPLOAD_MIME].join(",");
const fileExt = (f: File) => (f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "");
const isAcceptedUpload = (f: File) => UPLOAD_EXTENSIONS.includes(fileExt(f)) || UPLOAD_MIME.includes(f.type);
const isSvg = (f: File) => fileExt(f) === "svg" || f.type === "image/svg+xml";
/** Croppable: re-encoding is fine for bitmaps; vectors (SVG/AI) are kept as uploaded. */
const isRaster = (f: File) => RASTER_EXTENSIONS.includes(fileExt(f)) || RASTER_MIME.includes(f.type);
/** Browsers can draw bitmaps and SVG, not AI. */
const canPreview = (f: File) => isRaster(f) || isSvg(f);

/** Per-unit price of a value at the given quantity. */
const getValueUnitPrice = (value: CustomizationOptionValue, qty: number): number => {
  if (value.pricing_type === "TIERED") {
    const tiers = (value.pricing ?? [])
      .filter((t) => t.is_active !== false)
      .map((t) => ({ min_qty: Number(t.min_quantity), max_qty: t.max_quantity, price: Number(t.price) }))
      .sort((a, b) => a.min_qty - b.min_qty);
    return findManualTier(tiers, qty)?.price ?? 0;
  }
  return Number(value.fixed_price ?? 0) || 0;
};

/** Customization for MANUAL-supplier products, rendered inline on the product
 * page: pick a value per option (+ optional text / logo), pick a quantity,
 * then add to cart with the selections in the cart customization payload. */
export default function ManualCustomizationPage({
  productId,
  variant,
  variantLabel,
  inCart,
  onBeforeAdd,
  onAdded,
}: {
  productId: string | number;
  variant: ManualCustomizationVariant;
  /** Human label for the selected variant, e.g. "10 / A4 / Pink". */
  variantLabel: string;
  inCart?: boolean;
  /** Return true to block the add (e.g. login required); `resume` lets it continue after login. */
  onBeforeAdd?: (resume: LoginResumeRequest) => boolean;
  onAdded?: () => void;
}) {
  const [customizations, setCustomizations] = useState<ProductCustomization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selections, setSelections] = useState<Record<number, Selection>>({});
  const [submitting, setSubmitting] = useState(false);
  // Picked in the add-on modal that Add to Cart opens, and sent in the same request.
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  // null until loaded; products without add-ons skip the modal.
  const [availableAddons, setAvailableAddons] = useState<ProductAddon[] | null>(null);
  const [addonModalOpen, setAddonModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAvailableAddons(null);
    setAddonModalOpen(false);
    (async () => {
      try {
        const res = await ProductAddonsApi(productId);
        const data: ProductAddon[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (!cancelled) setAvailableAddons([...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
      } catch {
        if (!cancelled) setAvailableAddons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const res = await ProductCustomizationsApi(productId);
        const data: ProductCustomization[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (!cancelled) {
          setCustomizations(data);
          setSelections({});
        }
      } catch {
        // The API client already toasts the failure.
        if (!cancelled) {
          setCustomizations([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey]);

  // Active options with their enabled values, priced from option.values
  // (only that copy carries the tier table).
  const groups = useMemo(
    () =>
      customizations
        .filter((c) => c.is_active !== false && c.option?.is_active !== false)
        .map((c) => {
          const full = new Map((c.option.values ?? []).map((v) => [v.id, v]));
          const values = (c.values ?? [])
            .filter((pv) => pv.is_active !== false && pv.value?.is_active !== false)
            .map((pv) => ({ ...pv.value, ...full.get(pv.customization_option_value_id) }))
            .filter((v): v is CustomizationOptionValue => !!v?.id);
          return { customization: c, option: c.option, values };
        })
        .filter((g) => g.values.length > 0),
    [customizations]
  );

  /* ── quantity (same rules as the full customizer's MANUAL flow) ── */
  const manualMeta = useMemo(() => parseManualMeta(variant.meta), [variant.meta]);
  const minQty = getPromoMinQty(variant.meta, variant.min_order_quantity);
  // Tiered: capped at the last range's max_qty (unless open-ended) and stock.
  const tiers = manualMeta?.pricing_mode === "tiered" ? manualMeta.bulk_pricing : [];
  const tierMax = tiers.length > 0 ? tiers[tiers.length - 1].max_qty : null;
  const stockMax = variant.stock && variant.stock > 0 ? variant.stock : null;
  const maxQty =
    tierMax != null && stockMax != null ? Math.min(tierMax, stockMax) : (tierMax ?? stockMax);
  const inTierRange = (n: number) =>
    tiers.some((t) => n >= t.min_qty && (t.max_qty === null || n <= t.max_qty));
  const [qty, setQty] = useState(minQty);
  // Reset to the new minimum when the variant changes.
  const [qtyKey, setQtyKey] = useState(`${variant.id}:${minQty}`);
  if (qtyKey !== `${variant.id}:${minQty}`) {
    setQtyKey(`${variant.id}:${minQty}`);
    setQty(minQty);
  }
  const clampQty = (n: number) => {
    const safe = Math.max(minQty, Math.floor(Number.isFinite(n) ? n : minQty));
    return maxQty != null ? Math.min(safe, maxQty) : safe;
  };

  /* ── pricing ── */
  const basePrice = Number(variant.price) || 0;
  const productUnitPrice = getManualUnitPrice(manualMeta, qty, basePrice) ?? basePrice;
  const activeTier = tiers.length > 0 ? findManualTier(tiers, qty) : null;
  // quantity_fixed: the pack price is the price for the whole pack.
  const packPrice =
    manualMeta?.pricing_mode === "quantity_fixed"
      ? manualMeta.quantity_pricing.find((p) => p.quantity === qty)?.price ?? null
      : null;
  const selectedLines = groups
    .map((g) => {
      const sel = selections[g.customization.id];
      const value = g.values.find((v) => v.id === sel?.valueId);
      return value ? { group: g, value, sel: sel!, unitPrice: getValueUnitPrice(value, qty) } : null;
    })
    .filter((l): l is NonNullable<typeof l> => !!l);
  const decorationUnitPrice = selectedLines.reduce((sum, l) => sum + l.unitPrice, 0);
  const totals = calculateVariantTotal({
    productPrice: productUnitPrice,
    decorationPrice: decorationUnitPrice,
    quantity: qty,
  });
  // Add-on cards show one price per add-on, so it counts once per order.
  const addonPrice = (a: ProductAddon) => Number(a.addon_price ?? a.price ?? 0) || 0;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + addonPrice(a), 0);
  const grandTotal = totals.total + addonsTotal;

  const updateSelection = (id: number, patch: Partial<Selection>) =>
    setSelections((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { valueId: null, text: "", images: [] }), ...patch },
    }));

  const handleFiles = (id: number, picked: File[]) => {
    if (picked.length === 0) return;
    const current = selections[id]?.images ?? [];
    const valid = picked.filter((file) => {
      if (!isAcceptedUpload(file)) {
        toast.error(`${file.name} isn't supported. Upload an SVG or AI file.`);
        return false;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    });
    const room = IMAGE_MAX_COUNT - current.length;
    if (valid.length > room) toast.error(`You can upload up to ${IMAGE_MAX_COUNT} images.`);
    if (room <= 0 || valid.length === 0) return;
    const added = valid
      .slice(0, room)
      .map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, original: file }));
    updateSelection(id, { images: [...current, ...added] });
  };

  const removeImage = (id: number, imageId: string) =>
    updateSelection(id, { images: (selections[id]?.images ?? []).filter((img) => img.id !== imageId) });

  /* ── crop ── */
  const [cropTarget, setCropTarget] = useState<{ groupId: number; image: UploadedImage } | null>(null);
  const applyCrop = (cropped: File) => {
    if (!cropTarget) return;
    const { groupId, image } = cropTarget;
    updateSelection(groupId, {
      images: (selections[groupId]?.images ?? []).map((img) => (img.id === image.id ? { ...img, file: cropped } : img)),
    });
    setCropTarget(null);
  };
  const resetImage = (id: number, imageId: string) =>
    updateSelection(id, {
      images: (selections[id]?.images ?? []).map((img) => (img.id === imageId ? { ...img, file: img.original } : img)),
    });

  const validate = (): boolean => {
    if (manualMeta?.pricing_mode === "quantity_fixed" && !manualMeta.quantity_pricing.some((p) => p.quantity === qty)) {
      toast.error("Please choose one of the available quantity packs.");
      return false;
    }
    if (tiers.length > 0 && !inTierRange(qty)) {
      toast.error(`No price is set for ${qty} pcs. Choose a quantity within one of the price ranges.`);
      return false;
    }
    if (qty < minQty) {
      toast.error(`Minimum order quantity is ${minQty}.`);
      return false;
    }
    if (maxQty != null && qty > maxQty) {
      toast.error(stockMax != null && qty > stockMax ? `Only ${stockMax} in stock.` : `Maximum order quantity is ${maxQty}.`);
      return false;
    }
    return true;
  };

  /* ── login round trip: save everything, restore it, finish the add ── */
  const buildResumeRequest = (addons: ProductAddon[]): LoginResumeRequest => {
    const files: PendingFileEntry[] = [];
    const saved = Object.entries(selections).map(([cid, sel]) => ({
      customizationId: Number(cid),
      valueId: sel.valueId,
      text: sel.text,
      images: sel.images.map((img) => {
        files.push({ key: `${cid}:${img.id}:original`, file: img.original });
        const cropped = img.file !== img.original;
        if (cropped) files.push({ key: `${cid}:${img.id}:file`, file: img.file });
        return { id: img.id, cropped };
      }),
    }));
    const payload: ManualResumePayload = {
      productId: String(productId),
      variantId: variant.id,
      qty,
      selections: saved,
      addons,
    };
    return { type: MANUAL_ADD_TO_CART_ACTION, payload, files };
  };

  // Set right before restored state is committed; the effect below then
  // submits once with that state.
  const autoSubmitRef = useRef(false);
  const restoreCheckedRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    const key = `${productId}:${variant.id}`;
    if (restoreCheckedRef.current === key) return;
    restoreCheckedRef.current = key;

    const forThis = (p: ManualResumePayload) =>
      String(p?.productId) === String(productId) && Number(p?.variantId) === variant.id;
    const pending = peekPendingAuthAction<ManualResumePayload>(MANUAL_ADD_TO_CART_ACTION, forThis);
    if (!pending) return;
    const loggedIn = hasAuthToken();
    // Logged in: take it (removes it, so it can only run once). Cancelled
    // login: just restore and leave it for when they do log in.
    if (loggedIn && !takePendingAuthAction(MANUAL_ADD_TO_CART_ACTION, forThis)) return;

    (async () => {
      const files = new Map((await loadPendingFiles(pending.id)).map((f) => [f.key, f.file]));
      if (loggedIn) clearPendingFiles();
      let lostImages = false;
      const restored: Record<number, Selection> = {};
      pending.payload.selections.forEach((s) => {
        const group = groups.find((g) => g.customization.id === s.customizationId);
        if (!group) return;
        const images = s.images.flatMap((img) => {
          const original = files.get(`${s.customizationId}:${img.id}:original`);
          if (!original) {
            lostImages = true;
            return [];
          }
          const file = (img.cropped && files.get(`${s.customizationId}:${img.id}:file`)) || original;
          return [{ id: img.id, original, file }];
        });
        restored[s.customizationId] = {
          valueId: group.values.some((v) => v.id === s.valueId) ? s.valueId : null,
          text: s.text ?? "",
          images,
        };
      });
      if (lostImages) toast.warning("Some uploaded images couldn't be restored. Please add them again.");
      autoSubmitRef.current = loggedIn && !lostImages;
      setSelections(restored);
      if (Array.isArray(pending.payload.addons)) setSelectedAddons(pending.payload.addons);
      if (pending.payload.qty > 0) setQty(pending.payload.qty);
    })();
  }, [loading, productId, variant.id, groups]);

  // Add to Cart button: validate, then let the customer pick add-ons first
  // (straight to the cart when the product has none).
  const handleAddToCart = () => {
    if (!validate()) return;
    if (availableAddons?.length === 0) {
      submitAddToCart([]);
      return;
    }
    setAddonModalOpen(true);
  };

  const closeAddonModal = () => {
    setAddonModalOpen(false);
    setSelectedAddons([]);
  };

  const submitAddToCart = async (addons: ProductAddon[]) => {
    // Validate first so a login round trip only ever saves a complete order.
    if (!validate()) return;
    setSelectedAddons(addons);
    if (onBeforeAdd?.(buildResumeRequest(addons))) {
      setAddonModalOpen(false);
      return;
    }

    const body = buildManualCartRequest({
      productId: Number(productId),
      type: MANUAL_CART_TYPE,
      variants: [
        {
          variantId: variant.id,
          quantity: qty,
          // Images only for options that allow them.
          lines: selectedLines.map((l) => ({
            optionId: l.group.option.id,
            valueId: l.value.id,
            images: l.group.option.allow_image_upload ? l.sel.images.map((img) => img.file) : [],
          })),
          // Each picked add-on goes with the product quantity.
          addons: addons.map((a) => ({ productAddonId: a.id, quantity: qty })),
        },
      ],
    });

    try {
      setSubmitting(true);
      await ManualAddToCartApi(body);
      toast.success("Added to cart!", { duration: 3000, closeButton: true });
      setAddonModalOpen(false);
      setSelections({});
      setSelectedAddons([]);
      onAdded?.();
    } catch {
      // The API client already toasts the failure.
    } finally {
      setSubmitting(false);
    }
  };

  // Finish the add that was interrupted by login, with the restored state.
  useEffect(() => {
    if (!autoSubmitRef.current) return;
    autoSubmitRef.current = false;
    toast.info("Welcome back! Adding your item to the cart…");
    // Add-ons were already picked before the login, and restored with the rest.
    submitAddToCart(selectedAddons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections]);

  const sectionLabel = "text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Customization options ── */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading customization options">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="h-3 w-1/4 rounded bg-[#E5E5E5]" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-10 w-24 rounded-lg bg-[#EFEFEF]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#F5C6C6] bg-[#FFF5F5] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#C0392B]">
            <AlertCircle size={16} className="flex-shrink-0" />
            Couldn&apos;t load customization options.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-sm font-semibold text-[#111111] underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      ) : (
        groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map((g) => {
              const sel = selections[g.customization.id];
              const selectedValue = g.values.find((v) => v.id === sel?.valueId);
              return (
                <div key={g.customization.id}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className={sectionLabel}>
                      {g.option.name} <span className="text-xs font-medium normal-case tracking-normal text-[#9CA3AF]">(optional)</span>
                    </p>
                    <p className="text-sm font-semibold text-[#111111] text-right">
                      {selectedValue?.name || "None"}
                    </p>
                  </div>
                  {g.option.description && (
                    <p className="text-xs text-[#6B7280] mb-3">{g.option.description}</p>
                  )}
                  <div className={cn("flex flex-wrap gap-2", !g.option.description && "mt-2")}>
                    {g.values.map((v) => {
                      const isActive = sel?.valueId === v.id;
                      const unit = getValueUnitPrice(v, qty);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => updateSelection(g.customization.id, { valueId: isActive ? null : v.id })}
                          aria-pressed={isActive}
                          className={cn(
                            "min-w-[52px] px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 text-left",
                            isActive
                              ? "bg-[#111111] text-[#E8D03A] border-[#111111]"
                              : "bg-white text-[#111111] border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                          )}
                        >
                          {v.name}
                          <span className={cn("ml-1.5 text-xs font-medium", isActive ? "text-[#E8D03A]/80" : "text-[#6B7280]")}>
                            {unit > 0 ? `+$${formatMoney(unit)}/pc` : "Free"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional text / images for options that allow them */}
                  {selectedValue && (g.option.allow_text_input || g.option.allow_image_upload) && (
                    <div className="mt-4 rounded-xl border border-[#EDEDED] bg-[#FAFAF7] p-4 sm:p-5">
                      <div className="mb-4 flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#E8D03A]">
                          <Sparkles size={15} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#111111]">Personalize your {g.option.name.toLowerCase()}</p>
                          <p className="text-xs text-[#6B7280]">
                            {g.option.allow_text_input && g.option.allow_image_upload
                              ? "Add your text and upload artwork. Both are optional."
                              : g.option.allow_text_input
                                ? "Add the text you want printed. Optional."
                                : "Upload your logo or artwork. Optional."}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        {g.option.allow_text_input && (
                          <label className="block">
                            <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#444]">
                              <span className="flex items-center gap-1.5">
                                <Type size={13} className="text-[#6B7280]" />
                                Custom text
                              </span>
                              <span className={cn("tabular-nums", (sel?.text.length ?? 0) >= TEXT_MAX ? "text-[#C0392B]" : "text-[#9CA3AF]")}>
                                {sel?.text.length ?? 0}/{TEXT_MAX}
                              </span>
                            </span>
                            <input
                              type="text"
                              value={sel?.text ?? ""}
                              maxLength={TEXT_MAX}
                              onChange={(e) => updateSelection(g.customization.id, { text: e.target.value })}
                              placeholder="e.g. your name, company or tagline"
                              className="w-full h-11 rounded-lg border border-[#E5E5E5] bg-white px-3 text-sm text-[#111111] outline-none transition-shadow placeholder:text-[#B0B0B0] focus:border-[#111111] focus:ring-2 focus:ring-[#E8D03A]/40"
                            />
                          </label>
                        )}
                        {g.option.allow_image_upload && (
                          <FilePicker
                            images={sel?.images ?? []}
                            onPick={(f) => handleFiles(g.customization.id, f)}
                            onRemove={(imageId) => removeImage(g.customization.id, imageId)}
                            onCrop={(image) => setCropTarget({ groupId: g.customization.id, image })}
                            onReset={(imageId) => resetImage(g.customization.id, imageId)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Quantity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={sectionLabel}>
            {manualMeta?.pricing_mode === "quantity_fixed" ? "Select Quantity" : "Quantity"}
          </p>
          {manualMeta?.pricing_mode !== "quantity_fixed" && (
            <p className="text-xs text-[#6B7280]">
              Min. {minQty}
              {maxQty != null ? ` · Max. ${maxQty}` : ""} pcs
            </p>
          )}
        </div>
        {manualMeta?.pricing_mode === "quantity_fixed" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {manualMeta.quantity_pricing.map((pkg) => {
              const isActive = qty === pkg.quantity;
              const soldOut = maxQty != null && pkg.quantity > maxQty;
              return (
                <button
                  key={pkg.quantity}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setQty(pkg.quantity)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                    isActive
                      ? "bg-[#111111] border-[#111111]"
                      : soldOut
                        ? "bg-[#F5F5F5] border-[#E5E5E5] opacity-60 cursor-not-allowed"
                        : "bg-white border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                  )}
                >
                  <p className={cn("text-sm font-semibold", isActive ? "text-[#E8D03A]" : "text-[#111111]")}>
                    {pkg.quantity} pcs
                  </p>
                  <p className={cn("text-xs mt-0.5", isActive ? "text-white/70" : "text-[#6B7280]")}>
                    ${formatMoney(pkg.price)} · ${formatMoney(pkg.price / pkg.quantity)}/pc
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <>
          {/* Tiered: price ranges, active one highlighted; click jumps to its min */}
          {tiers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {tiers.map((t) => {
                const isActive = activeTier?.min_qty === t.min_qty && inTierRange(qty);
                return (
                  <button
                    key={t.min_qty}
                    type="button"
                    onClick={() => setQty(clampQty(t.min_qty))}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                      isActive
                        ? "bg-[#111111] border-[#111111]"
                        : "bg-white border-[#E5E5E5] hover:border-[#E8D03A] hover:bg-[#F8F5E7]"
                    )}
                  >
                    <p className={cn("text-sm font-semibold", isActive ? "text-[#E8D03A]" : "text-[#111111]")}>
                      {t.max_qty === null ? `${t.min_qty}+` : `${t.min_qty} – ${t.max_qty}`} pcs
                    </p>
                    <p className={cn("text-xs mt-0.5", isActive ? "text-white/70" : "text-[#6B7280]")}>
                      ${formatMoney(t.price)}/pc
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => clampQty(q - 1))}
              disabled={qty <= minQty}
              className="w-11 h-11 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Quantity"
              value={qty}
              min={minQty}
              max={maxQty ?? undefined}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              onBlur={() => setQty((q) => clampQty(q))}
              className="w-24 h-11 rounded-lg border border-[#E5E5E5] text-center text-sm font-semibold text-[#111111] outline-none focus:border-[#111111]"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => clampQty(q + 1))}
              disabled={maxQty != null && qty >= maxQty}
              className="w-11 h-11 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
          </>
        )}

        {/* Live price for the chosen quantity */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {manualMeta?.pricing_mode === "quantity_fixed" ? (
            <>
              <p className="text-[#6B7280]">
                Selected: <span className="font-semibold text-[#111111]">{packPrice != null ? `${qty} pcs` : "—"}</span>
              </p>
              <p className="text-right text-[#6B7280]">
                Price: <span className="font-semibold text-[#111111]">{packPrice != null ? `$${formatMoney(packPrice)}` : "—"}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-[#6B7280]">
                {tiers.length > 0 ? "Unit Price" : "Price"}:{" "}
                <span className="font-semibold text-[#111111]">${formatMoney(productUnitPrice)}</span>
              </p>
              <p className="text-right text-[#6B7280]">
                Total: <span className="font-semibold text-[#111111]">${formatMoney(totals.productTotal)}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm">
        <div className="flex justify-between py-1 text-[#444]">
          <span>
            {packPrice != null ? `Product · ${qty} pcs pack` : `Product · ${qty} × $${formatMoney(productUnitPrice)}`}
          </span>
          <span className="font-medium text-[#111111]">${formatMoney(totals.productTotal)}</span>
        </div>
        {selectedLines.map((l) => (
          <div key={l.group.customization.id} className="flex justify-between gap-3 py-1 text-[#444]">
            <span className="min-w-0 truncate">
              {l.group.option.name}: {l.value.name}
            </span>
            <span className="font-medium text-[#111111] flex-shrink-0">
              {l.unitPrice > 0 ? `$${formatMoney(l.unitPrice * qty)}` : "Free"}
            </span>
          </div>
        ))}
        {selectedAddons.map((a) => (
          <div key={`addon-${a.id}`} className="flex justify-between gap-3 py-1 text-[#444]">
            <span className="min-w-0 truncate">Add-on: {a.name}</span>
            <span className="font-medium text-[#111111] flex-shrink-0">${formatMoney(addonPrice(a))}</span>
          </div>
        ))}
        <div className="h-px bg-[#E5E5E5] my-2" />
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-[#111111]">Total</span>
          <span className="text-lg font-bold text-[#111111]">${formatMoney(grandTotal)}</span>
        </div>
      </div>

      {/* ── Add to Cart ── */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={submitting || loading || inCart}
        className="w-full h-[52px] flex items-center justify-center gap-2.5 text-sm font-bold tracking-widest uppercase transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-heading)",
          background: inCart ? "#666" : "#111",
          color: inCart ? "#999" : "#fff",
          border: "none",
          opacity: submitting || loading ? 0.8 : 1,
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Adding…
          </>
        ) : inCart ? (
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

      <ImageCropDialog
        file={cropTarget?.image.original ?? null}
        onCancel={() => setCropTarget(null)}
        onDone={applyCrop}
      />

      <AddOnModal
        open={addonModalOpen}
        onClose={closeAddonModal}
        productId={productId}
        name={variantLabel}
        addons={availableAddons ?? undefined}
        selected={selectedAddons}
        onSelectionChange={setSelectedAddons}
        onConfirm={submitAddToCart}
        submitting={submitting}
      />
    </div>
  );
}

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

// Checkerboard so transparent PNG/SVG logos stay visible.
const CHECKER_BG = {
  backgroundColor: "#FFFFFF",
  backgroundImage:
    "linear-gradient(45deg,#F1F1F1 25%,transparent 25%),linear-gradient(-45deg,#F1F1F1 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#F1F1F1 75%),linear-gradient(-45deg,transparent 75%,#F1F1F1 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
};

function FilePicker({
  images,
  onPick,
  onRemove,
  onCrop,
  onReset,
}: {
  images: UploadedImage[];
  onPick: (files: File[]) => void;
  onRemove: (imageId: string) => void;
  onCrop: (image: UploadedImage) => void;
  onReset: (imageId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = images.length >= IMAGE_MAX_COUNT;
  const browse = () => inputRef.current?.click();

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (!full) setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!full) onPick(Array.from(e.dataTransfer.files));
    },
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#444]">
        <span className="flex items-center gap-1.5">
          <ImagePlus size={13} className="text-[#6B7280]" />
          Artwork / logo
        </span>
        <span className="text-[#9CA3AF] tabular-nums">
          {images.length}/{IMAGE_MAX_COUNT}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          onPick(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {images.length === 0 ? (
        <button
          type="button"
          onClick={browse}
          {...dropProps}
          className={cn(
            "group w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200",
            dragging
              ? "border-[#E8D03A] bg-[#FFFBE6] scale-[1.01]"
              : "border-[#D6D6D6] bg-white hover:border-[#111111] hover:bg-[#FCFCFA]"
          )}
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              dragging
                ? "bg-[#E8D03A] text-[#111111]"
                : "bg-[#F3F3F0] text-[#444] group-hover:bg-[#111111] group-hover:text-[#E8D03A]"
            )}
          >
            <UploadCloud size={20} />
          </span>
          <span className="text-sm font-semibold text-[#111111]">
            {dragging ? (
              "Drop images here"
            ) : (
              <>
                Drag &amp; drop or{" "}
                <span className="underline underline-offset-2 decoration-[#E8D03A] decoration-2">browse</span>
              </>
            )}
          </span>
          <span className="text-xs text-[#6B7280]">
            SVG or AI · up to 5 MB each · max {IMAGE_MAX_COUNT} files
          </span>
        </button>
      ) : (
        <div
          {...dropProps}
          className={cn(
            "grid grid-cols-3 sm:grid-cols-4 gap-2.5 rounded-xl transition-colors",
            dragging && "bg-[#FFFBE6] ring-2 ring-[#E8D03A] ring-offset-4 ring-offset-[#FFFBE6]"
          )}
        >
          {images.map((img, i) => (
            <ImageThumb
              key={img.id}
              index={i + 1}
              image={img}
              onCrop={() => onCrop(img)}
              onRemove={() => onRemove(img.id)}
              onReset={() => onReset(img.id)}
            />
          ))}
          {!full && (
            <button
              type="button"
              onClick={browse}
              className="aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#D6D6D6] bg-white text-xs font-semibold text-[#444] transition-colors hover:border-[#111111] hover:text-[#111111]"
            >
              <Plus size={18} />
              Add more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ImageThumb({
  index,
  image,
  onCrop,
  onRemove,
  onReset,
}: {
  index: number;
  image: UploadedImage;
  onCrop: () => void;
  onRemove: () => void;
  onReset: () => void;
}) {
  // Blob URL lives exactly as long as the <img> shows this file.
  const previewRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      // <img> only renders an SVG blob when it is typed as SVG; the File itself is untouched.
      const blob = isSvg(image.file) && image.file.type !== "image/svg+xml"
        ? new Blob([image.file], { type: "image/svg+xml" })
        : image.file;
      const url = URL.createObjectURL(blob);
      el.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [image.file]
  );
  const cropped = image.file !== image.original;
  const previewable = canPreview(image.file);
  const croppable = isRaster(image.original);
  const actionBtn =
    "flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#111111] shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D03A]";

  return (
    <figure className="min-w-0">
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
        style={CHECKER_BG}
      >
        {previewable ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img ref={previewRef} alt={image.original.name} className="h-full w-full object-contain p-1.5" />
        ) : (
          // e.g. Adobe Illustrator — browsers can't draw it, so show a file badge.
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#FAFAF7]">
            <FileImage size={26} className="text-[#6B7280]" />
            <span className="rounded bg-[#111111] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#E8D03A]">
              {fileExt(image.file) || "file"}
            </span>
          </div>
        )}

        <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[10px] font-bold text-[#E8D03A]">
          {index}
        </span>
        {cropped && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#E8D03A] px-1.5 py-0.5 text-[10px] font-bold text-[#111111]">
            <Crop size={10} />
            Cropped
          </span>
        )}

        {/* Actions: always shown on touch screens, on hover / keyboard focus with a mouse */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-linear-to-t from-black/60 to-transparent pb-2 pt-6 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          {croppable && (
            <button type="button" onClick={onCrop} aria-label={`Crop ${image.original.name}`} title="Crop" className={actionBtn}>
              <Crop size={14} />
            </button>
          )}
          {cropped && (
            <button
              type="button"
              onClick={onReset}
              aria-label={`Undo crop on ${image.original.name}`}
              title="Undo crop"
              className={actionBtn}
            >
              <Undo2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${image.original.name}`}
            title="Remove"
            className={cn(actionBtn, "hover:bg-[#C0392B] hover:text-white")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <figcaption className="mt-1 px-0.5">
        <p className="truncate text-[11px] font-medium text-[#444]" title={image.original.name}>
          {image.original.name}
        </p>
        <p className="text-[10px] text-[#9CA3AF]">{formatBytes(image.file.size)}</p>
      </figcaption>
    </figure>
  );
}
