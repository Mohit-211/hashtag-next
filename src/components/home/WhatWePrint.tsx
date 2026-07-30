"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CategoryCard from "@/components/common/CategoryCard";
import { IndustryApi } from "@/api/operations/product.api";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ Adjust to match your backend's actual field names once confirmed via
// the console.log below.
// ─────────────────────────────────────────────────────────────────────────────
interface Industry {
  id: number | string;
  slug: string;
  title: string;
  image: string;
  productsCount?: number;
}

export default function WhatWePrint() {
  const [categories, setCategories] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchIndustries = async () => {
      try {
        setLoading(true);
        const res = await IndustryApi({ page: 1, limit: 10 });
        console.log(res, "res")
        console.log(res?.data?.data?.data, " res?.data?.data")
        // 👇 uncomment temporarily to inspect the real shape
        // console.log(JSON.stringify(res?.data, null, 2));

        // ⚠️ adjust based on your actual response envelope — common shapes:
        // res.data.data.items → { data: { items: [...], total } }
        // res.data.data       → { data: [...] }
        // res.data.items      → { items: [...] }
        // res.data            → [...]
        const items =
          res?.data?.data?.data

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
              // Deep-links to a dedicated /categories/industry/[id]/[slug]
              // route so the Categories page selects this INDUSTRY (via the
              // same handleIndustrySelect mechanism the sidebar's Industry
              // facet uses) AND auto-selects every category under every
              // use case belonging to that industry — see the
              // `qIndustryId` restore block in useCategoriesView.ts — so the
              // product grid immediately shows every product across all of
              // this industry's use cases, with no extra clicks.
              <Link key={cat.id} href={`/categories/industry/${cat.id}/${cat.slug}`}>
                <CategoryCard
                  image={cat.image}
                  title={cat.title}
                  count={cat.productsCount ?? 0}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}