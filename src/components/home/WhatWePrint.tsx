"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import CategoryCard from "@/components/common/CategoryCard";
import { IndustryApi } from "@/api/operations/product.api";
import type { ParentCategory } from "@/data/types";

interface UseCase {
  id: number;
  title: string;
  slug?: string;
  image?: string;
  parent_categories?: ParentCategory[];
}

interface Industry {
  id: number | string;
  slug: string;
  title: string;
  image: string;
  productsCount?: number;
  use_cases?: UseCase[];
}

export default function WhatWePrint() {
  const router = useRouter();
  const [categories, setCategories] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndustry, setActiveIndustry] = useState<Industry | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchIndustries = async () => {
      try {
        setLoading(true);
        const res = await IndustryApi({ page: 1, limit: 20 });

        const raw: any[] = Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
        const items: Industry[] = raw.map((ind: any) => ({
          id: ind.id,
          slug: ind.slug ?? "",
          title: ind.title ?? ind.name ?? "",
          image: ind.image,
          productsCount: ind.product_count ?? ind.productsCount ?? ind.count ?? undefined,
          use_cases: Array.isArray(ind.use_cases)
            ? ind.use_cases
                .filter((uc: any) => uc?.is_active !== false)
                .map((uc: any) => ({
                  id: uc.id,
                  title: uc.title ?? uc.name ?? "",
                  slug: uc.slug ?? "",
                  image: uc.image,
                  parent_categories: Array.isArray(uc.parent_categories)
                    ? uc.parent_categories.map((p: any) => ({
                        id: p.id,
                        title: p.title ?? p.name ?? "",
                        slug: p.slug ?? "",
                        count: p.product_count ?? p.count ?? undefined,
                      }))
                    : [],
                }))
            : [],
        }));

        if (mounted) {
          setCategories(items);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        if (mounted) setError("Failed to load industries.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchIndustries();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeIndustry) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndustry(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndustry]);

  const handleIndustryClick = (industry: Industry) => {
    if ((industry.use_cases ?? []).length > 0) {
      setActiveIndustry(industry);
    } else {
      router.push(`/categories/industry/${industry.id}/${industry.slug}`);
    }
  };

  const handleViewAllProducts = (industry: Industry) => {
    setActiveIndustry(null);
    router.push(`/categories/industry/${industry.id}/${industry.slug}`);
  };

  const handleSelectUseCases = (useCases: UseCase[]) => {
    const ids = Array.from(
      new Set(useCases.flatMap((uc) => (uc.parent_categories ?? []).map((c) => String(c.id))))
    );
    setActiveIndustry(null);
    if (ids.length === 0) return;
    router.push(`/categories?category_id=${ids.join(",")}`);
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
            WHAT WE PRINT
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Print Solutions for Every Need
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Find customized solutions built for your industry, with products and services designed to support your brand, customers, and business goals.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No industries available right now.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="text-left"
                onClick={() => handleIndustryClick(cat)}
              >
                <CategoryCard
                  image={cat.image}
                  title={cat.title}
                  count={cat.productsCount ?? 0}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {activeIndustry && (
        <IndustryUseCaseModal
          industry={activeIndustry}
          onClose={() => setActiveIndustry(null)}
          onViewAll={() => handleViewAllProducts(activeIndustry)}
          onConfirm={handleSelectUseCases}
        />
      )}
    </section>
  );
}

interface IndustryUseCaseModalProps {
  industry: Industry;
  onClose: () => void;
  onViewAll: () => void;
  onConfirm: (useCases: UseCase[]) => void;
}

/** Shown after clicking an industry card on the homepage: lets the shopper
 * either browse every product in that industry, or check off one or more
 * of its use cases (using the same real category ids the /categories
 * sidebar and use-case gate use) before confirming. */
function IndustryUseCaseModal({ industry, onClose, onViewAll, onConfirm }: IndustryUseCaseModalProps) {
  const useCases = industry.use_cases ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const toggleUseCase = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = useCases.length > 0 && selectedIds.size === useCases.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(useCases.map((uc) => uc.id)));

  const selectedUseCases = useCases.filter((uc) => selectedIds.has(uc.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Choose use cases for ${industry.title}`}
      className="wwp-modal-backdrop"
      onClick={onClose}
    >
      <div className="wwp-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="wwp-modal-header">
          <div>
            <div className="wwp-modal-eyebrow">{industry.title}</div>
            <h2 className="wwp-modal-title">What are you shopping for?</h2>
          </div>
          <button type="button" className="wwp-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="wwp-modal-body">
          <button type="button" className="wwp-modal-viewall" onClick={onViewAll}>
            View all {industry.title} products
          </button>

          {useCases.length > 0 && (
            <>
              <label className="wwp-modal-selectall">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                <span>Select all use cases</span>
              </label>
              <div className="wwp-modal-list">
                {useCases.map((uc) => (
                  <label key={uc.id} className="wwp-modal-usecase-row">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(uc.id)}
                      onChange={() => toggleUseCase(uc.id)}
                    />
                    <span>{uc.title}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {useCases.length > 0 && (
          <div className="wwp-modal-footer">
            <button type="button" className="wwp-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="wwp-modal-confirm"
              disabled={selectedUseCases.length === 0}
              onClick={() => onConfirm(selectedUseCases)}
            >
              View products{selectedUseCases.length > 0 ? ` (${selectedUseCases.length})` : ""}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .wwp-modal-backdrop {
          position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
          padding: 20px; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
        }
        .wwp-modal-panel {
          width: 100%; max-width: 440px; max-height: 82vh; display: flex; flex-direction: column;
          background: var(--color-background, #fff); border-radius: 18px; overflow: hidden;
          box-shadow: 0 12px 48px rgba(0,0,0,0.22);
        }
        .wwp-modal-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 20px 20px 16px; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
        }
        .wwp-modal-eyebrow {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--color-primary); margin-bottom: 4px;
        }
        .wwp-modal-title { font-size: 19px; font-weight: 700; color: var(--color-foreground); line-height: 1.25; }
        .wwp-modal-close {
          display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0;
          border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-muted-foreground);
          transition: background .15s ease, color .15s ease;
        }
        .wwp-modal-close:hover { background: var(--color-secondary); color: var(--color-foreground); }
        .wwp-modal-body { padding: 14px 20px 20px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
        .wwp-modal-viewall {
          width: 100%; text-align: left; font-size: 13.5px; font-weight: 600; color: var(--color-primary-foreground, #fff);
          background: var(--color-primary); padding: 12px 14px; border-radius: 10px; margin-bottom: 14px;
          transition: opacity .15s ease;
        }
        .wwp-modal-viewall:hover { opacity: 0.9; }
        .wwp-modal-selectall {
          display: flex; align-items: center; gap: 9px; width: 100%; cursor: pointer;
          font-size: 12.5px; font-weight: 600; color: var(--color-foreground);
          padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid var(--color-border);
        }
        .wwp-modal-list { display: flex; flex-direction: column; gap: 6px; }
        .wwp-modal-usecase-row {
          display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; cursor: pointer;
          font-size: 13.5px; font-weight: 500; color: var(--color-foreground); padding: 11px 14px; border-radius: 10px;
          border: 1px solid var(--color-border); transition: background .15s ease, border-color .15s ease;
        }
        .wwp-modal-usecase-row:hover { background: var(--color-secondary); border-color: var(--color-primary); }
        .wwp-modal-selectall input, .wwp-modal-usecase-row input { accent-color: var(--color-primary); width: 16px; height: 16px; flex-shrink: 0; }
        .wwp-modal-footer {
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
          padding: 14px 20px; border-top: 1px solid var(--color-border); flex-shrink: 0;
        }
        .wwp-modal-cancel {
          font-size: 13.5px; font-weight: 500; color: var(--color-muted-foreground); padding: 9px 14px; border-radius: 10px;
          transition: color .15s ease, background .15s ease;
        }
        .wwp-modal-cancel:hover { color: var(--color-foreground); background: var(--color-secondary); }
        .wwp-modal-confirm {
          font-size: 13.5px; font-weight: 600; color: var(--color-primary-foreground, #fff); background: var(--color-primary);
          padding: 10px 18px; border-radius: 10px; transition: opacity .15s ease;
        }
        .wwp-modal-confirm:hover { opacity: 0.9; }
        .wwp-modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
