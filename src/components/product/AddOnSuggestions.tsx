"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import ProxyImage from "@/components/ProxyImage";
import { ProductAddonsApi } from "@/api/operations/product.api";
import { formatMoney } from "./customization/pricing";

export interface ProductAddon {
  id: number;
  addon_product_id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  /** JSON-encoded string[] from the API. */
  features?: string | null;
  price?: number | null;
  addon_price?: number | null;
  sort_order?: number;
}

const parseFeatures = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((f) => typeof f === "string" && f.trim()) : [];
  } catch {
    return [];
  }
};

/** Add-ons configured for a product (GET add-on/product/:id/addons), shown
 * after a successful add to cart. Cards are toggleable; the parent owns the
 * selection. */
export default function AddOnSuggestions({
  productId,
  addons: providedAddons,
  selected = [],
  onSelectionChange,
}: {
  productId: string | number;
  /** Already-fetched add-ons; skips the request when given. */
  addons?: ProductAddon[];
  selected?: ProductAddon[];
  onSelectionChange?: (next: ProductAddon[]) => void;
}) {
  const [fetchedAddons, setAddons] = useState<ProductAddon[]>([]);
  const [fetching, setLoading] = useState(!providedAddons);
  const addons = providedAddons ?? fetchedAddons;
  const loading = !providedAddons && fetching;

  useEffect(() => {
    if (providedAddons) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await ProductAddonsApi(productId);
        console.log(res,"res===>>")
        const data: ProductAddon[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (!cancelled) {
          setAddons([...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        }
      } catch {
        if (!cancelled) setAddons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const isSelected = (a: ProductAddon) => selected.some((s) => s.id === a.id);
  const toggle = (a: ProductAddon) =>
    onSelectionChange?.(isSelected(a) ? selected.filter((s) => s.id !== a.id) : [...selected, a]);

  // Nothing to suggest — render nothing rather than an empty rail.
  if (!loading && addons.length === 0) return null;

  return (
    <section className="addon-section" aria-label="Available add-ons">
      <p
        className="text-sm font-bold tracking-widest uppercase mb-3"
        style={{ color: "#111", fontFamily: "var(--font-heading)" }}
      >
        Complete Your Order
      </p>

      <div className="addon-rail">
        {loading
          ? Array.from({ length: 2}).map((_, i) => (
              <div key={i} className="addon-card">
                <div className="aspect-video animate-pulse" style={{ background: "#F5F5F5" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 animate-pulse" style={{ background: "#EFEFEF" }} />
                  <div className="h-3 w-1/2 animate-pulse" style={{ background: "#EFEFEF" }} />
                </div>
              </div>
            ))
          : addons.map((a) => {
              const price = Number(a.addon_price ?? a.price ?? 0);
              const original = Number(a.price ?? 0);
              const features = parseFeatures(a.features);
              const checked = isSelected(a);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a)}
                  aria-pressed={checked}
                  className={`addon-card text-left${checked ? " is-selected" : ""}`}
                >
                  <div className="relative aspect-video overflow-hidden" style={{ background: "#fafafa" }}>
                    {a.image && (
                      <ProxyImage src={a.image} alt={a.name} fill sizes="200px" className="object-contain p-3" />
                    )}
                    <span
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center border"
                      style={{ background: checked ? "#111" : "#fff", borderColor: checked ? "#111" : "#D4D4D4" }}
                    >
                      {checked && <Check size={12} strokeWidth={3} style={{ color: "#F5D800" }} />}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: "#111" }}>
                      {a.name}
                    </p>
                    {a.description && (
                      <p className="text-[11px] leading-snug line-clamp-2" style={{ color: "#6B7280" }}>
                        {a.description}
                      </p>
                    )}
                    {features.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {features.slice(0, 2).map((f) => (
                          <li key={f} className="flex items-start gap-1 text-[11px] leading-snug" style={{ color: "#6B7280" }}>
                            <Check size={11} className="mt-[2px] flex-shrink-0" style={{ color: "#b89000" }} />
                            <span className="line-clamp-2">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-auto pt-1.5">
                      <span className="text-sm font-bold" style={{ color: "#111" }}>
                        ${formatMoney(price)}
                      </span>
                      {original > price && (
                        <span className="text-[11px] line-through" style={{ color: "#a09b96" }}>
                          ${formatMoney(original)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>

      <style>{`
        .addon-section { animation: addonIn .28s ease both; }
        @keyframes addonIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .addon-rail {
          display: grid; grid-auto-flow: column; gap: 12px;
          grid-auto-columns: calc((100% - 24px) / 2);
          overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain;
          padding-bottom: 6px; scrollbar-width: thin;
        }
        .addon-card {
          display: flex; flex-direction: column; background: #fff; border: 1px solid #E5E5E5;
          scroll-snap-align: start; transition: box-shadow .2s ease, border-color .2s ease;
        }
        .addon-card:hover { border-color: #d8d3ce; box-shadow: 0 8px 24px rgba(26,22,18,0.08); }
        .addon-card.is-selected { border-color: #111; box-shadow: 0 0 0 1px #111; }
        @media (max-width: 640px) {
          .addon-rail { grid-auto-columns: 44%; gap: 10px; }
        }
      `}</style>
    </section>
  );
}
